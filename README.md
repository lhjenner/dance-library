# Dance Library

A dance move library that utilises YouTube.

## Overview

Dance Library is a YouTube playlist manager on steroids, designed for dancers who want to organize, curate, and practice from their YouTube video collections. Manage playlists, mark video segments, add tags, and control playback speed—all in one place.

## Features

### Playlist Management
- **Sync YouTube Playlists** - Connect and sync your YouTube playlists
- **Auto-refresh** - Automatically detect new videos added to playlists
- **Hide Empty Playlists** - Empty playlists hidden by default with toggle to show/hide
- **Create/Rename/Delete** - Full playlist management that syncs with YouTube
- **Move/Copy Videos** - Organize videos between playlists with independent empty playlist toggle
- **Newest First** - Videos sorted with newest at the top
- **Untagged Indicators** - Visual badges showing videos without tags

### Video Segmentation
- **Time Markers** - Set start/end markers to isolate specific sections
- **Multiple Segments** - Mark multiple time ranges within a single video
- **Click or Type** - Mark segments by clicking during playback or manual timestamp entry
- **Segment Playback** - Play individual segments with one click
- **Full Video Option** - Toggle to watch complete uncut video

### Tagging System
- **Video-level Tags** - Tag entire videos (e.g., "Whip", "Lindy Hop")
- **Segment-level Tags** - Tag individual segments (e.g., "Reverse Whip", "Open Whip")
- **Filter by Tags** - Search and filter across all videos by tags
- **Notes** - Add text notes to videos for additional context

### Playback Controls
- **Speed Control** - Adjust playback speed (0.25x to 2x)
- **Pre-set Speed** - Set speed before playing a segment
- **Mobile Fullscreen** - Fullscreen support with device rotation

## Tech Stack

### Frontend
- **React** - Component-based UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **YouTube IFrame Player API** - Embedded video player with precise playback control

### Backend & Database
- **Firebase Authentication** - User authentication and management
- **Firebase Firestore** - NoSQL database for video metadata, tags, and segments
- **Firebase Hosting** - Static site hosting

### APIs
- **YouTube Data API v3** - Fetch playlists, videos, and manage YouTube content
- **OAuth 2.0** - Google authentication for YouTube API access

## Architecture

### Data Model

**Playlists Collection**
```javascript
{
  id: "playlist_youtube_id",
  userId: "user_123",
  title: "Moves to Learn",
  youtubeId: "PLxxx...",
  lastSynced: timestamp,
  videoCount: 42
}
```

**Videos Collection**
```javascript
{
  id: "video_youtube_id",
  userId: "user_123",
  youtubeId: "dQw4w9WgXcQ",
  title: "Advanced Whip Variations",
  thumbnail: "https://...",
  duration: 380, // seconds
  playlistId: "playlist_youtube_id",
  addedToPlaylist: timestamp,
  tags: ["whip", "advanced", "lindy hop"],
  notes: "Great breakdown of whip mechanics",
  segments: [
    {
      id: "segment_1",
      startTime: 83, // seconds
      endTime: 125,
      tags: ["reverse whip"],
      notes: "Focus on follower's rotation"
    },
    {
      id: "segment_2",
      startTime: 200,
      endTime: 245,
      tags: ["open whip"]
    }
  ]
}
```

**User Preferences**
```javascript
{
  userId: "user_123",
  defaultPlaybackSpeed: 0.75,
  lastAccessedPlaylist: "playlist_id",
  showEmptyPlaylists: false
}
```

### Application Flow

1. **Authentication** - User logs in with Google (Firebase Auth + OAuth 2.0) to grant YouTube access
2. **User Isolation** - All data queries filtered by authenticated user's ID
3. **Playlist Sync** - App fetches user's playlists and videos via YouTube API
4. **Data Storage** - Video metadata stored in Firestore with userId for isolation
5. **User Interaction** - Add tags, mark segments, manage playlists
6. **Playback** - Embedded YouTube player with custom controls and segment jumping
7. **Sync Changes** - Playlist modifications (add/remove/move) synced back to YouTube

## Implementation Roadmap

### Phase 1: Project Setup & Authentication
- [x] Initialize Git repository
- [x] Set up React + Vite project
- [x] Configure Tailwind CSS
- [x] Set up Firebase project (Authentication + Firestore + Hosting)
- [x] Implement Firebase Authentication with Google provider
- [x] Configure YouTube Data API v3 OAuth 2.0 credentials
- [x] Set up Firestore security rules for multi-user data isolation

### Phase 2: YouTube Integration
- [x] Fetch user's YouTube playlists
- [x] Fetch videos from playlists
- [x] Store playlists and videos with userId in Firestore
- [x] Display playlists in UI (sortable list with drag-and-drop)
- [x] Add toggle to show/hide empty playlists
- [x] Display videos in playlist view
- [x] Implement playlist sync/refresh functionality (auto-sync on load)

### Phase 3: Video Player & Segmentation
- [x] Embed YouTube IFrame Player
- [x] Implement playback speed controls
- [x] Add segment marking controls (click-based)
- [x] Add manual timestamp input
- [x] Display and manage segment list
- [x] Implement segment playback

### Phase 4: Tagging & Search
- [ ] Add/edit/delete video-level tags
- [ ] Add/edit/delete segment-level tags
- [ ] Implement tag filtering
- [ ] Add notes field for videos
- [ ] Add untagged video indicators

### Phase 5: Playlist Management
- [ ] Create new playlists (sync to YouTube)
- [ ] Rename playlists (sync to YouTube)
- [ ] Delete playlists (sync to YouTube)
- [ ] Move videos between playlists
- [ ] Copy videos to multiple playlists
- [ ] Remove videos from playlists

### Phase 6: Mobile Optimization
- [ ] Responsive design for mobile devices
- [ ] Fullscreen video on rotation
- [ ] Touch-friendly controls
- [ ] Test on Android devices

### Phase 7: Polish & Deployment
- [ ] Error handling and loading states
- [ ] Optimize performance
- [ ] Add user preferences persistence
- [ ] Deploy to Firebase Hosting
- [ ] Documentation and user guide

## Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase account
- Google Cloud Console account (for YouTube API)
- YouTube API OAuth 2.0 credentials

### Setup Instructions
(Coming soon)

## License

MIT License (to be confirmed)
