// app/signup/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const GRADES = [8, 9, 10, 11, 12]

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ fullName: '', email: '', grade: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: 'student',          // students always sign up as 'student'
          grade: parseInt(form.grade),
        },
        // Supabase will email a confirmation link
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (authError) { setError(authError.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ color: '#1a3a8f', fontWeight: '700', fontSize: '20px', marginBottom: '10px' }}>
            Check your email!
          </h2>
          <p style={{ color: '#6b748e', fontSize: '14px', lineHeight: '1.6' }}>
            We sent a confirmation link to <strong>{form.email}</strong>.<br />
            Click the link to activate your account, then log in.
          </p>
          <Link href="/login" style={{ ...styles.btn, display: 'inline-block', marginTop: '24px', textDecoration: 'none', textAlign: 'center' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.brandMark}>ES</div>
          <h1 style={styles.title}>Create Your Account</h1>
          <p style={styles.subtitle}>Start your learning journey</p>
        </div>

        <form onSubmit={handleSignup} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <label style={styles.label}>Full Name</label>
          <input type="text" required value={form.fullName} onChange={set('fullName')}
            placeholder="Sipho Nkosi" style={styles.input} />

          <label style={styles.label}>Email Address</label>
          <input type="email" required value={form.email} onChange={set('email')}
            placeholder="sipho@example.com" style={styles.input} />

          <label style={styles.label}>Select Grade</label>
          <select required value={form.grade} onChange={set('grade')} style={styles.input}>
            <option value="">Choose your grade</option>
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>

          <label style={styles.label}>Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={set('password')}
            placeholder="At least 6 characters" style={styles.input} />

          <label style={styles.label}>Confirm Password</label>
          <input type="password" required value={form.confirm} onChange={set('confirm')}
            placeholder="Repeat password" style={styles.input} />

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p style={styles.footer}>
            Already have an account?{' '}
            <Link href="/login" style={styles.link}>Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f4f9', padding: '16px' },
  card: { width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 40px rgba(26,58,143,0.12)', overflow: 'hidden' },
  header: { background: '#1a3a8f', color: '#fff', padding: '28px 32px 22px', textAlign: 'center' },
  brandMark: { width: '44px', height: '44px', borderRadius: '12px', background: '#ffc642', color: '#1a3a8f', fontWeight: '800', fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' },
  title: { fontSize: '22px', fontWeight: '700', marginBottom: '4px' },
  subtitle: { fontSize: '13px', opacity: 0.75 },
  form: { padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#6b748e', marginTop: '4px' },
  input: { padding: '10px 14px', borderRadius: '9px', border: '1px solid rgba(26,58,143,0.15)', fontSize: '14px', outline: 'none', width: '100%' },
  btn: { padding: '12px', borderRadius: '9px', border: 'none', background: '#1a3a8f', color: '#fff', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '8px' },
  errorBox: { background: 'rgba(216,68,68,0.1)', color: '#d84444', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', border: '1px solid rgba(216,68,68,0.2)' },
  link: { color: '#1a3a8f', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
  footer: { textAlign: 'center', fontSize: '13px', color: '#6b748e', marginTop: '8px' },
}
