import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { VerifyContent } from './verify-client';

/**
 * VerifyPage component is the main page component that renders the client component
 * with proper Suspense boundary for useSearchParams
 */
export default async function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
      <Spinner className="mr-2" />
      <p className="text-gray-500">Loading verification...</p>
    </div>}>
      <VerifyContent />
    </Suspense>
  );
} 