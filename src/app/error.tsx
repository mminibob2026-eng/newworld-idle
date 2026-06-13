'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', color: '#ccc' }}>
      <div style={{ border: '1px solid #f44', padding: '16px', background: 'rgba(255,68,68,0.1)' }}>
        <h2 style={{ color: '#f44', fontSize: '16px', margin: '0 0 8px' }}>Application Error</h2>
        <pre style={{ color: '#f88', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '0 0 12px' }}>
          {error.message}
          {error.digest && `\n\nDigest: ${error.digest}`}
        </pre>
        <button onClick={reset} style={{ borderColor: '#0ff', color: '#0ff' }}>
          TRY AGAIN
        </button>
        <button onClick={() => window.location.href = '/'} style={{ marginLeft: '8px' }}>
          BACK TO LOGIN
        </button>
      </div>
    </div>
  )
}
