'use client';

import { useState, useEffect } from 'react';
import { generateUserEmoji, validatePassword } from '../utils/auth';
import Turnstile from './Turnstile';

interface Position {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

interface RatingFormData {
  latitude: number;
  longitude: number;
  burritoTitle: string;
  rating: number;
  taste: number;
  value: number;
  price: number;
  restaurantName: string;
  review: string;
  reviewerName: string;
  identityPassword?: string;
  reviewerEmoji?: string;
  zipcode: string | null | undefined;
  turnstileToken: string;
  hasPotatoes: boolean;
  hasCheese: boolean;
  hasBacon: boolean;
  hasChorizo: boolean;
  hasAvocado: boolean;
  hasVegetables: boolean;
  image?: string;
}

interface Props {
  position: Position;
  onSubmit: (data: RatingFormData) => void;
  onClose: () => void;
}

// Helper function to get rating emoji
function getRatingEmoji(rating: number): string {
  const roundedRating = Math.round(rating);
  const emojis = {
    1: '😖', // Confounded face
    2: '😕', // Confused face
    3: '😐', // Neutral face
    4: '😋', // Face savoring food
    5: '🤤', // Drooling face
  };
  return emojis[roundedRating as keyof typeof emojis] || '😐';
}

// Helper function to get price reaction emoji
function getPriceEmoji(price: number): string {
  if (price <= 5) return '🤑'; // Money face - great deal
  if (price <= 8) return '😊'; // Happy face - good price
  if (price <= 12) return '😐'; // Neutral face - okay price
  if (price <= 15) return '😟'; // Worried face - getting expensive
  if (price <= 20) return '😠'; // Angry face - expensive
  if (price <= 25) return '🤬'; // Very angry face - very expensive
  return '🤯'; // Mind blown - extremely expensive
}

// Helper function to extract zipcode from address
function extractZipcode(address: string): string | undefined {
  const zipcodeMatch = address.match(/\b\d{5}\b/);
  return zipcodeMatch ? zipcodeMatch[0] : undefined;
}

// Cloudflare Turnstile site key - use test key for development
// Test keys from Cloudflare docs: https://developers.cloudflare.com/turnstile/reference/testing/
// 1x00000000000000000000AA - Always passes
// 2x00000000000000000000AB - Always blocks
// 3x00000000000000000000FF - Forces an interactive challenge
const TURNSTILE_SITE_KEY = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAA_9y3MwYADqg0-_')
  : '1x00000000000000000000AA'; // Always passes in development

export default function RatingForm({ position, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [burritoTitle, setBurritoTitle] = useState('Breakfast Burrito');
  const [rating, setRating] = useState(3);
  const [taste, setTaste] = useState(3);
  const [value, setValue] = useState(3);
  const [price, setPrice] = useState(10);
  const [review, setReview] = useState('');
  const [ingredients, setIngredients] = useState({
    hasPotatoes: false,
    hasCheese: false,
    hasBacon: false,
    hasChorizo: false,
    hasAvocado: false,
    hasVegetables: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [turnstileError, setTurnstileError] = useState<boolean>(false);
  const [turnstileErrorMessage, setTurnstileErrorMessage] = useState<string>('There was an error loading the CAPTCHA. Please refresh the page and try again.');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Log the site key being used when the component mounts
  useEffect(() => {
    console.log('RatingForm mounted with Turnstile site key:', TURNSTILE_SITE_KEY);
    console.log('Environment:', process.env.NODE_ENV);
  }, []);

  const handleTurnstileVerify = (token: string) => {
    console.log('CAPTCHA verified successfully with token:', token.substring(0, 10) + '...');
    setTurnstileToken(token);
    setIsCaptchaVerified(true);
    setTurnstileError(false);
    setTurnstileErrorMessage('');
    setError(null);
  };

  // Add a function to handle Turnstile errors
  const handleTurnstileError = (errorCode?: string) => {
    console.log('CAPTCHA encountered an error', errorCode ? `with code: ${errorCode}` : '');
    setTurnstileError(true);
    setIsCaptchaVerified(false);
    
    if (errorCode === '110200') {
      setTurnstileErrorMessage('Invalid site key. Please check your configuration or contact support.');
    } else if (errorCode === 'invalid_key_format') {
      setTurnstileErrorMessage('The CAPTCHA site key has an invalid format. Please check your configuration or contact support.');
    } else {
      setTurnstileErrorMessage('There was an error with the CAPTCHA verification. Please refresh the page and try again.');
    }
  };

  // Helper function to compress image
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const maxWidth = 800; // Target width for upload
          
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to Blob with quality adjustment
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8 // Quality setting (0.8 = 80% quality)
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection with compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Compress image
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedFile);

      // Log compression results
      console.log('Original size:', Math.round(file.size / 1024), 'KB');
      console.log('Compressed size:', Math.round(compressedFile.size / 1024), 'KB');

      setImage(compressedFile);
      setImagePreview(previewUrl);
    } catch (err) {
      console.error('Error processing image:', err);
      setUploadError('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CAPTCHA
    if (!isCaptchaVerified || !turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    
    console.log('Submitting form with turnstile token:', turnstileToken.substring(0, 20) + '...');
    
    setIsSubmitting(true);
    setError(null);
    
    // Generate emoji if password is provided
    const reviewerEmoji = password.length >= 4 ? generateUserEmoji(password) : undefined;
    
    // Extract zipcode from address
    const zipcode = extractZipcode(position.address);
    
    let imageFilename: string | undefined;

    // Upload image if one was selected
    if (image) {
      const formData = new FormData();
      formData.append('image', image);

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_R2_API_TOKEN}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      imageFilename = uploadResult.url; // Store the URL from the worker response
    }
    
    const ratingData: RatingFormData = {
      latitude: position.lat,
      longitude: position.lng,
      burritoTitle,
      rating,
      taste,
      value,
      price,
      restaurantName: position.name,
      review,
      reviewerName: name.trim() || 'Anonymous',
      identityPassword: password.length >= 4 ? password : undefined,
      reviewerEmoji,
      zipcode,
      turnstileToken,
      hasPotatoes: ingredients.hasPotatoes,
      hasCheese: ingredients.hasCheese,
      hasBacon: ingredients.hasBacon,
      hasChorizo: ingredients.hasChorizo,
      hasAvocado: ingredients.hasAvocado,
      hasVegetables: ingredients.hasVegetables,
      image: imageFilename,
    };

    try {
      onSubmit(ratingData);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-1 sm:p-2 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[95vh] overflow-y-auto my-2">
        <div className="p-2">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-base font-bold text-black">Rate this Burrito</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* USA-only notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-1 mb-2 text-xs text-blue-800">
            <span className="font-bold">Note:</span> During our beta phase, we&apos;re only accepting ratings for restaurants in the United States. 🇺🇸
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-1 mb-2 text-xs text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex">
              {/* Left Column */}
              <div className="w-1/2 pr-3 space-y-2">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-black">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-2 py-1 text-xs text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Anonymous"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-black">
                    Reviewer Identity Password (Optional)
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-2 py-1 text-xs text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="4-10 chars for emoji"
                    maxLength={10}
                  />
                  {password && !validatePassword(password) && (
                    <p className="text-xs text-black leading-tight mt-0.5">
                      Password must be 4-10 characters
                    </p>
                  )}
                  {validatePassword(password) && (
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md mt-0.5 min-h-[30px]">
                      <span className="text-lg">{generateUserEmoji(password)}</span>
                      <span className="text-xs text-gray-600">Your Reviewer Identity</span>
                    </div>
                  )}
                  {!validatePassword(password) && (
                    <div className="min-h-[30px]"></div>
                  )}
                </div>

                {/* Image Upload Section */}
                <div>
                  <label htmlFor="image" className="block text-xs font-bold text-black">
                    Burrito Photo (Optional) 📸
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="image"
                      className={`block w-full px-2 py-1 text-xs text-black bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUploading ? 'Processing...' : 'Choose Photo'}
                    </label>
                  </div>
                  {uploadError && (
                    <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                  )}
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <img
                        src={imagePreview}
                        alt="Burrito preview"
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                          setUploadError(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-2 border-l border-gray-200"></div>

              {/* Right Column */}
              <div className="w-1/2 pl-2 space-y-2">
                <div>
                  <p className="text-xs font-bold text-black">{position.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">{position.address}</p>
                </div>

                <div>
                  <label htmlFor="burritoTitle" className="block text-xs font-bold text-black">
                    Burrito Name
                  </label>
                  <input
                    type="text"
                    id="burritoTitle"
                    value={burritoTitle}
                    onChange={(e) => setBurritoTitle(e.target.value)}
                    className="block w-full px-2 py-1 text-xs text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black">Base Price ($)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="3"
                      max="35"
                      step="0.5"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full h-4"
                    />
                    <span className="text-lg" role="img" aria-label="price reaction">
                      {getPriceEmoji(price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-black leading-tight">
                    <span>$3</span>
                    <span className="font-bold">${price.toFixed(2)}</span>
                    <span>$35</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black">Overall Rating</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full h-4"
                    />
                    <span className="text-lg" role="img" aria-label="rating emotion">
                      {getRatingEmoji(rating)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-black leading-tight">
                    <span>Poor</span>
                    <span className="font-bold">{rating.toFixed(1)}</span>
                    <span>Amazing</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-black">Taste</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={taste}
                        onChange={(e) => setTaste(Number(e.target.value))}
                        className="w-full h-4"
                      />
                      <span className="text-lg" role="img" aria-label="taste rating">
                        {getRatingEmoji(taste)}
                      </span>
                    </div>
                    <div className="text-center text-xs font-medium text-black">
                      {taste.toFixed(1)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black">Value</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full h-4"
                      />
                      <span className="text-lg" role="img" aria-label="value rating">
                        {getRatingEmoji(value)}
                      </span>
                    </div>
                    <div className="text-center text-xs font-medium text-black">
                      {value.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-0.5">
                    <span className="flex items-center gap-1">
                      Extra Ingredients <span className="text-lg">🧂</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {Object.entries(ingredients).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setIngredients((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                        />
                        <span className="text-xs text-black flex items-center gap-0.5">
                          <span className="text-lg">
                            {key === 'hasPotatoes' && '🥔'}
                            {key === 'hasCheese' && '🧀'}
                            {key === 'hasBacon' && '🥓'}
                            {key === 'hasChorizo' && '🌭'}
                            {key === 'hasAvocado' && '🥑'}
                            {key === 'hasVegetables' && '🥬'}
                          </span>
                          {key.replace('has', '')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review" className="block text-xs font-bold text-black">
                    Review (Optional)
                  </label>
                  <textarea
                    id="review"
                    rows={2}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="block w-full px-2 py-1 text-xs text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share your thoughts about this burrito..."
                  />
                </div>
              </div>
            </div>

            {/* Cloudflare Turnstile CAPTCHA - Full Width */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <label className="block text-xs font-bold text-black mb-1">
                Verify you&apos;re human
              </label>
              <div className="min-h-[80px]"> {/* Fixed height container to prevent layout shifts */}
                {turnstileError ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-2">
                    <p className="text-xs text-red-800">
                      {turnstileErrorMessage}
                    </p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Refresh Page
                    </button>
                  </div>
                ) : isCaptchaVerified ? (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                    CAPTCHA verification successful ✓
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md p-1">
                    <Turnstile 
                      siteKey={TURNSTILE_SITE_KEY} 
                      onVerify={handleTurnstileVerify}
                      onError={handleTurnstileError}
                      theme="light"
                      size="compact"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">
                      Please complete the CAPTCHA verification to submit your rating.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-1 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                disabled={isSubmitting || !isCaptchaVerified}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 