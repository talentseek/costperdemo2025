import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useRouter } from "next/navigation"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Handles user logout by calling the API and redirecting to login
 * @param router Next.js router for navigation
 * @param setLoading Optional function to set loading state
 * @param onError Optional callback for error handling
 * @returns Promise that resolves when logout is complete
 */
export async function handleLogout(
  router: ReturnType<typeof useRouter>,
  setLoading: (isLoading: boolean) => void,
  onError?: (error: Error) => void
) {
  if (setLoading) setLoading(true);
  
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Logout failed');
    }
    
    // Clear any previous errors that might be in the URL
    // Use window.location for a full page refresh to clear any client state
    window.location.href = '/auth?tab=login';
  } catch (error) {
    console.error('Logout error:', error);
    if (onError && error instanceof Error) {
      onError(error);
    } else {
      // If no error handler is provided, redirect to login anyway
      window.location.href = '/auth?tab=login';
    }
  } finally {
    if (setLoading) setLoading(false);
  }
}
