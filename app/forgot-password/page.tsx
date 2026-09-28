// app/forgot-password/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) return (
    <div style={styles.page}>
      <div style={{ ...styles.card, padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: '#1a3a8f', fontWeight: '700', fontSize: '20px', marginBottom: '10px' }}>Reset link sent!</h2>
        <p style={{ color: '#6b748e', fontSize: '14px' }}>Check <strong>{email}</strong> for a password reset link.</p>
        <Link href="/login" style={{ ...styles.btn, display: 'inline-block', marginTop: '24px', textDecoration: 'none' }}>Back to Login</Link>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.brandMark}>ES</div>
          <h1 style={styles.title}>Reset Your Password</h1>
          <p style={styles.subtitle}>We&apos;ll email you a reset link</p>
        </div>
        <form onSubmit={handleReset} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}
          <label style={styles.label}>Email Address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" style={styles.input} />
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
          <p style={styles.footer}><Link href="/login" style={styles.link}>← Back to Login</Link></p>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f4f9', padding: '16px' },
  card: { width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 40px rgba(26,58,143,0.12)', overflow: 'hidden' },
  header: { background: '#1a3a8f', color: '#fff', padding: '28px 32px 22px', textAlign: 'center' },
  brandMark: { width: '44px', height: '44px', borderRadius: '12px', background: '#ffc642', color: '#1a3a8f', fontWeight: '800', fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' },
  title: { fontSize: '22px', fontWeight: '700', marginBottom: '4px' },
  subtitle: { fontSize: '13px', opacity: 0.75 },
  form: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#6b748e' },
  input: { padding: '10px 14px', borderRadius: '9px', border: '1px solid rgba(26,58,143,0.15)', fontSize: '14px', outline: 'none' },
  btn: { padding: '12px', borderRadius: '9px', border: 'none', background: '#1a3a8f', color: '#fff', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '6px', textAlign: 'center' },
  errorBox: { background: 'rgba(216,68,68,0.1)', color: '#d84444', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', border: '1px solid rgba(216,68,68,0.2)' },
  link: { color: '#1a3a8f', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
  footer: { textAlign: 'center', fontSize: '13px', marginTop: '8px' },
}
