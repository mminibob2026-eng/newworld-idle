'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function ConsentForm({ authorizationId }: { authorizationId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const handleDecision = async (decision: 'approve' | 'deny') => {
    try {
      if (decision === 'approve') {
        const { data, error } = await supabase.auth.oauth.approveAuthorization(
          authorizationId,
          { skipBrowserRedirect: true }
        )
        if (error) throw error
        if (data?.redirect_url) {
          router.push(data.redirect_url)
        }
      } else {
        const { data, error } = await supabase.auth.oauth.denyAuthorization(
          authorizationId,
          { skipBrowserRedirect: true }
        )
        if (error) throw error
        if (data?.redirect_url) {
          router.push(data.redirect_url)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      alert(`Authorization failed: ${message}`)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => handleDecision('deny')}
        style={{
          flex: 1,
          borderColor: '#666',
          color: '#999',
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        DENY
      </button>
      <button
        onClick={() => handleDecision('approve')}
        style={{
          flex: 1,
          borderColor: '#0ff',
          color: '#0ff',
          background: 'rgba(0,255,255,0.1)',
        }}
      >
        APPROVE
      </button>
    </div>
  )
}
