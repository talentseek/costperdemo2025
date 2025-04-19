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
    
    // Use the redirectTo URL from the API response if available
    if (data.redirectTo) {
      router.push(data.redirectTo);
    } else {
      // Fallback to the default redirect
      router.push('/auth?tab=login');
    }
  } catch (error) {
    console.error('Logout error:', error);
    if (onError && error instanceof Error) {
      onError(error);
    }
  } finally {
    if (setLoading) setLoading(false);
  }
}
