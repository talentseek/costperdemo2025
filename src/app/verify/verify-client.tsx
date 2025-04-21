'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ModeToggle } from '@/components/mode-toggle';
import { toast } from '@/hooks/use-toast';

/**
 * VerifyClient component handles the email verification prompt
 * Client component to properly use useSearchParams
 */
export function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [redirecting, setRedirecting] = useState<boolean>(false);

  // Check for hash parameters which contain error information or tokens
  useEffect(() => {
    // Check for code parameter which indicates we need to process a verification link
    const code = searchParams.get('code');
    if (code) {
      setLoading(true);
      setMessage('Processing verification code...');
      
      // Forward the code to our API endpoint
      fetch(`/api/auth/verify?code=${encodeURIComponent(code)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Verification failed');
          }
          
          setRedirecting(true);
          setMessage('Verification successful! Completing your account setup...');
          
          // We don't need to handle the redirect here as the API will redirect
          // to the appropriate page
        })
        .catch(err => {
          console.error('Verification error:', err);
          setError('Failed to verify your email. Please try again or request a new verification link.');
          toast({
            title: "Verification Failed",
            description: "Failed to verify your email. Please try again or request a new verification link.",
            variant: "destructive",
          });
          setLoading(false);
        });
      
      return;
    }
    
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // remove the # character
      const errorType = params.get('error');
      const errorCode = params.get('error_code');
      const errorDesc = params.get('error_description');
      const accessToken = params.get('access_token');
      const type = params.get('type');

      // If we have an access token and type=signup, we're in the verification flow
      if (accessToken && type === 'signup') {
        setRedirecting(true);
        setMessage('Verification successful! Completing your account setup...');
        toast({
          title: "Verification Successful",
          description: "Your email has been verified. Completing your account setup...",
        });
        
        // Extract the code and create a URL for the callback endpoint
        const callbackUrl = new URL('/api/auth/callback', window.location.origin);
        
        // Get the full hash parameters and pass them to the callback
        const code = window.location.hash.substring(1);
        callbackUrl.searchParams.set('code', code);
        
        // Redirect to the callback URL
        setTimeout(() => {
          window.location.href = callbackUrl.toString();
        }, 1500);
        return;
      }

      if (errorType === 'access_denied' && errorCode === 'otp_expired') {
        setError('Your verification link has expired. Please request a new one below.');
        toast({
          title: "Link Expired",
          description: "Your verification link has expired. Please request a new one below.",
          variant: "destructive",
        });
      } else if (errorType) {
        setError(`Verification failed: ${errorDesc || errorType}`);
        toast({
          title: "Verification Failed",
          description: `Verification failed: ${errorDesc || errorType}`,
          variant: "destructive",
        });
      }
    }

    // Check for email in query params (might be passed from signup)
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    
    setLoading(false);
  }, [searchParams, router]);

  // Function to resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address to resend the verification link.');
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend the verification link.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
        toast({
          title: "Email Sent",
          description: "Verification email sent! Please check your inbox.",
        });
      } else {
        setError(data.error || 'Failed to send verification email. Please try again.');
        toast({
          title: "Error Sending Email",
          description: data.error || 'Failed to send verification email. Please try again.',
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Resend verification error:', err);
      toast({
        title: "Error",
        description: 'An error occurred. Please try again later.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Email Verified!</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Spinner size="lg" />
              <p className="text-center text-muted-foreground">
                {message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verification Needed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Please check your email and click the verification link.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              {email ? 'Email sent to:' : 'No email provided for verification'}
            </p>
            {email && (
              <p className="font-medium">{email}</p>
            )}
            <div className="pt-2">
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={handleResendVerification}
            className="w-full"
            disabled={loading}
          >
            {loading ? <><Spinner size="sm" className="mr-2" />Sending...</> : 'Resend Verification Email'}
          </Button>
          <Button
            onClick={() => router.push('/signup')}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Back to Sign Up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * VerifyContent component that uses useSearchParams() wrapped in a separate file
 */
export function VerifyContent() {
  return <VerifyClient />;
} 