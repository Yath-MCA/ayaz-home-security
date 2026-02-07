# Home Security Dashboard

A modern React-based security system dashboard for monitoring cameras and alerts.

## Features

- 🎥 Multi-camera support with live video streaming
- 🔔 Real-time alert notifications
- 📱 Responsive design (desktop, tablet, mobile)
- 🎨 Dark theme UI
- ⚡ Fast and lightweight

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx          # Main dashboard component
│   ├── CameraCard.jsx         # Camera selector component
│   ├── VideoPlayer.jsx       # HLS video player
│   └── AlertNotification.jsx # Alert notifications
├── App.jsx                    # Root component
└── main.jsx                  # Entry point
```

## Backend Configuration

The dashboard expects a backend API at `http://localhost:3001` with the following endpoints:

- `GET /api/cameras` - List all cameras
- `GET /api/alerts` - List all alerts
- `POST /api/alerts/:id/dismiss` - Dismiss an alert
- `GET /api/cameras/:id/stream` - Get HLS stream URL for a camera
- WebSocket at `ws://localhost:3001` - Real-time updates

To change the API URL, edit `src/components/Dashboard.jsx` and update the `API_URL` constant.

## Camera Data Format

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

## Alert Data Format

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

## Technologies

- React 18
- Vite
- HLS.js (loaded from CDN)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

### Deploy to Vercel

#### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

#### Option 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Go to [vercel.com](https://vercel.com)** and sign in

3. **Click "Add New Project"**

4. **Import your repository**

5. **Vercel will auto-detect Vite** - no configuration needed!

6. **Click "Deploy"**

The project is already configured with `vercel.json` for optimal deployment.

### Environment Variables (if needed)

If you need to set environment variables in Vercel:
- Go to Project Settings → Environment Variables
- Add variables like `VITE_API_URL` if needed
- Update your code to use `import.meta.env.VITE_API_URL`

## License

MIT
