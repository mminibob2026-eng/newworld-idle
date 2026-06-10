import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { ConsentForm } from './consent-form'

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>
}) {
  const { authorization_id } = await searchParams

  if (!authorization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="panel" style={{ maxWidth: 400, width: '100%' }}>
          <h1 style={{ color: '#f44', marginBottom: 8 }}>Invalid Request</h1>
          <p style={{ color: '#888', fontSize: 12 }}>
            Missing authorization ID. Please try again from the application you want to authorize.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/?redirect=/oauth/consent?authorization_id=${authorization_id}`)
  }

  const { data: authDetails, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorization_id)

  if (error || !authDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="panel" style={{ maxWidth: 400, width: '100%' }}>
          <h1 style={{ color: '#f44', marginBottom: 8 }}>Authorization Error</h1>
          <p style={{ color: '#888', fontSize: 12 }}>
            {error?.message || 'Invalid or expired authorization request.'}
          </p>
        </div>
      </div>
    )
  }

  if (!('authorization_id' in authDetails)) {
    redirect(authDetails.redirect_url)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="panel" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ color: '#0ff', fontSize: 18, margin: '0 0 4px', letterSpacing: 2 }}>
            NEW WORLD IDLE
          </h1>
          <p style={{ color: '#888', fontSize: 11, margin: 0 }}>
            Authorization Request
          </p>
        </div>

        <p style={{ color: '#ccc', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          <b>{authDetails.client.name}</b> wants to access your account.
        </p>

        <div
          className="detail-box"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: 12,
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          <p style={{ margin: '0 0 6px', color: '#888' }}>
            <b style={{ color: '#aaa' }}>Client:</b> {authDetails.client.name}
          </p>
          {authDetails.client.uri && (
            <p style={{ margin: '0 0 6px', color: '#888' }}>
              <b style={{ color: '#aaa' }}>Website:</b>{' '}
              <a href={authDetails.client.uri} style={{ color: '#0ff' }} target="_blank" rel="noreferrer">
                {authDetails.client.uri}
              </a>
            </p>
          )}
          <p style={{ margin: '0 0 6px', color: '#888' }}>
            <b style={{ color: '#aaa' }}>Redirect URI:</b>{' '}
            <span style={{ wordBreak: 'break-all' }}>{authDetails.redirect_uri}</span>
          </p>
          <p style={{ margin: 0, color: '#888' }}>
            <b style={{ color: '#aaa' }}>Signed in as:</b> {user.email}
          </p>
        </div>

        {authDetails.scope && authDetails.scope.trim() && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#aaa', fontSize: 12, margin: '0 0 6px', fontWeight: 600 }}>
              Requested Permissions:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#888' }}>
              {authDetails.scope.split(' ').map((s: string) => (
                <li key={s} style={{ marginBottom: 2 }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <ConsentForm authorizationId={authorization_id} />
      </div>
    </div>
  )
}
