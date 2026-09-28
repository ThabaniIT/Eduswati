// app/auth/reset-password/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/login?message=password_updated')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.brandMark}>ES</div>
          <h1 style={styles.title}>Set New Password</h1>
          <p style={styles.subtitle}>Choose a strong password</p>
        </div>
        <form onSubmit={handleReset} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}
          <label style={styles.label}>New Password</label>
          <input type="password" required minLength={6} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" style={styles.input} />
          <label style={styles.label}>Confirm New Password</label>
          <input type="password" required value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" style={styles.input} />
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
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
  btn: { padding: '12px', borderRadius: '9px', border: 'none', background: '#1a3a8f', color: '#fff', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '6px' },
  errorBox: { background: 'rgba(216,68,68,0.1)', color: '#d84444', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', border: '1px solid rgba(216,68,68,0.2)' },
}
