'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function VerifySuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkUserWorkspace() {
      try {
        // Check if user has a session and needs to create a workspace
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        setLoading(false);

        if (data.user && !data.user.workspace_id) {
          // User needs to create a workspace
          router.push('/workspace');
        } else if (data.user) {
          // User has a workspace, redirect to dashboard
          router.push('/dashboard');
        } else {
          // No user session, user needs to login
          setTimeout(() => {
            router.push('/auth?tab=login');
          }, 3000); // Redirect after 3 seconds
        }
      } catch (error) {
        setLoading(false);
        setError('An error occurred. Please try logging in again.');
        console.error('Session check error:', error);
        
        // Redirect to login after showing error
        setTimeout(() => {
          router.push('/auth?tab=login');
        }, 3000); // Redirect after 3 seconds
      }
    }

    checkUserWorkspace();
  }, [router]);

  const handleGoToLogin = () => {
    router.push('/auth?tab=login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Verified!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <Spinner size="lg" />
              <p className="text-center text-gray-600">
                Setting up your account...
              </p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              {error}
              <p className="mt-2 text-sm text-gray-500">Redirecting to login page...</p>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p>Your email has been verified successfully.</p>
              <p className="mt-2">Redirecting you to continue setup...</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGoToLogin}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Go to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 