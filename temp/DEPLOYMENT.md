# 🚀 Deployment Guide - Vercel

This guide will help you deploy the Home Security Dashboard to Vercel.

## Prerequisites

- ✅ Code is ready (build tested successfully)
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Vercel account (free tier works)

## Quick Deployment (5 minutes)

### Method 1: Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub/GitLab/Bitbucket

3. **Import Project**
   - Click "Add New Project"
   - Select your repository
   - Vercel will auto-detect Vite

4. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes
   - Your app will be live! 🎉

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # First deployment (preview)
   vercel

   # Production deployment
   vercel --prod
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Confirm settings
   - Done!

## Configuration

The project includes `vercel.json` with optimal settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures:
- ✅ Correct build command
- ✅ Proper output directory
- ✅ SPA routing works (all routes → index.html)

## Post-Deployment

### 1. Update API URLs (if needed)

If your backend API is not at `localhost:3001`, update the API URL:

**Option A: Environment Variable**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-api.com`
3. Update `src/components/Dashboard.jsx`:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
   ```

**Option B: Direct Update**
- Edit `src/components/Dashboard.jsx`
- Change `API_URL` constant
- Redeploy

### 2. Test Your Deployment

- ✅ Home page loads
- ✅ Login works
- ✅ Dashboard displays
- ✅ Webcam access works (if no cameras)
- ✅ User management works

### 3. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS instructions
4. Wait for SSL certificate (automatic)

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Make sure all dependencies are in package.json
npm install
npm run build
```

### Routing Issues

If routes don't work (404 errors):
- ✅ Check `vercel.json` has rewrites
- ✅ Ensure all routes go to `/index.html`

### API Connection Issues

**CORS Errors:**
- Update backend CORS to allow your Vercel domain
- Or use Vercel Serverless Functions as proxy

**WebSocket Issues:**
- WebSockets need `wss://` (secure) on HTTPS
- Update WebSocket URL in Dashboard.jsx

## Performance Tips

1. **Enable Edge Functions** (if needed)
2. **Use Vercel Analytics** (optional)
3. **Enable Automatic HTTPS** (default)
4. **Use CDN** (automatic with Vercel)

## Monitoring

- **Vercel Dashboard** - View deployments, logs, analytics
- **Real-time Logs** - Debug issues in production
- **Performance Metrics** - Monitor load times

## Rollback

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Success! 🎉

Your app is now live at:
- `https://your-project.vercel.app`

Share the link and enjoy! 🚀

---

**Need Help?**
- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html#vercel)
