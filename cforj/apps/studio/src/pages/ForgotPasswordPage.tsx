import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/client'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        {/* Logo */}
        <div className="mb-8">
          <svg width="110" height="36" viewBox="0 0 220 72" fill="none">
            <defs>
              <linearGradient id="fpg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399"/>
                <stop offset="100%" stopColor="#818cf8"/>
              </linearGradient>
            </defs>
            <path d="M32 36 Q32 10 19 10 Q6 10 6 36 Q6 62 32 62 Q58 62 58 36 Q58 10 32 10"
                  fill="none" stroke="url(#fpg)" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="32" cy="36" r="4" fill="url(#fpg)"/>
            <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="#0f0f13" letterSpacing="-0.5">cforj</text>
            <text x="68" y="56" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#999" letterSpacing="1.5">COURSE FORGE STUDIO</text>
          </svg>
        </div>

        {sent ? (
          <>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl mb-4">✉</div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Check your email</h1>
            <p className="text-sm text-gray-500 mb-6">
              If <strong>{email}</strong> is registered, we've sent a password reset link. It expires in 1 hour.
            </p>
            <Link
              to="/login"
              className="block text-center text-sm text-primary hover:underline font-medium"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Reset password</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-4">
              <Link to="/login" className="text-primary hover:underline font-medium">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
