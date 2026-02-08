# 🚀 Deployment Commands

## Git Commands (Already Executed)

```bash
git init
git add .
git commit -m "Initial commit: Home Security Dashboard with login, user management, and webcam support"
```

## Next Steps: Push to GitHub

### 1. Create Repository on GitHub
- Go to [github.com](https://github.com)
- Click "New repository"
- Name it: `home-security` (or any name)
- Don't initialize with README
- Click "Create repository"

### 2. Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/home-security.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Deploy"

## Quick Deploy (All-in-One)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

**Your app will be live at:** `https://your-project-name.vercel.app`

**Default Login:**
- Username: `admin`
- Password: `admin123`
