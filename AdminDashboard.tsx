// components/AdminDashboard.tsx
'use client'
import { useEffect, useRef } from 'react'
import type { Profile } from '@/lib/types'

interface Props { profile: Profile }

export default function AdminDashboard({ profile }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function handleIframeLoad() {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage({
      type: 'EDUSWATI_AUTH',
      profile,
    }, window.location.origin)
  }

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'LOGOUT') {
        fetch('/api/auth/logout', { method: 'POST' })
          .then(() => window.location.href = '/login')
      }
      // Admin API proxy — the HTML dashboard calls these
      if (e.data?.type === 'ADMIN_API') {
        const { endpoint, method, body, requestId } = e.data
        fetch(`/api/admin/${endpoint}`, {
          method: method ?? 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        })
          .then(r => r.json())
          .then(data => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'ADMIN_API_RESPONSE', requestId, data },
              window.location.origin
            )
          })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <iframe
      ref={iframeRef}
      src="/eduswati-admin.html"
      onLoad={handleIframeLoad}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="EduSwati Admin Dashboard"
    />
  )
}
