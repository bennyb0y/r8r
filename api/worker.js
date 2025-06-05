// Cloudflare Worker API for Burrito Rater
// This worker handles all API requests and connects to the D1 database and R2 storage

// Helper function to validate Turnstile token
async function validateTurnstileToken(token, ip, env) {
  try {
    // For development environment, accept test tokens
    if (token && token.startsWith('test_verification_token_')) {
      return {
        success: true,
        message: 'Test token accepted'
      };
    }

    // For production environment, validate the token with Cloudflare
    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    
    if (ip) {
      formData.append('remoteip', ip);
    }

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const outcome = await result.json();
    return {
      success: outcome.success,
      errorCodes: outcome.error_codes || [],
      message: outcome.success ? 'Validation successful' : 'CAPTCHA validation failed'
    };
  } catch (error) {
    return {
      success: false,
      errorCodes: ['validation_error'],
      message: 'Error validating CAPTCHA'
    };
  }
}

// Helper function to validate API key
function validateApiKey(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid Authorization header found');
    return false;
  }
  
  const apiKey = authHeader.split(' ')[1];
  console.log('Received API key:', apiKey);
  console.log('Expected API key:', env.R2_API_TOKEN);
  console.log('Keys match:', apiKey === env.R2_API_TOKEN);
  
  return apiKey === env.R2_API_TOKEN;
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins in development
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Helper function to handle CORS preflight requests
function handleOptions() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
}

// Helper function to create a JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
    status,
  });
}

// Helper function to create an error response
function errorResponse(message, status = 400) {
  console.error(`Error ${status}: ${message}`);
  return jsonResponse({ 
    error: message,
    status,
    timestamp: new Date().toISOString()
  }, status);
}

// Helper function to get content type from filename
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return types[ext] || 'application/octet-stream';
}

// Helper function to parse transformation parameters
function parseTransformParams(searchParams) {
  const transformations = {};
  
  // Width
  if (searchParams.has('width')) {
    transformations.width = parseInt(searchParams.get('width'));
  }
  
  // Height  
  if (searchParams.has('height')) {
    transformations.height = parseInt(searchParams.get('height'));
  }
  
  // Fit
  if (searchParams.has('fit')) {
    transformations.fit = searchParams.get('fit');
  }
  
  // Format
  if (searchParams.has('format')) {
    transformations.format = searchParams.get('format');
  }
  
  // Quality
  if (searchParams.has('quality')) {
    transformations.quality = parseInt(searchParams.get('quality'));
  }
  
  // Blur
  if (searchParams.has('blur')) {
    transformations.blur = parseInt(searchParams.get('blur'));
  }

  return transformations;
}

// Main worker event handler
const workerHandler = {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '');
    
    try {
      // Handle image upload endpoint
      if (path === 'images/upload' && request.method === 'POST') {
        // Check API key authentication
        if (!validateApiKey(request, env)) {
          return errorResponse('Unauthorized - Invalid or missing API key', 401);
        }

        const formData = await request.formData();
        const file = formData.get('image');
        
        if (!file) {
          return errorResponse('No image file provided', 400);
        }
        
        // Validate file type
        const contentType = file.type;
        if (!contentType.startsWith('image/')) {
          return errorResponse('Invalid file type. Only images are allowed.', 400);
        }
        
        try {
          // Generate unique filename and store in R2
          const timestamp = Date.now();
          const originalName = file.name;
          const ext = originalName.split('.').pop().toLowerCase();
          const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${ext}`;
          
          await env.BUCKET.put(filename, file.stream(), {
            httpMetadata: {
              contentType: contentType
            }
          });
          
          return jsonResponse({
            success: true,
            filename: filename,
            url: `/images/${filename}`,
            cdnUrl: `https://images.benny.com/cdn-cgi/image/width=800,height=600,fit=cover/${filename}`
          });
        } catch (error) {
          return errorResponse('Failed to upload image', 500);
        }
      }
      
      // Handle image retrieval endpoint
      if (path.startsWith('images/') && path !== 'images/upload' && request.method === 'GET') {
        const filename = path.replace('images/', '');
        const object = await env.BUCKET.get(filename);
        
        if (!object) {
          return errorResponse('Image not found', 404);
        }

        // Get the image data and return with appropriate headers
        const imageData = await object.arrayBuffer();
        return new Response(imageData, {
          headers: {
            'Content-Type': object.httpMetadata.contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=31536000',
          }
        });
      }

      // Handle ratings endpoints
      if (path.startsWith('ratings')) {
        // Handle ratings endpoint
        if (path === 'ratings') {
          if (request.method === 'GET') {
            // Get all ratings using new multi-tenant schema
            // Default to 'burritos' tenant for backward compatibility
            const { results } = await env.DB.prepare(`
              SELECT 
                r.*,
                i.name as item_name,
                i.venue_name,
                i.latitude,
                i.longitude,
                i.zipcode
              FROM ratings r
              JOIN items i ON r.item_id = i.id
              WHERE r.tenant_id = 'burritos' AND r.status = 'confirmed'
              ORDER BY r.created_at DESC
            `).all();
            
            // Transform to legacy format
            const legacyResults = results.map(row => {
              const scores = JSON.parse(row.scores || '{}');
              const reviewerInfo = JSON.parse(row.reviewer_info || '{}');
              const ingredients = reviewerInfo.ingredients || [];
              
              return {
                id: parseInt(row.id.replace('rating_', '')),
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                restaurantName: row.venue_name,
                burritoTitle: row.item_name,
                latitude: row.latitude,
                longitude: row.longitude,
                zipcode: row.zipcode,
                rating: scores.overall || 3,
                taste: scores.taste || 3,
                value: scores.value || 3,
                price: row.price_paid || 0,
                hasPotatoes: ingredients.includes('potatoes'),
                hasCheese: ingredients.includes('cheese'),
                hasBacon: ingredients.includes('bacon'),
                hasChorizo: ingredients.includes('chorizo'),
                hasAvocado: ingredients.includes('avocado'),
                hasVegetables: ingredients.includes('vegetables'),
                review: row.review,
                reviewerName: reviewerInfo.name,
                identityPassword: reviewerInfo.identity_hash,
                generatedEmoji: reviewerInfo.emoji,
                reviewerEmoji: reviewerInfo.emoji,
                confirmed: row.status === 'confirmed' ? 1 : 0,
                image: reviewerInfo.image_filename
              };
            });
            
            return jsonResponse(legacyResults);
          }
          
          if (request.method === 'POST') {
            const data = await request.json();
            
            // Validate CAPTCHA
            const turnstileValidation = await validateTurnstileToken(
              data.turnstileToken,
              request.headers.get('CF-Connecting-IP'),
              env
            );
            
            if (!turnstileValidation.success) {
              return errorResponse(turnstileValidation.message, 400);
            }
            
            // Insert the rating
            const now = new Date().toISOString();
            console.log('Attempting to insert rating with data:', {
              ...data,
              image: data.image || null
            });
            
            try {
              console.log('Preparing SQL query with data:', {
                latitude: data.latitude,
                longitude: data.longitude,
                burritoTitle: data.burritoTitle,
                rating: data.rating,
                taste: data.taste,
                value: data.value,
                price: data.price,
                restaurantName: data.restaurantName,
                review: data.review,
                reviewerName: data.reviewerName,
                reviewerEmoji: data.reviewerEmoji,
                hasPotatoes: data.hasPotatoes,
                hasCheese: data.hasCheese,
                hasBacon: data.hasBacon,
                hasChorizo: data.hasChorizo,
                hasAvocado: data.hasAvocado,
                hasVegetables: data.hasVegetables,
                image: data.image
              });

              // TODO: Multi-tenant rating creation requires complex item management
              // For now, return error to prevent data corruption
              return errorResponse('Rating creation temporarily disabled during migration', 503);
            } catch (error) {
              console.error('Error in POST handler:', error);
              return errorResponse('Rating creation not available', 503);
            }
          }
        }
        
        // Handle individual rating endpoints (ratings/:id)
        const ratingMatch = path.match(/^ratings\/(\d+)(\/\w+)?$/);
        if (ratingMatch) {
          const id = parseInt(ratingMatch[1]);
          const action = ratingMatch[2]?.replace('/', '') || '';
          
          // Verify the rating exists (using new schema)
          const rating = await env.DB.prepare(`
            SELECT r.*, i.name as item_name, i.venue_name, i.latitude, i.longitude, i.zipcode
            FROM ratings r
            JOIN items i ON r.item_id = i.id
            WHERE r.tenant_id = 'burritos' AND r.id = ?
          `).bind(`rating_${id}`).first();
            
          if (!rating) {
            return errorResponse('Rating not found', 404);
          }

          // Handle DELETE request
          if (request.method === 'DELETE' && !action) {
            const result = await env.DB.prepare('DELETE FROM ratings WHERE tenant_id = ? AND id = ?')
              .bind('burritos', `rating_${id}`)
              .run();
              
            if (result.success) {
              return jsonResponse({ success: true, message: 'Rating deleted successfully' });
            } else {
              return errorResponse('Failed to delete rating', 500);
            }
          }

          // Handle confirmation
          if (request.method === 'PUT' && action === 'confirm') {
            const result = await env.DB.prepare('UPDATE ratings SET status = ? WHERE tenant_id = ? AND id = ?')
              .bind('confirmed', 'burritos', `rating_${id}`)
              .run();
              
            if (result.success) {
              return jsonResponse({ success: true, message: 'Rating confirmed successfully' });
            } else {
              return errorResponse('Failed to confirm rating', 500);
            }
          }
        }
        
        // Handle bulk confirmation
        if (path === 'ratings/confirm-bulk' && request.method === 'POST') {
          const { ids } = await request.json();
          
          if (!Array.isArray(ids) || ids.length === 0) {
            return errorResponse('Invalid or empty ID list', 400);
          }
          
          // Convert legacy IDs to new format and update with tenant context
          const ratingIds = ids.map(id => `rating_${id}`);
          const placeholders = ratingIds.map(() => '?').join(',');
          const result = await env.DB.prepare(`UPDATE ratings SET status = 'confirmed' WHERE tenant_id = 'burritos' AND id IN (${placeholders})`)
            .bind(...ratingIds)
            .run();
            
          if (result.success) {
            return jsonResponse({ success: true, message: 'Ratings confirmed successfully' });
          } else {
            return errorResponse('Failed to confirm ratings', 500);
          }
        }
      }
      
      return errorResponse('Method not allowed', 405);
    } catch (error) {
      return errorResponse('Internal server error', 500);
    }
  }
};

export default workerHandler;