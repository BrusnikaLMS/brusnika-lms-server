import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/client'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement, config: { theme: string; size: string; width: number; text: string; shape: string; logo_alignment: string }) => void
        }
      }
    }
  }
}

const APP_URL = import.meta.env.VITE_APP_URL || ''
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const RESEND_SECONDS = 60

export function AuthPage() {
  const navigate = useNavigate()
  const { loginWithToken, loading } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  // OTP step
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS)
  const [resending, setResending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputsRef = useRef<HTMLInputElement[]>([])
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true)
    setError('')
    try {
      const res = await authApi.googleLogin(response.credential)
      await loginWithToken(res.access_token, res.refresh_token)
      if (APP_URL) window.location.href = APP_URL + '/dashboard'
      else navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }, [loginWithToken, navigate])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    // Load Google Identity Services script
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
      script.onload = () => initGoogle()
    } else {
      initGoogle()
    }
    function initGoogle() {
      if (!window.google || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      })
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      })
    }
  }, [handleGoogleResponse])

  function startCountdown() {
    setResendCountdown(RESEND_SECONDS)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendCountdown((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      let res
      if (mode === 'login') {
        res = await authApi.login(email, password)
      } else {
        res = await authApi.register(email, password, name)
      }
      if (res.requires_verification) {
        setOtpEmail(res.email)
        setOtp('')
        setOtpError('')
        startCountdown()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  async function handleVerify(code: string) {
    if (code.length < 6) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await authApi.verifyCode(otpEmail, code)
      await loginWithToken(res.access_token, res.refresh_token)
      if (APP_URL) window.location.href = APP_URL + '/dashboard'
      else navigate('/dashboard')
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Invalid code')
      setOtp('')
      inputsRef.current[0]?.focus()
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setOtpError('')
    try {
      await authApi.sendCode(otpEmail)
      startCountdown()
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  // Split-digit OTP input handlers
  function handleDigitChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const digits = otp.split('')
    digits[i] = val.slice(-1)
    const next = digits.join('')
    setOtp(next)
    if (val && i < 5) inputsRef.current[i + 1]?.focus()
    if (next.length === 6) handleVerify(next)
  }

  function handleDigitKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted)
      inputsRef.current[5]?.focus()
      handleVerify(pasted)
    }
  }

  // ── OTP modal ──────────────────────────────────────────────────────────────
  if (otpEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
          {/* Logo */}
          <div className="mb-7 flex justify-center">
            <svg width="110" height="36" viewBox="0 0 220 72" fill="none">
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399"/>
                  <stop offset="100%" stopColor="#818cf8"/>
                </linearGradient>
              </defs>
              <path d="M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10"
                    fill="none" stroke="url(#ag)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="32" cy="36" r="4" fill="url(#ag)"/>
              <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="#0f0f13" letterSpacing="-0.5">cforj</text>
            </svg>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-400 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Check your email</h1>
          <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            We sent a 6-digit code to<br/>
            <span className="font-medium text-gray-700">{otpEmail}</span>
          </p>

          {/* 6-digit inputs */}
          <div className="flex gap-2 justify-center mb-5" onPaste={handleDigitPaste}>
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { if (el) inputsRef.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] ?? ''}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(i, e)}
                disabled={otpLoading}
                className={`w-11 h-13 text-center text-xl font-bold border rounded-xl outline-none transition-all
                  ${otpError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}
                  ${otpLoading ? 'opacity-50' : ''}
                  bg-white text-gray-900`}
                style={{ height: '52px' }}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {otpLoading && (
            <div className="flex justify-center mb-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {otpError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-center">
              {otpError}
            </div>
          )}

          {/* Resend */}
          <div className="text-center">
            {resendCountdown > 0 ? (
              <p className="text-sm text-gray-400">
                Resend code in{' '}
                <span className="font-semibold tabular-nums text-gray-600">
                  {String(Math.floor(resendCountdown / 60)).padStart(2, '0')}:
                  {String(resendCountdown % 60).padStart(2, '0')}
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          <button
            onClick={() => { setOtpEmail(''); setOtp(''); setOtpError('') }}
            className="mt-5 w-full text-xs text-gray-400 hover:text-gray-600 text-center"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ── Login / Register form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        {/* Logo */}
        <div className="mb-8">
          <svg width="110" height="36" viewBox="0 0 220 72" fill="none">
            <defs>
              <linearGradient id="ag2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399"/>
                <stop offset="100%" stopColor="#818cf8"/>
              </linearGradient>
            </defs>
            <path d="M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10"
                  fill="none" stroke="url(#ag2)" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="32" cy="36" r="4" fill="url(#ag2)"/>
            <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="#0f0f13" letterSpacing="-0.5">cforj</text>
            <text x="68" y="56" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#999" letterSpacing="1.5">COURSE FORGE STUDIO</text>
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login' ? 'Sign in to your account' : 'Start building learning apps'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Email</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Password</label>
              {mode === 'login' && (
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="flex justify-center">
              <div ref={googleBtnRef} />
            </div>
            {googleLoading && (
              <div className="flex justify-center mt-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="text-primary hover:underline font-medium"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <div className="border-t border-gray-100 mt-4 pt-4">
          <button
            onClick={() => {
              if (APP_URL) window.location.href = APP_URL + '/dashboard'
              else navigate('/dashboard')
            }}
            className="w-full text-xs text-gray-400 hover:text-gray-600 text-center"
          >
            Continue without account (local only)
          </button>
        </div>
      </div>
    </div>
  )
}
