# API Worker Documentation

This document provides information about the Cloudflare Worker API used in the Burrito Rater application.

## Overview

The Burrito Rater API is implemented as a Cloudflare Worker that handles all data operations for the application. It connects to a Cloudflare D1 database to store and retrieve burrito ratings.

## File Structure

- **`api/worker.js`**: The main worker script that handles all API requests
- **`wrangler.worker.toml`**: Configuration file for the worker deployment

## API Endpoints

The worker exposes the following endpoints:

### Ratings

#### GET `/ratings`
- Returns all ratings ordered by creation date (descending)
- No query parameters required
- Response: Array of Rating objects

#### POST `/ratings`
- Creates a new rating
- Requires JSON body with rating details
- Requires Turnstile CAPTCHA token
- Response: `{ "message": "Rating submitted successfully" }`

#### DELETE `/ratings/:id`
- Deletes a specific rating
- Verifies rating exists before deletion
- Response: `{ "success": true, "message": "Rating deleted successfully" }`
- Error: 404 if rating not found

#### PUT `/ratings/:id/confirm`
- Confirms a specific rating
- Sets `confirmed = 1` in database
- Verifies rating exists before confirmation
- Response: `{ "success": true, "message": "Rating confirmed successfully" }`
- Error: 404 if rating not found

#### POST `/ratings/confirm-bulk`
- Confirms multiple ratings at once
- Request body: `{ "ids": number[] }`
- Updates all specified ratings to confirmed status
- Response: `{ "success": true, "message": "Ratings confirmed successfully" }`
- Error: 400 if IDs array is invalid or empty

### Error Responses

All error responses follow the format:
```json
{
  "error": "Error message"
}
```

Common status codes:
- 200: Success
- 400: Bad Request (invalid input)
- 404: Not Found
- 405: Method Not Allowed
- 500: Internal Server Error

### Migration

- **POST `/api/migrate/add-confirmed-column`**: Add the confirmed column to the Rating table
  - Used for database migrations

## Development

Following our cloud-native philosophy, all API development is done directly in the cloud:

1. Edit the `api/worker.js` file
2. Deploy using:
   ```bash
   npm run deploy:worker
   ```
3. Test the deployed endpoints

### Development Best Practices

- **Testing Changes**:
  - Create a staging worker for critical changes
  - Use feature flags for controlled rollout
  - Implement comprehensive error handling
  - Log extensively during testing

- **Deployment Strategy**:
  - Deploy small, atomic changes
  - Test each endpoint after deployment
  - Monitor worker logs for errors
  - Have a rollback plan ready

### Why Cloud-Native Development?

- **Consistency**: Development matches production environment
- **Simplicity**: No local setup required
- **Reliability**: Tests run against actual cloud infrastructure
- **Speed**: Immediate deployment and testing

## Deployment

To deploy the worker:

```bash
# Deploy only the API worker
npm run deploy:worker

# Or, deploy both API and frontend
npm run deploy
```

### Deployment Verification

After deploying:
1. Check the worker status in Cloudflare dashboard
2. Verify D1 database binding is correct
3. Test all affected endpoints
4. Monitor worker logs for any errors

## Configuration

The project uses two separate Wrangler configuration files for different purposes:

### Worker Configuration (`wrangler.worker.toml`)

This file is specifically for the Cloudflare Worker deployment:

```toml
name = "burrito-rater"
compatibility_date = "2023-09-01"
compatibility_flags = ["nodejs_compat"]
main = "api/worker.js"

[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"
```

The key settings are:
- `main = "api/worker.js"`: Specifies the entry point for the worker
- `[[d1_databases]]`: Configures the D1 database binding

### Pages Configuration (`wrangler.toml`)

This file is used for Cloudflare Pages deployment:

```toml
name = "burrito-rater"
compatibility_date = "2023-09-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"
```

The key setting is:
- `pages_build_output_dir = ".vercel/output/static"`: Specifies the directory containing the built static files

Make sure to update the `database_name` and `database_id` with your actual Cloudflare D1 database information in both files.

## Cloudflare Turnstile Integration

The API worker integrates with Cloudflare Turnstile to prevent spam submissions and bot attacks.

### Secret Key Setup

The Turnstile secret key must be set as a Worker secret:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

When prompted, enter your Turnstile secret key. This ensures the secret is securely stored and not exposed in your codebase.

### Token Validation

When a rating is submitted, the worker:

1. Extracts the Turnstile token from the request
2. Validates the token with Cloudflare's verification API
3. Rejects the submission if the token is invalid

The validation function handles:
- Test tokens for development environments
- Production tokens for live environments
- Error handling and logging

### Development Mode

In development mode, the worker accepts:
- Test tokens that start with `test_verification_token_`
- Tokens that start with `0.` when not in production mode
- Provides more lenient validation to facilitate testing

### Production Mode

In production mode, the worker:
- Strictly validates all tokens with Cloudflare's API
- Requires a valid secret key to be set
- Rejects submissions with invalid tokens

For more details on the Turnstile implementation, see the [CAPTCHA Implementation Guide](./CAPTCHA_IMPLEMENTATION.md).

## Development

When making changes to the API:

1. Edit the `api/worker.js` file
2. Deploy the changes using `npm run deploy:worker`
3. Test the API endpoints to ensure they're working correctly

## Error Handling

The worker includes error handling for:
- Invalid requests
- Database errors
- Missing resources
- Authentication failures
- CAPTCHA validation failures

All errors are returned as JSON responses with appropriate HTTP status codes.

## CORS Configuration

The worker implements CORS headers for all responses:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

All responses include these CORS headers to allow:
- Cross-origin requests from any domain
- All required HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- Content-Type and Authorization headers

The worker also handles OPTIONS (preflight) requests automatically with a 204 status code.

## Security

- The worker does not implement authentication for most endpoints
- Admin operations (like confirming ratings) should be protected in the frontend
- CAPTCHA validation is required for all rating submissions
- Consider adding authentication if deploying in a production environment

## Related Documentation

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [CAPTCHA Implementation Guide](./CAPTCHA_IMPLEMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Workflow Guide](./WORKFLOW.md) 