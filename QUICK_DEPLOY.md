# ⚡ Quick Deploy to Vercel

## 🚀 Fastest Way (2 minutes)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel --prod
```

**That's it!** Your app will be live in ~1 minute.

---

## 📋 Alternative: Deploy via GitHub

### Step 1: Initialize Git (if not done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub
```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/yourusername/home-security.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Deploy"

---

## ✅ What's Already Configured

- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to exclude
- ✅ Build tested and working
- ✅ SPA routing configured

## 🎯 After Deployment

Your app will be available at:
- `https://your-project-name.vercel.app`

**Default Login:**
- Username: `admin`
- Password: `admin123`

---

## 🔧 If You Need to Update API URL

After deployment, if your backend is not at `localhost:3001`:

1. **Edit** `src/components/Dashboard.jsx`
2. **Change** `const API_URL = 'http://localhost:3001';`
3. **To** your production API URL
4. **Redeploy** with `vercel --prod`

---

**Ready to deploy? Run: `vercel --prod`** 🚀
