'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'

export default function Home() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && !loading) router.push('/dashboard')
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <div className="loading-spinner large" />
        <span style={{ color: '#0ff', fontSize: '11px' }}>{t.common.loading}</span>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (isSignUp) {
      const err = await signUp(email, password, username)
      if (err) setError(err)
    } else {
      const err = await signIn(email, password)
      if (err) setError(err)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div className="panel" style={{ maxWidth: '360px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#0ff', fontSize: '22px', margin: '0 0 4px', letterSpacing: '3px' }}>
            {t.appName}
          </h1>
          <p style={{ color: '#888', fontSize: '11px', margin: 0 }}>
            {t.appTagline}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isSignUp && (
            <input
              placeholder={t.username}
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={20}
              required
            />
          )}
          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" style={{ marginTop: '4px' }}>
            {isSignUp ? t.signUp : t.signIn}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '12px 0', color: '#555', fontSize: '11px' }}>
          — OR —
        </div>

        <button
          onClick={signInWithGoogle}
          style={{ width: '100%', borderColor: '#888', color: '#ccc', background: 'rgba(255,255,255,0.05)' }}
        >
          {t.loginWithGoogle}
        </button>

        {error && <p style={{ color: '#f44', fontSize: '11px', margin: '4px 0 0' }}>{error}</p>}

        <p style={{ textAlign: 'center', margin: '12px 0 0', fontSize: '11px', color: '#888' }}>
          {isSignUp ? t.hasAccount : t.noAccount}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            style={{ background: 'none', border: 'none', color: '#0ff', padding: 0, fontSize: '11px', textDecoration: 'underline' }}
          >
            {isSignUp ? t.signIn : t.signUp}
          </button>
        </p>
      </div>
    </div>
  )
}
