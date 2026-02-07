# 📦 JSX Files - Ready to Use
## 5 Complete React Components for Your Security System

---

## ✅ Files Available

```
1. Dashboard.jsx              ← Main app (use this)
2. CameraCard.jsx             ← Camera selector component
3. VideoPlayer.jsx            ← HLS video player
4. AlertNotification.jsx       ← Alert notifications
5. SecurityDashboard.jsx       ← Alternative main app
```

---

## 🚀 Quick Start

### Option 1: Use with Next.js

```bash
# Create Next.js app
npx create-next-app@latest my-security --typescript

# Copy JSX files to:
# src/components/Dashboard.jsx
# src/components/CameraCard.jsx
# src/components/VideoPlayer.jsx
# src/components/AlertNotification.jsx

# In src/app/page.tsx:
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return <Dashboard />;
}

# Run
npm run dev
```

### Option 2: Use with Create React App

```bash
# Create React app
npx create-react-app my-security

# Copy JSX files to:
# src/components/Dashboard.jsx
# src/components/CameraCard.jsx
# src/components/VideoPlayer.jsx
# src/components/AlertNotification.jsx

# In src/App.jsx:
import Dashboard from './components/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;

# Run
npm start
```

### Option 3: Use with Vite

```bash
# Create Vite app
npm create vite@latest my-security -- --template react

# Copy JSX files to:
# src/components/Dashboard.jsx
# src/components/CameraCard.jsx
# src/components/VideoPlayer.jsx
# src/components/AlertNotification.jsx

# In src/App.jsx:
import Dashboard from './components/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;

# Run
npm run dev
```

---

## 📋 Component Reference

### 1. Dashboard.jsx - Main Component

**What it does:**
- Complete security system dashboard
- Manages cameras, alerts, video streaming
- Real-time WebSocket updates
- All-in-one component

**Usage:**
```jsx
import Dashboard from './components/Dashboard';

export default function Home() {
  return <Dashboard />;
}
```

**Props:** None (self-contained)

**Features:**
- Multi-camera support
- Live video streaming
- Real-time alerts
- Camera selection
- Alert dismissal

---

### 2. CameraCard.jsx - Camera Selector

**What it does:**
- Displays camera info
- Shows online/offline status
- Camera selection

**Usage:**
```jsx
import CameraCard from './components/CameraCard';

function MyCameras() {
  const [selectedCamera, setSelectedCamera] = useState(null);

  const camera = {
    id: 'cam-1',
    name: 'Front Door',
    location: 'Entrance',
    status: 'online',
    resolution: '1080p',
    framerate: 30,
  };

  return (
    <CameraCard
      camera={camera}
      isSelected={selectedCamera?.id === camera.id}
      onSelect={setSelectedCamera}
      platform="web"
    />
  );
}
```

**Props:**
- `camera` (object) - Camera data
- `isSelected` (boolean) - Is this camera selected?
- `onSelect` (function) - Callback when selected
- `platform` (string) - 'web' or 'mobile'

---

### 3. VideoPlayer.jsx - Video Streaming

**What it does:**
- Plays HLS video streams
- Custom controls (play, volume, fullscreen)
- Error handling
- Live badge

**Usage:**
```jsx
import VideoPlayer from './components/VideoPlayer';

function MyVideo() {
  return (
    <VideoPlayer
      hlsUrl="http://localhost:3001/api/cameras/cam-1/stream"
      cameraId="cam-1"
      cameraName="Front Door"
      isLive={true}
      onError={(error) => console.error(error)}
    />
  );
}
```

**Props:**
- `hlsUrl` (string) - HLS stream URL
- `cameraId` (string) - Camera ID
- `cameraName` (string) - Display name
- `isLive` (boolean) - Show LIVE badge
- `onError` (function) - Error callback

**Features:**
- HLS.js integration
- Play/pause controls
- Volume control
- Fullscreen button
- Loading indicator
- Error display

---

### 4. AlertNotification.jsx - Alerts

**What it does:**
- Display motion alerts
- Auto-dismiss after duration
- Manual dismiss button
- Color-coded by type

**Single Alert Usage:**
```jsx
import AlertNotification from './components/AlertNotification';

function MyAlert() {
  const alert = {
    id: 'alert-1',
    cameraId: 'cam-1',
    cameraName: 'Front Door',
    alertType: 'motion',
    confidence: 85,
    timestamp: new Date().toISOString(),
  };

  return (
    <AlertNotification
      alert={alert}
      onDismiss={(alertId) => console.log('Dismissed:', alertId)}
      autoCloseDuration={5000}
    />
  );
}
```

**Alert List Usage:**
```jsx
import { AlertList } from './components/AlertNotification';

function MyAlerts() {
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      cameraName: 'Front Door',
      alertType: 'motion',
      timestamp: new Date().toISOString(),
    },
  ]);

  return (
    <AlertList
      alerts={alerts}
      onDismiss={(alertId) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }}
    />
  );
}
```

**Props (AlertNotification):**
- `alert` (object) - Alert data
- `onDismiss` (function) - Dismiss callback
- `autoCloseDuration` (number) - Close after ms (0 = never)

**Props (AlertList):**
- `alerts` (array) - Array of alerts
- `onDismiss` (function) - Dismiss callback

**Alert Types:**
- `motion` - Motion detected (⚠️ yellow)
- `object_detection` - Object detected (👤 blue)
- `offline` - Camera offline (❌ red)

---

### 5. SecurityDashboard.jsx - Alternative Main

Same as Dashboard.jsx, alternative design if you prefer.

---

## 🎨 Styling

All components have **inline styles** (styled in code):
- No CSS files needed
- Easy to customize
- Dark theme by default

### Customize Colors:

Edit styles object in each component:

```jsx
// In Dashboard.jsx, find styles object and change:
const styles = {
  header: {
    background: 'rgba(15, 23, 42, 0.8)',  // Change this color
    // ...
  },
  // ...
};
```

---

## 🔧 Connect to Your Backend

### Update API URL:

In `Dashboard.jsx`, change:
```javascript
const API_URL = 'http://localhost:3001';
```

To your actual backend:
```javascript
const API_URL = 'http://your-server.com:3001';
```

### Camera Data Format:

```javascript
{
  id: 'cam-1',
  name: 'Front Door',
  location: 'Entrance',
  status: 'online',  // or 'offline'
  rtspUrl: 'rtsp://...',
  resolution: '1080p',
  framerate: 30,
}
```

### Alert Data Format:

```javascript
{
  id: 'alert-1',
  cameraId: 'cam-1',
  cameraName: 'Front Door',
  alertType: 'motion',  // or 'object_detection', 'offline'
  confidence: 85,       // optional
  objectClass: 'person', // optional
  timestamp: '2024-02-07T12:00:00.000Z',
}
```

---

## 📱 Responsive Design

Components work on:
- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 768px)

CSS Grid automatically adjusts:
```jsx
// Dashboard.jsx main grid:
main {
  grid-template-columns: 1fr 350px;  // Desktop
  
  // Mobile will stack vertically
}
```

---

## 🌐 Browser Support

Works on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Android Chrome

---

## 🚀 Integration Examples

### With Express Backend:

```jsx
// Dashboard.jsx already expects:
// GET  http://localhost:3001/api/cameras
// GET  http://localhost:3001/api/alerts
// POST http://localhost:3001/api/alerts/:id/dismiss
// GET  http://localhost:3001/api/cameras/:id/stream
```

### With Firebase:

```jsx
// Replace WebSocket with Firebase Realtime Database:
import { getDatabase, ref, onValue } from "firebase/database";

useEffect(() => {
  const db = getDatabase();
  const alertsRef = ref(db, 'alerts');
  
  onValue(alertsRef, (snapshot) => {
    setAlerts(Object.values(snapshot.val()));
  });
}, []);
```

### With REST API:

```jsx
// Replace WebSocket with polling:
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`${API_URL}/api/alerts`);
    const data = await res.json();
    setAlerts(data);
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(interval);
}, []);
```

---

## 🎯 Common Tasks

### Add New Feature:

1. Create new component in `src/components/`
2. Import in Dashboard.jsx
3. Add to rendering

### Customize Theme:

1. Edit `styles` object in components
2. Change colors, fonts, sizes
3. Redeploy

### Add More Cameras:

1. Update backend to return more cameras
2. Component automatically handles multiple cameras
3. Grid adjusts automatically

### Change Alert Types:

In `AlertNotification.jsx`, update `alertTypeConfig`:
```jsx
const alertTypeConfig = {
  motion: { icon: '⚠️', color: '#f59e0b' },
  person: { icon: '👤', color: '#3b82f6' },
  package: { icon: '📦', color: '#8b5cf6' },
  // Add more...
};
```

---

## 📊 File Sizes

```
Dashboard.jsx           ~15 KB
CameraCard.jsx          ~2 KB
VideoPlayer.jsx         ~8 KB
AlertNotification.jsx   ~7 KB
SecurityDashboard.jsx   ~15 KB

Total:                  ~47 KB (uncompressed)
Minified:              ~12 KB
```

---

## ✨ What Each Component Does

| Component | Purpose | Standalone |
|-----------|---------|-----------|
| Dashboard | Complete app | ✅ Yes |
| CameraCard | Camera selector | ❌ Use in Dashboard |
| VideoPlayer | Video stream | ❌ Use in Dashboard |
| AlertNotification | Alerts | ✅ Yes (standalone) |
| SecurityDashboard | Alternative app | ✅ Yes |

---

## 🔗 How They Connect

```
Dashboard.jsx
├── CameraCard.jsx (rendered inside)
├── VideoPlayer.jsx (rendered inside)
└── AlertNotification.jsx (rendered inside)

All components use:
- fetch() for REST API
- WebSocket for real-time updates
- Inline CSS styles
```

---

## 💡 Pro Tips

1. **Use Dashboard.jsx** - Most complete
2. **Copy then customize** - Don't edit original files
3. **Keep API URL in env variable** - For deployment
4. **Test on mobile** - Use browser dev tools
5. **Check browser console** - For errors

---

## 🚀 Deploy

### To Vercel:

```bash
# Create .env.local
REACT_APP_API_URL=https://your-api.com:3001

# Deploy
vercel deploy
```

### To GitHub Pages:

```bash
# Build
npm run build

# Deploy with gh-pages
npm run deploy
```

### To Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ✅ Everything You Need

✅ 5 complete JSX components
✅ Fully functional
✅ No additional dependencies (except React)
✅ HLS.js loaded from CDN
✅ Inline styles (no CSS files)
✅ Dark theme included
✅ Responsive design
✅ Error handling
✅ WebSocket support
✅ Copy-paste ready

---

## 🎬 Next Steps

1. Download all JSX files
2. Copy to your React project
3. Import Dashboard.jsx
4. Update API_URL to your backend
5. Run and see it work!

```bash
npm start
# Open http://localhost:3000
# See your security system!
```

---

**Everything is ready to use. Just copy, paste, and run! 🚀**
