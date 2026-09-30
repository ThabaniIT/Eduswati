export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        background: '#f2f4f9',
      }}
    >
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '32px',
          background: '#ffffff',
          borderRadius: '16px',
        }}
      >
        <h1>EduSwati Dashboard Test</h1>

        <p>
          This is a temporary test page.
        </p>

        <p>
          If this page loads without React hydration errors,
          the problem is inside the original dashboard components.
        </p>
      </div>
    </main>
  )
}
