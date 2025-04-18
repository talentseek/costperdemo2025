import VerifyPrompt from '../../components/VerifyPrompt'

/**
 * VerifyPage component renders the email verification prompt
 * Uses VerifyPrompt component to handle verification flow
 */
export default function VerifyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <VerifyPrompt />
    </main>
  )
} 