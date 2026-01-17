# Dance Library - Developer Setup Guide

Complete setup instructions for developers who want to run or contribute to Dance Library.

## Prerequisites

- **Node.js** 18+ and npm
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git** for version control
- **Google Cloud Account** for YouTube API
- **Firebase Account** (free tier works)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/lhjenner/dance-library.git
cd dance-library
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it (e.g., "dance-library")
4. Enable Google Analytics (optional)
5. Create project

#### Enable Firebase Services

**Authentication:**
1. Go to Authentication → Sign-in method
2. Enable **Google** provider
3. Add authorized domains (localhost, your domain)

**Firestore Database:**
1. Go to Firestore Database
2. Click **"Create database"**
3. Start in **production mode**
4. Choose region (e.g., australia-southeast1)

**Hosting:**
1. Go to Hosting
2. Click **"Get started"**
3. Follow setup instructions

#### Get Firebase Config

1. Project Settings → General
2. Under "Your apps" → Web app → Add app
3. Register app with a nickname
4. Copy the config object

### 4. Google Cloud Setup (YouTube API)

#### Enable YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project (or create one)
3. Navigate to **APIs & Services → Library**
4. Search for **"YouTube Data API v3"**
5. Click **Enable**

#### Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"Create Credentials" → OAuth client ID**
3. Configure consent screen if prompted:
   - User Type: **External**
   - App name: "Dance Library"
   - Support email: Your email
   - Scopes: Add `youtube` scope
4. Application type: **Web application**
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev server)
   - Your production domain
6. Add authorized redirect URIs:
   - `http://localhost:5173`
   - Your production domain
7. Click **Create**
8. Copy the **Client ID**

### 5. Environment Variables

Create `.env` file in project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

**Where to find these values:**
- Firebase values: Firebase Console → Project Settings → Config object
- Google Client ID: Google Cloud Console → Credentials

### 6. Deploy Firestore Rules

```bash
firebase login
firebase use --add    # Select your project
firebase deploy --only firestore:rules
```

### 7. Configure Firestore Indexes

The app uses collectionGroup queries which require single-field exemptions:

1. Run the app and try to load a playlist
2. Check browser console for index creation link
3. Click the link to auto-create the index
4. Wait 1-5 minutes for index to build

**Or manually configure:**
1. Go to Firestore → Indexes → Single-field
2. Add exemption for `segments.userId`:
   - Collection group: **segments**
   - Field: **userId**
   - Query scope: **Collection group**
   - Enable all modes (Arrays, Ascending, Descending)

## Development

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

Output in `dist/` folder

### Preview Production Build

```bash
npm run preview
```

### Deploy to Firebase Hosting

```bash
firebase deploy
```

Or deploy only hosting:

```bash
firebase deploy --only hosting
```

## Project Structure

```
dance-library/
├── src/
│   ├── components/
│   │   ├── playlists/          # Playlist management
│   │   │   ├── Playlists.jsx
│   │   │   ├── SortablePlaylistItem.jsx
│   │   │   └── CreatePlaylistModal.jsx
│   │   ├── videoplayer/        # Video player & segments
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── useYouTubePlayer.js
│   │   │   ├── useVideoSegments.js
│   │   │   └── SegmentItem.jsx
│   │   └── videolist/          # Video list & operations
│   │       ├── VideoList.jsx
│   │       ├── VideoCard.jsx
│   │       ├── VideoListHeader.jsx
│   │       ├── TagFilter.jsx
│   │       ├── Snackbar.jsx
│   │       ├── MoveVideoModal.jsx
│   │       ├── CopyVideoModal.jsx
│   │       ├── DeleteVideoModal.jsx
│   │       └── hooks/
│   │           ├── useVideoData.js
│   │           ├── useVideoOperations.js
│   │           └── useTagFiltering.js
│   ├── contexts/
│   │   ├── AuthContext.jsx    # Firebase Auth
│   │   ├── YouTubeContext.jsx # YouTube API
│   │   └── PreferencesContext.jsx # User settings
│   ├── firebase/
│   │   └── config.js          # Firebase initialization
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css              # Tailwind styles
├── public/
├── firestore.rules            # Security rules
├── firestore.indexes.json     # Index configuration
├── firebase.json              # Firebase config
├── .env                       # Environment variables (not in git)
├── package.json
└── vite.config.js
```

## Key Technologies

- **React 19.2.0** - UI framework
- **Vite 7.2.5** - Build tool (rolldown)
- **Tailwind CSS 4.1** - Styling
- **Firebase** - Backend (Auth, Firestore, Hosting)
- **YouTube Data API v3** - Playlist management
- **@dnd-kit** - Drag and drop for playlists

## Firestore Data Model

### Collections

**playlists/**
```javascript
{
  id: string,              // playlist ID (same as youtubeId)
  userId: string,          // owner user ID
  youtubeId: string,       // YouTube playlist ID
  title: string,
  description: string,
  thumbnail: string,
  videoCount: number,
  order: number,           // custom sort order
  lastSynced: timestamp,
  createdAt: timestamp
}
```

**videos/**
```javascript
{
  id: string,              // video ID (same as youtubeId)
  userId: string,
  youtubeId: string,       // YouTube video ID
  playlistId: string,      // parent playlist ID
  playlistItemId: string,  // YouTube playlist item ID
  title: string,
  description: string,
  thumbnail: string,
  duration: number,
  publishedAt: timestamp,
  addedToPlaylist: timestamp,
  tags: string[],          // video-level tags
  notes: string
}
```

**videos/{videoId}/segments/** (subcollection)
```javascript
{
  id: string,
  userId: string,          // for collectionGroup queries
  startTime: number,       // seconds
  endTime: number,         // seconds
  tags: string[],          // segment-level tags
  notes: string,
  createdAt: timestamp
}
```

**userPreferences/{userId}**
```javascript
{
  defaultPlaybackSpeed: number,     // 0.25 - 2
  showEmptyPlaylists: boolean,
  lastAccessedPlaylistId: string
}
```

## Security Rules

Firestore rules ensure user isolation:

```javascript
// Users can only access their own data
match /playlists/{playlistId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

match /videos/{videoId} {
  allow read, write: if request.auth.uid == resource.data.userId;
  
  match /segments/{segmentId} {
    allow read, write: if request.auth.uid == 
      get(/databases/$(database)/documents/videos/$(videoId)).data.userId;
  }
}

// CollectionGroup queries
match /{path=**}/segments/{segmentId} {
  allow read: if request.auth.uid == resource.data.userId;
}
```

## Performance Optimizations

### Batched Writes
- Video metadata written in single batch operation
- Reduces 93 writes → 1 batch for large playlists

### CollectionGroup Queries
- Fetch all segments in one query vs N queries
- Falls back gracefully if index not ready

### Real-time Updates
- onSnapshot listeners for instant playlist updates
- Automatic UI refresh when data changes

### Caching
- User preferences cached in PreferencesContext
- Last selected playlist/video restored from preferences

## Common Issues

### "Index not ready" Error

**Solution:** Wait 1-5 minutes for Firestore index to build, or app will use fallback method automatically.

### YouTube API Quota

Free tier: 10,000 units/day
- Playlist list: 1 unit
- Playlist items: 1 unit per 50 videos
- Usual usage well within limits

### CORS Errors

Ensure authorized domains are configured in:
1. Firebase Authentication settings
2. Google Cloud OAuth credentials

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

### Code Style

- Use functional components with hooks
- Keep components under 500 lines
- Extract custom hooks for complex logic
- Add comments for non-obvious code
- Follow existing naming conventions

### Testing Checklist

- [ ] Authentication flow works
- [ ] Playlists sync from YouTube
- [ ] Video operations (move/copy/delete)
- [ ] Segment marking and playback
- [ ] Tag filtering works correctly
- [ ] Mobile responsive layout
- [ ] Landscape mode on mobile
- [ ] Preferences persist across sessions

## Resources

- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)

## License

This project is private and not licensed for public use.

## Support

For issues or questions, open an issue on GitHub.
