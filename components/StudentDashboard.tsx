// components/StudentDashboard.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { Profile, Subscription } from '@/lib/types'

interface Props {
  profile: Profile
  subscription: (Subscription & { plan?: any }) | null
}

export default function StudentDashboard({
  profile,
  subscription,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function sendAuthData() {
      const iframe = iframeRef.current

      if (!iframe?.contentWindow) {
        return
      }

      iframe.contentWindow.postMessage(
        {
          type: 'EDUSWATI_AUTH',
          profile,
          subscription,
        },
        window.location.origin
      )
    }

    function handleIframeLoad() {
      sendAuthData()
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return
      }

      if (event.data?.type === 'LOGOUT') {
        fetch('/api/auth/logout', {
          method: 'POST',
        }).finally(() => {
          window.location.href = '/login'
        })
      }
    }

    const iframe = iframeRef.current

    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad)
    }

    window.addEventListener('message', handleMessage)

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad)
      }

      window.removeEventListener('message', handleMessage)
    }
  }, [profile, subscription])

  return (
    <main
      style={{
        width: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      <iframe
        ref={iframeRef}
        src="/eduswati-student.html"
        title="EduSwati Student Dashboard"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block',
        }}
      />
    </main>
  )
}
