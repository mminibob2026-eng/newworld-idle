import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', color: '#ccc' }}>
      <div style={{ border: '1px solid var(--border)', padding: '16px', textAlign: 'center' }}>
        <h2 style={{ color: '#888', fontSize: '48px', margin: '0' }}>404</h2>
        <p style={{ color: '#555', fontSize: '14px' }}>Page not found</p>
        <Link href="/" style={{ color: '#0ff', fontSize: '12px' }}>← BACK TO LOGIN</Link>
      </div>
    </div>
  )
}
