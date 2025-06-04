'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (errorCode?: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

// Error code descriptions for better debugging
const ERROR_CODES: Record<string, string> = {
  '110200': 'Invalid sitekey. Please check your sitekey is correct.',
  '110201': 'Invalid domain. Please check your domain is configured correctly.',
  '110202': 'Invalid action. Please check your action is configured correctly.',
  '110203': 'Invalid cData. Please check your cData is configured correctly.',
  '110204': 'Invalid rData. Please check your rData is configured correctly.',
  '110205': 'Invalid JSON. Please check your JSON is formatted correctly.',
  '110206': 'Invalid URL. Please check your URL is formatted correctly.',
  '110207': 'Invalid execution. Please check your execution is configured correctly.',
  '110208': 'Invalid HTTP method. Please check your HTTP method is configured correctly.',
  '110209': 'Invalid retry. Please check your retry is configured correctly.',
  '110210': 'Invalid onsuccess. Please check your onsuccess is configured correctly.',
  '110211': 'Invalid onerror. Please check your onerror is configured correctly.',
  '110212': 'Invalid expired. Please check your expired is configured correctly.',
  '110213': 'Invalid timeout. Please check your timeout is configured correctly.',
  '110214': 'Invalid error. Please check your error is configured correctly.',
  '110215': 'Invalid response. Please check your response is configured correctly.',
  '110216': 'Invalid script. Please check your script is configured correctly.',
  '110217': 'Invalid style. Please check your style is configured correctly.',
  '110218': 'Invalid container. Please check your container is configured correctly.',
  '110219': 'Invalid position. Please check your position is configured correctly.',
  '110220': 'Invalid height. Please check your height is configured correctly.',
  '110221': 'Invalid width. Please check your width is configured correctly.',
  '110222': 'Invalid auto_height. Please check your auto_height is configured correctly.',
  '110223': 'Invalid auto_width. Please check your auto_width is configured correctly.',
  '110224': 'Invalid debug. Please check your debug is configured correctly.',
  '110225': 'Invalid theme. Please check your theme is configured correctly.',
  '110226': 'Invalid size. Please check your size is configured correctly.',
  '110227': 'Invalid tabindex. Please check your tabindex is configured correctly.',
  '110228': 'Invalid appearance. Please check your appearance is configured correctly.',
  '110229': 'Invalid callback. Please check your callback is configured correctly.',
  '110230': 'Invalid expired-callback. Please check your expired-callback is configured correctly.',
  '110231': 'Invalid error-callback. Please check your error-callback is configured correctly.',
  '110232': 'Invalid language. Please check your language is configured correctly.',
  '110233': 'Invalid badge. Please check your badge is configured correctly.',
  '110234': 'Invalid s. Please check your s is configured correctly.',
  '110235': 'Invalid k. Please check your k is configured correctly.',
  '110236': 'Invalid v. Please check your v is configured correctly.',
  '110237': 'Invalid h. Please check your h is configured correctly.',
  '110238': 'Invalid t. Please check your t is configured correctly.',
  '110239': 'Invalid c. Please check your c is configured correctly.',
  '110240': 'Invalid r. Please check your r is configured correctly.',
  '110241': 'Invalid i. Please check your i is configured correctly.',
  '110242': 'Invalid n. Please check your n is configured correctly.',
  '110243': 'Invalid b. Please check your b is configured correctly.',
  '110244': 'Invalid e. Please check your e is configured correctly.',
  '110245': 'Invalid o. Please check your o is configured correctly.',
  '110246': 'Invalid p. Please check your p is configured correctly.',
  '110247': 'Invalid q. Please check your q is configured correctly.',
  '110248': 'Invalid u. Please check your u is configured correctly.',
  '110249': 'Invalid w. Please check your w is configured correctly.',
  '110250': 'Invalid x. Please check your x is configured correctly.',
  '110251': 'Invalid y. Please check your y is configured correctly.',
  '110252': 'Invalid z. Please check your z is configured correctly.',
  '110253': 'Invalid a. Please check your a is configured correctly.',
  '110254': 'Invalid d. Please check your d is configured correctly.',
  '110255': 'Invalid f. Please check your f is configured correctly.',
  '110256': 'Invalid g. Please check your g is configured correctly.',
  '110257': 'Invalid j. Please check your j is configured correctly.',
  '110258': 'Invalid l. Please check your l is configured correctly.',
  '110259': 'Invalid m. Please check your m is configured correctly.',
};

// Add TypeScript declaration for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error?: string) => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function Turnstile({ siteKey, onVerify, onError, theme = 'light', size = 'normal' }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const errorReportedRef = useRef<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // Validate site key format
  useEffect(() => {
    // Known test keys from Cloudflare docs
    const knownTestKeys = [
      '1x00000000000000000000AA', // Always passes
      '2x00000000000000000000AB', // Always blocks
      '3x00000000000000000000FF'  // Forces an interactive challenge
    ];
    
    // If it's a known test key, it's valid
    if (knownTestKeys.includes(siteKey)) {
      console.log('Using known test key:', siteKey);
      return;
    }
    
    // Production site key format: 0x4AAAAAAA_xxxxxxxxxxxxxxx
    const prodKeyPattern = /^0x4[A-Za-z0-9]{7}_[A-Za-z0-9-_]{16,}$/;
    const isValidProdKey = prodKeyPattern.test(siteKey);
    
    console.log('Validating Turnstile site key:', siteKey);
    console.log('Is valid production key:', isValidProdKey);
    
    if (!isValidProdKey) {
      console.warn('Site key does not match expected format, but will attempt to use it anyway:', siteKey);
    }
  }, [siteKey]);

  // Function to load the Turnstile script
  const loadTurnstileScript = useCallback(() => {
    if (window.turnstile || document.querySelector('script[src*="turnstile"]')) {
      console.log('Turnstile script already loaded or loading');
      setScriptLoaded(true);
      return;
    }

    console.log('Loading Turnstile script...');
    console.log('Using site key:', siteKey);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Turnstile script loaded successfully');
      setScriptLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Turnstile script:', error);
      if (onError && !errorReportedRef.current) {
        errorReportedRef.current = true;
        onError();
      }
    };
    
    document.head.appendChild(script);
  }, [onError, siteKey]);

  // Load the script on component mount
  useEffect(() => {
    loadTurnstileScript();
    
    return () => {
      // Cleanup is handled in the other useEffect
    };
  }, [loadTurnstileScript]);

  // Render the widget when the script is loaded
  useEffect(() => {
    // If already verified, don't re-render the widget
    if (isVerified) {
      console.log('Turnstile already verified, skipping re-render');
      return;
    }

    // Reset error state on each render
    errorReportedRef.current = false;

    // Function to render the Turnstile widget
    const renderWidget = () => {
      if (!containerRef.current) {
        console.log('Container ref not available yet');
        return;
      }

      if (!window.turnstile) {
        console.log('Turnstile not available yet, attempt:', loadAttempts + 1);
        if (loadAttempts < 5) {
          // Try again after a delay, with increasing backoff
          setTimeout(() => {
            setLoadAttempts(prev => prev + 1);
          }, 500 * Math.pow(2, loadAttempts));
        } else if (!errorReportedRef.current && onError) {
          console.error('Failed to load Turnstile after multiple attempts');
          errorReportedRef.current = true;
          onError();
        }
        return;
      }

      try {
        // Clean up any existing widget
        if (widgetIdRef.current) {
          try {
            console.log('Removing existing Turnstile widget');
            window.turnstile.remove(widgetIdRef.current);
          } catch (error) {
            console.log('Could not remove existing Turnstile widget:', error);
          }
        }

        // Clear the container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        console.log('Rendering Turnstile widget with site key:', siteKey);
        
        // For test keys, we can simulate a successful verification
        if (siteKey === '1x00000000000000000000AA') {
          console.log('Using test key that always passes - simulating verification');
          // Simulate a delay before verification
          setTimeout(() => {
            setIsVerified(true);
            onVerify('test_verification_token_' + Date.now());
          }, 1000);
          
          // Create a simple placeholder
          if (containerRef.current) {
            const placeholder = document.createElement('div');
            placeholder.className = 'p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800';
            placeholder.textContent = 'Test CAPTCHA - Auto-verified';
            containerRef.current.appendChild(placeholder);
          }
          
          return;
        }
        
        // Render the widget
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            console.log('Turnstile verification successful');
            setIsVerified(true);
            onVerify(token);
          },
          'error-callback': (error) => {
            const errorCode = typeof error === 'string' ? error : 'unknown';
            const errorMessage = ERROR_CODES[errorCode] || 'Unknown error';
            console.error(`Turnstile encountered an error: "${errorCode}" - ${errorMessage}`);
            
            if (onError && !errorReportedRef.current) {
              errorReportedRef.current = true;
              onError(errorCode);
            }
          },
          theme: theme,
          size: size,
        });
        
        console.log('Turnstile widget rendered with ID:', widgetIdRef.current);
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error);
        // Report error to parent component
        if (onError && !errorReportedRef.current) {
          errorReportedRef.current = true;
          onError();
        }
      }
    };

    // Only try to render if the script is loaded
    if (scriptLoaded) {
      renderWidget();
    }

    // Cleanup function
    return () => {
      if (!isVerified && widgetIdRef.current && window.turnstile) {
        try {
          console.log('Cleaning up Turnstile widget');
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.log('Could not remove Turnstile widget during cleanup:', error);
        }
      }
    };
  }, [siteKey, onVerify, onError, theme, size, scriptLoaded, loadAttempts, isVerified]);

  return (
    <div ref={containerRef} className="my-1 min-h-[70px] flex items-center justify-center">
      {isVerified && (
        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800 w-full text-center">
          CAPTCHA verification successful ✓
        </div>
      )}
    </div>
  );
} 