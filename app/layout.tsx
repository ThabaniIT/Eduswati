// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduSwati — Eswatini eLearning Platform',
  description: 'Curriculum-aligned eBooks and video lessons for Eswatini students, Grades 8–12.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
