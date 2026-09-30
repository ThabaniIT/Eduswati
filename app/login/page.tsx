// app/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    setError(authError.message)
    setLoading(false)
    return
  }

  // Login succeeded — go directly to the student dashboard
  router.push('/dashboard')
  router.refresh()
}
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.brandMark}>ES</div>
          <h1 style={styles.title}>EduSwati Login</h1>
          <p style={styles.subtitle}>Access your learning dashboard</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <label style={styles.label}>Email Address</label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
          />

          <div style={styles.row}>
            <span />
            <Link href="/forgot-password" style={styles.link}>Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <p style={styles.footer}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={styles.link}>Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

// Inline styles matching EduSwati's royal blue / gold palette
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f2f4f9', padding: '16px',
  },
  card: {
    width: '100%', maxWidth: '420px',
    background: '#fff', borderRadius: '16px',
    boxShadow: '0 8px 40px rgba(26,58,143,0.12)', overflow: 'hidden',
  },
  header: {
    background: '#1a3a8f', color: '#fff',
    padding: '28px 32px 22px', textAlign: 'center',
  },
  brandMark: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: '#ffc642', color: '#1a3a8f',
    fontWeight: '800', fontSize: '18px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '10px',
  },
  title: { fontSize: '22px', fontWeight: '700', marginBottom: '4px' },
  subtitle: { fontSize: '13px', opacity: 0.75 },
  form: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#6b748e' },
  input: {
    padding: '10px 14px', borderRadius: '9px',
    border: '1px solid rgba(26,58,143,0.15)',
    fontSize: '14px', outline: 'none', marginBottom: '4px',
  },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  link: { color: '#1a3a8f', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
  btn: {
    padding: '12px', borderRadius: '9px', border: 'none',
    background: '#1a3a8f', color: '#fff',
    fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '6px',
  },
  errorBox: {
    background: 'rgba(216,68,68,0.1)', color: '#d84444',
    borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
    border: '1px solid rgba(216,68,68,0.2)',
  },
  footer: { textAlign: 'center', fontSize: '13px', color: '#6b748e', marginTop: '8px' },
}
