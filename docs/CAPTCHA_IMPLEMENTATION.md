# Cloudflare Turnstile CAPTCHA Implementation

This document describes the implementation of Cloudflare Turnstile CAPTCHA in the Burrito Rater application to prevent spam submissions and bot attacks.

## Overview

Cloudflare Turnstile is a CAPTCHA alternative that provides a user-friendly verification mechanism while effectively blocking bots. The Burrito Rater application uses Turnstile to validate that rating submissions are made by real users.

## Architecture

The implementation consists of three main components:

1. **Frontend Turnstile Component**: A React component that renders the Turnstile widget and handles verification
2. **Form Integration**: Integration with the RatingForm component to manage verification state
3. **Backend Validation**: Server-side validation in the Cloudflare Worker to verify tokens

## Setup Requirements

### Prerequisites

- Cloudflare account
- Cloudflare Turnstile site configured at [https://dash.cloudflare.com/?to=/:account/turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)

### Environment Variables

#### Frontend (.env.local)

```
# Cloudflare Turnstile Site Key (public)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
```

#### Backend (Cloudflare Worker Secret)

The secret key must be set as a Cloudflare Worker secret using the Wrangler CLI:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

When prompted, enter your Turnstile secret key. This ensures the secret is securely stored and not exposed in your codebase.

## Implementation Details

### 1. Turnstile Component

The `Turnstile.tsx` component handles:

- Loading the Turnstile script
- Rendering the widget
- Managing verification state
- Handling errors
- Providing feedback to the user

Key features:

- Automatic script loading with retry mechanism
- Support for test keys in development
- Comprehensive error handling with descriptive messages
- Verification state management to prevent re-rendering loops
- Visual feedback for verification status

### 2. Form Integration

The `RatingForm.tsx` component integrates with Turnstile by:

- Rendering the Turnstile component
- Managing verification state
- Including the verification token in form submissions
- Displaying appropriate UI based on verification status

### 3. Backend Validation

The API worker validates Turnstile tokens by:

- Extracting the token from the request
- Validating the token with Cloudflare's verification API
- Handling special cases for development and testing
- Rejecting submissions with invalid tokens

## Development vs. Production

### Development Mode

In development mode:

- Uses a test key (`1x00000000000000000000AA`) that always passes
- Displays a simplified verification UI
- Accepts test tokens without contacting Cloudflare's API
- Provides detailed logging for debugging

### Production Mode

In production mode:

- Uses your actual Cloudflare Turnstile site key
- Performs full verification with Cloudflare's API
- Enforces strict validation rules
- Implements proper error handling

## Test Keys

For development and testing, Cloudflare provides these test keys:

- `1x00000000000000000000AA` - Always passes
- `2x00000000000000000000AB` - Always blocks
- `3x00000000000000000000FF` - Forces an interactive challenge

## Troubleshooting

### Common Issues

1. **Widget Not Appearing**
   - Check that the site key is correctly set in `.env.local`
   - Verify the Turnstile script is loading (check browser console)
   - Ensure the container element is properly rendered

2. **Verification Failures**
   - Check browser console for error codes
   - Verify the secret key is correctly set in the Worker
   - Ensure the domain is allowed in your Turnstile configuration

3. **Looping or Re-rendering Issues**
   - The component uses an `isVerified` state to prevent re-rendering after verification
   - If you see "Nothing to remove found" errors, check that the cleanup logic is working correctly

## Security Considerations

1. **Never commit the secret key** to version control
2. **Always use environment variables** for configuration
3. **Implement rate limiting** on your API endpoints
4. **Monitor verification failures** for potential attacks
5. **Regularly rotate your Turnstile keys**

## Implementation Code Examples

### Frontend Component

The Turnstile component handles rendering and verification:

```typescript
// Key parts of the implementation (simplified)
export default function Turnstile({ siteKey, onVerify, onError, theme = 'light', size = 'normal' }: TurnstileProps) {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  
  // Render the widget when the script is loaded
  useEffect(() => {
    // If already verified, don't re-render the widget
    if (isVerified) {
      return;
    }
    
    // Render the widget with proper callbacks
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => {
        setIsVerified(true);
        onVerify(token);
      },
      'error-callback': (error) => {
        // Handle errors
      }
    });
  }, [siteKey, onVerify, onError, isVerified]);
  
  return (
    <div ref={containerRef}>
      {isVerified && <div>CAPTCHA verification successful ✓</div>}
    </div>
  );
}
```

### Backend Validation

The Worker validates tokens before processing submissions:

```javascript
// Key parts of the implementation (simplified)
async function validateTurnstileToken(token, ip, env) {
  // Accept test tokens in development
  if (token && token.startsWith('test_verification_token_')) {
    return { success: true };
  }
  
  // Validate with Cloudflare API
  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });
  
  const outcome = await result.json();
  return {
    success: outcome.success,
    message: outcome.success ? 'Validation successful' : 'CAPTCHA validation failed'
  };
}
```

## Related Documentation

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [API Worker Documentation](./API_WORKER.md)
- [Deployment Guide](./DEPLOYMENT.md) 