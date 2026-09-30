'use client'

export default function StudentDashboard() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px',
        background: '#f2f4f9',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          background: '#fff',
          padding: '32px',
          borderRadius: '16px',
        }}
      >
        <h1>EduSwati Dashboard Test</h1>
        <p>
          If you can see this page without React hydration errors,
          the Next.js dashboard route is working correctly.
        </p>
      </div>
    </main>
  )
}
