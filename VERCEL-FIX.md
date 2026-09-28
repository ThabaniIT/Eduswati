# EduSwati Vercel Fix

This project is already a Next.js App Router project. The important requirement is that `package.json` and the `app/` directory are at the SAME repository root.

Expected root:

- package.json
- app/layout.tsx
- app/page.tsx
- app/login/page.tsx
- app/signup/page.tsx
- app/dashboard/page.tsx
- app/admin/page.tsx
- lib/supabase/
- middleware.ts

## Vercel

Set **Root Directory** to the folder containing `package.json` and `app/`.

If your GitHub repository contains `eduswati-nextjs/` as a subfolder, either:
1. set Vercel Root Directory to `eduswati-nextjs`, OR
2. upload/push the CONTENTS of this fixed package to the repository root.

Framework Preset: Next.js
Build Command: `next build` (or leave automatic)

Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- NEXT_PUBLIC_SITE_URL

Never expose SUPABASE_SERVICE_ROLE_KEY to browser/client code.
