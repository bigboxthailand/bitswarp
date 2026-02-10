# BitSwarp Deployment Guide 🚀

To get BitSwarp live globally, follow these steps. I recommend using **Vercel** for the frontends and **Railway** for the Bun backend.

## 1. Frontend (ui, app, admin) on Vercel

Since we have three frontend projects, you should create **3 separate projects** on Vercel pointing to the same GitHub repository:

### A. Landing Page (ui)
- **Framework Preset:** Astro
- **Root Directory:** `ui`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### B. Trading Dashboard (app)
- **Framework Preset:** Vite
- **Root Directory:** `app`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### C. Command Center (admin)
- **Framework Preset:** Vite
- **Root Directory:** `admin`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

---

## 2. Backend (api) on Railway or Render

The backend uses **Bun**, which is extremely fast. Vercel is great for Serverless, but for a high-performance trading engine, a dedicated server is better.

### Instructions for Railway:
1. Connect your GitHub.
2. Select the `api` folder as the root.
3. Railway will auto-detect the `Dockerfile` or Bun environment.
4. **Environment Variables:** Don't forget to copy from `api/.env.example`.

---

## 3. Post-Deployment Checklist
- [ ] Update `API_BASE_URL` in `app/src/App.tsx` and `admin/src/App.tsx` to point to your live Railway URL.
- [ ] Update CORS settings in `api/index.ts` to allow your new Vercel domains.
- [ ] Set up your Custom Domains (e.g., bitswarp.com, app.bitswarp.com).
