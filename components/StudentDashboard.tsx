// components/StudentDashboard.tsx
// Renders the full student dashboard HTML with live Supabase data injected
'use client'
import { useEffect, useRef } from 'react'
import type { Profile, Subscription } from '@/lib/types'

interface Props {
  profile: Profile
  subscription: (Subscription & { plan?: any }) | null
}

export default function StudentDashboard({ profile, subscription }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Pass auth data into the iframe once it loads
  function handleIframeLoad() {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage({
      type: 'EDUSWATI_AUTH',
      profile,
      subscription,
    }, window.location.origin)
  }

  // Logout button listener from inside the iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'LOGOUT') {
        fetch('/api/auth/logout', { method: 'POST' })
          .then(() => window.location.href = '/login')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <iframe
      ref={iframeRef}
      src="/eduswati-student.html"
      onLoad={handleIframeLoad}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="EduSwati Student Dashboard"
    />
  )
}
