# EduSwati — Deployment Guide
## Supabase (free) + Vercel (free) · Zero to live in ~30 minutes

---

## PART 1 — SUPABASE SETUP

### Step 1 · Create your project
1. Go to **https://supabase.com** → Sign up (GitHub login is fastest)
2. Click **New Project**
3. Name: `eduswati` · Database password: save this somewhere safe · Region: pick closest to Eswatini (try **South Africa** or **Europe West**)
4. Wait ~2 minutes for the project to spin up

### Step 2 · Run the schema
1. In the left sidebar click **SQL Editor**
2. Click **New query**
3. Open the file `supabase/migrations/001_schema.sql` from this project
4. Paste the entire contents and click **Run** (green button)
5. You should see: `Success. No rows returned` — that means it worked

### Step 3 · Get your API keys
1. Left sidebar → **Settings** → **API**
2. Copy these three values — you'll need them in a moment:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep this secret

### Step 4 · Configure email (auth confirmations)
1. Left sidebar → **Authentication** → **Email Templates**
2. Confirm Sign Up template — the default works fine
3. Left sidebar → **Authentication** → **URL Configuration**
4. Set **Site URL** to `https://your-project.vercel.app` (update after Vercel deploy)
5. Add to **Redirect URLs**: `https://your-project.vercel.app/auth/callback`

### Step 5 · Create your first Admin user
1. Left sidebar → **Authentication** → **Users** → **Add user**
2. Enter your admin email and a strong password → **Create user**
3. Go to **SQL Editor** → New query → run:
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-admin@email.com'
);
```
4. That user can now log in and access `/admin`

### Step 6 · Create a Storage bucket for eBook PDFs
1. Left sidebar → **Storage** → **New bucket**
2. Name: `ebooks` · Make it **Private** (students access via signed URLs)
3. Repeat for `thumbnails` bucket (Public)

---

## PART 2 — VERCEL SETUP

### Step 1 · Push code to GitHub
```bash
# In the eduswati-nextjs folder:
git init
git add .
git commit -m "Initial EduSwati commit"
git remote add origin https://github.com/YOUR_USERNAME/eduswati.git
git push -u origin main
```

### Step 2 · Connect to Vercel
1. Go to **https://vercel.com** → Log in with GitHub
2. Click **Add New Project** → import your `eduswati` repo
3. Framework: **Next.js** (auto-detected)
4. Click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` |

5. Click **Deploy** — takes ~2 minutes

### Step 3 · Copy your static HTML files to `/public`
The existing HTML dashboards are served as static files.
Copy these into the `public/` folder of your Next.js project:
```
public/
  eduswati-student.html
  eduswati-admin.html
  elearning.html
  MTN-1.jpg          ← any image assets
```

### Step 4 · Update Supabase with your Vercel URL
1. Supabase → **Authentication** → **URL Configuration**
2. Update **Site URL** to your actual Vercel URL
3. Add redirect URL: `https://your-actual-domain.vercel.app/auth/callback`

---

## PART 3 — YOUR FILE STRUCTURE

```
eduswati-nextjs/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                   ← redirects to /login
│   ├── login/page.tsx             ← Supabase login
│   ├── signup/page.tsx            ← student signup
│   ├── forgot-password/page.tsx   ← password reset request
│   ├── auth/
│   │   ├── callback/route.ts      ← email confirmation handler
│   │   └── reset-password/page.tsx
│   ├── dashboard/page.tsx         ← student dashboard (protected)
│   ├── admin/page.tsx             ← admin dashboard (protected)
│   └── api/
│       ├── auth/logout/route.ts
│       ├── student/
│       │   ├── me/route.ts
│       │   ├── ebooks/route.ts
│       │   ├── videos/route.ts
│       │   ├── progress/route.ts
│       │   └── study-sessions/route.ts
│       └── admin/
│           ├── stats/route.ts
│           ├── students/route.ts
│           ├── students/[id]/route.ts
│           ├── ebooks/route.ts
│           ├── videos/route.ts
│           └── plans/route.ts
├── components/
│   ├── StudentDashboard.tsx
│   └── AdminDashboard.tsx
├── lib/
│   ├── types.ts
│   └── supabase/
│       ├── client.ts              ← browser client
│       ├── server.ts              ← server client
│       └── admin.ts               ← service role client
├── middleware.ts                  ← route protection
├── supabase/migrations/
│   └── 001_schema.sql
├── public/
│   ├── eduswati-student.html
│   ├── eduswati-admin.html
│   └── elearning.html
├── .env.local                     ← your secrets (never commit)
├── .env.example                   ← safe template (commit this)
├── .gitignore
├── next.config.js
└── package.json
```

---

## PART 4 — USER FLOWS

| User | URL | What happens |
|------|-----|-------------|
| Anyone | `/` | Redirected to `/login` |
| Anyone | `/signup` | Register as student |
| Student logs in | `/login` | Redirected to `/dashboard` |
| Admin logs in | `/login` | Redirected to `/admin` |
| Student visits `/admin` | blocked | Redirected to `/dashboard` |
| Admin visits `/dashboard` | blocked | Redirected to `/admin` |
| Anyone visits protected page without login | blocked | Redirected to `/login` |

---

## PART 5 — QUICK COMMANDS

```bash
# Install dependencies
npm install

# Run locally
npm run dev
# Open http://localhost:3000

# Build for production
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

---

## PART 6 — FREE TIER LIMITS TO KNOW

| Service | Free Limit | EduSwati Impact |
|---------|-----------|----------------|
| Supabase DB | 500 MB | Fine for hundreds of students |
| Supabase MAUs | 50,000/mo | More than enough |
| Supabase Storage | 1 GB | ~3-5 PDF textbooks |
| Supabase Bandwidth | 5 GB/mo | Watch this as you grow |
| Supabase Inactivity | Pauses after 1 week | Keep alive with a cron ping |
| Vercel | Unlimited deploys | Free forever for this stack |

**Tip to prevent Supabase pausing:** Set up a free cron job at
https://cron-job.org to ping your API every 3 days:
`GET https://your-project.vercel.app/api/student/me`
(it will return 401 but that's fine — it keeps Supabase awake)

---

## PART 7 — SUPABASE FREE TIER PAUSE FIX

Add this keep-alive endpoint so Supabase doesn't sleep:

```typescript
// app/api/ping/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET() {
  const supabase = await createClient()
  await supabase.from('plans').select('id').limit(1)
  return NextResponse.json({ ok: true, time: new Date().toISOString() })
}
```

Set cron-job.org to call `GET /api/ping` every 3 days.
