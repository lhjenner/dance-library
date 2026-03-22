# Video Archive Feature - Implementation Plan

## Overview
Add Archive/Restore functionality to move videos between playlists and their archive counterparts. When archiving, videos are moved to an archive version of the playlist (e.g., "Reels" → "zzReels Archive"). The "zz" prefix ensures archive playlists appear at the bottom of the playlist list in YouTube.

## User Requirements Summary
- **Archive Operation**: Move video(s) to "zz{PlaylistName} Archive" version of current playlist
- **Restore Operation**: Move video(s) back to original playlist (derived from archive name)
- **Archive Playlist Creation**: Auto-create archive playlist when first video is archived (if doesn't exist)
- **Archive Playlist Deletion**: Auto-delete archive playlist when last video is restored (if empty)
- **UI Placement**: Archive/Restore buttons in video list, video cards, and video player
- **Bulk Operations**: Support multi-select archive/restore with checkboxes
- **Archive Visibility**: Hide archive playlists by default with toggle to show/hide
- **Privacy Settings**: Archive playlists inherit original playlist's privacy settings
- **Data Preservation**: All video data (tags, notes, segments) preserved when archiving

## Key Design Decisions
1. **Original Playlist Derivation**: Parse from archive playlist name (no metadata storage needed)
   - "zzReels Archive" → "Reels"
   - "zzDrills Archive" → "Drills"

2. **Double-Archive Prevention**: Archive playlists only show Restore button (no Archive button)
   - Not possible to create "zzzzName Archive Archive"

3. **Missing Original Playlist Handling**: If original playlist deleted, show error modal with options:
   - Recreate original playlist (derived name)
   - Select different playlist manually

4. **Privacy Settings**: Inherit from original playlist (not always "unlisted")
   - Note: Current implementation creates all playlists as "private" - needs fix (see Phase 7)

## Implementation Phases

### Phase 1: Utility Functions ✅ DONE
**File**: `src/utils/archiveHelpers.js`

Implemented four helper functions:
- `getArchivePlaylistName(playlistTitle)` — e.g. "Reels" → "zzReels Archive"
- `getOriginalPlaylistName(archivePlaylistTitle)` — e.g. "zzReels Archive" → "Reels"
- `isArchivePlaylist(playlistTitle)` — validates `/^zz.+ Archive$/` pattern
- `findPlaylistByTitle(title, playlists)` — case-insensitive playlist lookup

---

### Phase 2 + Phase 4: Archive/Restore Operations ✅ DONE
**File**: `src/components/videolist/hooks/useVideoOperations.js`

**Architecture note**: The plan originally placed archive/restore logic in YouTubeContext (Phase 2) then wrapped it in useVideoOperations (Phase 4). During implementation, these were combined into `useVideoOperations.js` to follow the existing pattern — all video operations (move, copy, delete, archive, restore) live in the same hook with direct Firestore + YouTube API access.

Changes made:
- Extended hook signature to accept `createPlaylist`, `deletePlaylist`, `targetPlaylists`, and `user` parameters
- Added `handleArchiveVideos(videoIds, setError)` — derives archive playlist name, auto-creates if missing (inherits privacy settings), moves videos via YouTube API, updates Firestore docs and videoCounts
- Added `handleRestoreVideos(videoIds, setError)` — derives original playlist name, moves videos back, updates counts, auto-deletes empty archive playlist from both YouTube and Firestore
- Returns `{ success, error, originalPlaylistName }` from restore for `MISSING_ORIGINAL` handling in UI
- Added `archiving`, `restoring`, `isCurrentPlaylistArchive` state values
- Updated call site in `VideoList.jsx` to pass new parameters and destructure new exports

**Implementation notes**:
- Uses `increment()` for videoCount updates (avoids race conditions)
- `getAllPlaylists()` helper merges current playlist + targetPlaylists for archive/original lookups
- Restore returns structured result `{ success, error, originalPlaylistName }` instead of throwing (cleaner UI integration)
- Auto-deletes archive playlist when `videoCount <= 0` after restore

---

### Phase 3: Playlists View Updates ✅ DONE
**Files**: `src/components/playlists/Playlists.jsx`, `src/components/playlists/SortablePlaylistItem.jsx`, `src/contexts/PreferencesContext.jsx`

Implemented show/hide archive playlists toggle with persistent preference and visual styling.

**What was done:**
- Added `showArchivePlaylists` to `DEFAULT_PREFERENCES` in PreferencesContext (default `false`)
- Added `showArchivePlaylists` state in Playlists.jsx synced with PreferencesContext (mirrors existing `showEmptyPlaylists` pattern)
- Combined filtering: `displayedPlaylists` filters by both empty and archive toggles
- "Archives (N)" checkbox toggle shown only when archive playlists exist (`archiveCount > 0`)
- `isArchive` prop passed to `SortablePlaylistItem`
- Archive playlists render at 60% opacity with a yellow "ARCHIVE" badge next to the title

---

### Phase 4: _(Merged into Phase 2 above)_

---

### Phase 5: Video List Bulk Archive UI ✅ DONE
**Files**: `src/components/videolist/VideoList.jsx`, `src/components/videolist/VideoListHeader.jsx`

Added bulk archive/restore buttons to the video list header alongside existing Move/Copy buttons.

**What was done:**
- `VideoListHeader` accepts new props: `isCurrentPlaylistArchive`, `archiving`, `restoring`, `onArchive`, `onRestore`
- When in selection mode with videos selected:
  - Non-archive playlists show orange **Archive (N)** button (disabled + "Archiving..." while operating)
  - Archive playlists show amber **Restore (N)** button (disabled + "Restoring..." while operating)
- `VideoList.jsx` adds `onBulkArchive` and `onBulkRestore` handlers that call `handleArchiveVideos`/`handleRestoreVideos`, clear selection, and exit selection mode on success
- Restore handler reads `result.success` from the structured return value (ready for Phase 8 `MISSING_ORIGINAL` error modal integration)

---

### Phase 6: Video Card Archive/Restore Buttons ✅ DONE
**Files**: `src/components/videolist/SortableVideoCard.jsx`, `src/components/videolist/VideoCard.jsx`, `src/components/videolist/VideoList.jsx`

Added per-video Archive/Restore buttons to individual video cards.

**What was done:**
- Both `SortableVideoCard` and `VideoCard` accept new props: `onArchive`, `onRestore`, `isCurrentPlaylistArchive`
- When not in selection mode, action buttons are grouped in a vertical column (flex-col):
  - Non-archive playlists: orange **Archive** button (inbox/archive box SVG icon)
  - Archive playlists: amber **Restore** button (arrow-up SVG icon)
  - Red **Delete** button (existing, always shown)
- Buttons use `e.stopPropagation()` and `data-action` to prevent card click-through
- `VideoList.jsx` passes `isCurrentPlaylistArchive`, `onArchive` (calls `handleArchiveVideos([video.id])`), and `onRestore` (calls `handleRestoreVideos([video.id])`) to each `SortableVideoCard`

---

### Phase 7: Video Player Archive/Restore Button ✅ DONE
**Files**: `src/components/videoplayer/VideoPlayer.jsx`, `src/components/videoplayer/LandscapeControls.jsx`, `src/components/videoplayer/PortraitControls.jsx`, `src/components/videolist/VideoList.jsx`

Added Archive/Restore buttons to the video player in both landscape and portrait layouts.

**What was done:**
- `VideoPlayer` accepts new props: `isCurrentPlaylistArchive`, `onArchive`, `onRestore` — passes them through to both control components
- `VideoList.jsx` passes archive/restore handlers when rendering `VideoPlayer` — on success, navigates back to video list (`setSelectedVideo(null)`)
- `LandscapeControls`: Archive/Restore button added in the control bar between the segments selector and the spacer (before Set Start/Set End)
- `PortraitControls` mobile: Full-width Archive/Restore button below the speed options
- `PortraitControls` desktop: Archive/Restore button below the speed controls row
- Archive button: orange (`bg-orange-600`), Restore button: amber (`bg-amber-600`)
- Buttons only render when callbacks are provided (`onArchive && ...`)

---

### Phase 8: Restore Error Modal ✅ DONE
**Files**: `src/components/videolist/RestoreErrorModal.jsx` (new), `src/components/videolist/VideoList.jsx`

Created a modal component for handling the case when the original playlist doesn't exist during a restore operation, and wired it into all restore paths.

**What was done:**
- Created `RestoreErrorModal.jsx` with three options: Recreate playlist, Select different playlist, Cancel
- Props: `isOpen, onClose, originalPlaylistName, videoIds, onRecreate, onSelectDifferent`
- "Recreate" button has loading state (`isCreating`) and calls `onRecreate(originalPlaylistName, videoIds)`
- Styled to match existing modal pattern (fixed overlay, bg-gray-800, rounded-lg, touch-manipulation)
- Added `restoreErrorData` state in VideoList.jsx: `{ isOpen, originalPlaylistName, videoIds }`
- Updated **bulk restore** handler: checks `result.error === 'MISSING_ORIGINAL'` → opens modal with selected video IDs
- Updated **player restore** handler: checks `result.error === 'MISSING_ORIGINAL'` → opens modal with single video ID
- Updated **card restore** handler: checks `result.error === 'MISSING_ORIGINAL'` → opens modal with single video ID
- Added `handleRecreateAndRestore`: creates playlist via YouTube API, saves to Firestore, retries `handleRestoreVideos`, clears selection on success
- Added `handleSelectDifferentPlaylist`: closes restore error modal, pre-selects the video IDs, opens the existing Move modal
- Added Firestore `setDoc` and `collection` imports for playlist recreation

---

### Phase 9: Privacy Settings Fix ✅ DONE
**Files**: `src/contexts/YouTubeContext.jsx`, `src/components/playlists/Playlists.jsx`

Changes made:
- `createPlaylist(title, description, privacyStatus)` — now accepts `privacyStatus` param (default `'unlisted'` instead of hardcoded `'private'`)
- `getPlaylists()` — now fetches `status` part from YouTube API (`part: 'snippet,contentDetails,status'`)
- `syncPlaylists` in Playlists.jsx — stores `privacyStatus` from YouTube response during sync
- `handleCreatePlaylist` in Playlists.jsx — stores `privacyStatus` from `result.status` when creating new playlists

---

### Phase 10: View Archive Button per Playlist ✅ DONE
**Files**: `src/components/playlists/Playlists.jsx`, `src/components/playlists/SortablePlaylistItem.jsx`

Added a "View Archive" button on each non-archive playlist that navigates directly to that playlist's archive. Only visible when the corresponding archive playlist exists.

**What was done:**
- Imported `getArchivePlaylistName` and `findPlaylistByTitle` in `Playlists.jsx` (alongside existing `isArchivePlaylist`)
- For each `SortablePlaylistItem`, compute `archivePlaylist` via `findPlaylistByTitle(getArchivePlaylistName(playlist.title), playlists)` — only for non-archive playlists
- Pass `archivePlaylist` prop (playlist object or `null`) and `onViewArchive` callback to `SortablePlaylistItem`
- `SortablePlaylistItem` accepts new props: `archivePlaylist`, `onViewArchive`
- When `archivePlaylist` is truthy, renders an amber archive box icon button (SVG) before the rename/delete buttons
- Button calls `onViewArchive(archivePlaylist)` → `setSelectedPlaylist(archivePl)` to navigate to the archive
- Not shown on archive playlists themselves (guarded by `!isArchivePlaylist(playlist.title)`)
- Styled with `text-amber-400 hover:text-amber-300` to match archive theme, touch-manipulation for mobile

---

## Testing Checklist

### Basic Archive Operations
- [ ] Archive single video from non-archive playlist
  - [ ] Video appears in "zz{Name} Archive" playlist in Firestore
  - [ ] Video appears in archive playlist in YouTube
  - [ ] Video removed from original playlist
  - [ ] VideoCounts updated correctly for both playlists

- [ ] Archive video when archive playlist doesn't exist
  - [ ] Archive playlist created with correct name
  - [ ] Archive playlist created with "zz" prefix
  - [ ] Archive playlist has same privacy settings as original
  - [ ] Video successfully moved to new archive playlist

- [ ] Bulk archive 3+ videos
  - [ ] All videos move to archive playlist
  - [ ] VideoCount updates correctly
  - [ ] Selection clears after operation
  - [ ] Success message displays

### Restore Operations
- [ ] Restore single video from archive
  - [ ] Video returns to original playlist (derived from archive name)
  - [ ] Video removed from archive playlist
  - [ ] VideoCounts updated correctly

- [ ] Restore all videos from archive playlist
  - [ ] All videos restored to original
  - [ ] Archive playlist deleted from YouTube
  - [ ] Archive playlist deleted from Firestore
  - [ ] Success message displays

- [ ] Restore when original playlist deleted
  - [ ] Error modal displays with correct original playlist name
  - [ ] "Recreate" option creates playlist and restores videos
  - [ ] "Select Different" option opens move modal
  - [ ] "Cancel" keeps videos in archive

- [ ] Bulk restore 3+ videos
  - [ ] All videos restore correctly
  - [ ] Archive playlist deleted if empty after operation

### UI/UX Testing
- [ ] Archive button visibility
  - [ ] Visible in non-archive playlists (video list, video card, video player)
  - [ ] Hidden in archive playlists
  
- [ ] Restore button visibility
  - [ ] Hidden in non-archive playlists
  - [ ] Visible in archive playlists (video list, video card, video player)

- [ ] Playlists view toggle
  - [ ] Archives hidden by default
  - [ ] "Show Archives" button displays count
  - [ ] Toggle shows/hides archive playlists
  - [ ] Archive playlists have muted/gray styling when visible

- [ ] Loading states
  - [ ] Archive button shows "Archiving..." during operation
  - [ ] Restore button shows "Restoring..." during operation
  - [ ] Buttons disabled during operations

### Data Preservation
- [ ] Video tags preserved after archive
- [ ] Video notes preserved after archive
- [ ] Video segments (subcollection) preserved after archive
- [ ] All data intact after restore

### Edge Cases
- [ ] Playlist names with special characters (e.g., "Reels & Drills")
- [ ] Playlist names already containing "Archive" (e.g., "Archive Dances" → "zzArchive Dances Archive")
- [ ] Very long playlist names (YouTube has 150 character limit)
- [ ] Archiving same video multiple times (should fail - video already in archive)
- [ ] Network errors during archive/restore operations
- [ ] Multiple users archiving same video simultaneously

### YouTube Integration
- [ ] Archive playlists appear at bottom of YouTube playlist list (due to "zz" prefix)
- [ ] Privacy settings correctly inherited (test with public, unlisted, private playlists)
- [ ] Videos playable in app after archiving (verify privacy settings correct)
- [ ] Sync operation handles archive playlists correctly

### Performance
- [ ] Bulk archive 10+ videos completes without timeout
- [ ] Bulk restore 10+ videos completes without timeout
- [ ] UI remains responsive during operations
- [ ] Real-time listeners update UI correctly after operations

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **No double-archive prevention at API level**: Only prevented via UI (no Archive button in archive playlists)
2. **Archive detection by name only**: If user manually renames playlist to remove "zz" prefix, it will no longer be detected as archive
3. **No archive history**: Can't track how many times a video has been archived/restored
4. **Single original playlist**: Can't restore to multiple playlists if video was in multiple before archiving

### Potential Future Enhancements
1. **Archive metadata**: Store `isArchive: true` and `originalPlaylistId` in Firestore for more robust tracking
2. **Archive activity log**: Track archive/restore operations in Firestore for audit trail
3. **Bulk create archives**: "Archive All" button to create archive playlists for all playlists at once
4. **Archive search/filter**: Ability to search within archive playlists
5. **Archive expiration**: Auto-delete archives older than X days/months
6. **Undo functionality**: Temporary "Undo Archive" option after archiving
7. **Keyboard shortcuts**: Hotkeys for archive/restore operations
8. **Archive statistics**: Show count of archived videos per playlist

---

## File Summary

### New Files
1. `src/utils/archiveHelpers.js` - Archive name manipulation utilities
2. `src/components/videolist/RestoreErrorModal.jsx` - Error handling for missing original playlists

### Modified Files
1. `src/contexts/YouTubeContext.jsx` - Update createPlaylist() privacy parameter, getPlaylists() fetches status
3. `src/components/playlists/Playlists.jsx` - Add show/hide archives toggle, store privacyStatus during sync/create, pass archivePlaylist prop
4. `src/components/videolist/hooks/useVideoOperations.js` - Add handleArchiveVideos(), handleRestoreVideos(), archiving/restoring states
5. `src/components/videolist/VideoList.jsx` - Pass new params to useVideoOperations, add bulk archive/restore UI and handlers, RestoreErrorModal integration
6. `src/components/videolist/VideoCard.jsx` - Add Archive/Restore button per video
7. `src/components/playlists/SortablePlaylistItem.jsx` - Add ARCHIVE badge, opacity styling, View Archive button
8. `src/components/videoplayer/VideoPlayer.jsx` - Add Archive/Restore button to video player
7. `src/components/videoplayer/LandscapeControls.jsx` - Add Archive/Restore button UI
8. `src/components/videoplayer/PortraitControls.jsx` - Add Archive/Restore button UI

### Firestore Schema Changes
Add `privacyStatus` field to playlist documents:
```javascript
{
  // ... existing fields
  privacyStatus: 'public' | 'unlisted' | 'private',
}
```

---

## Implementation Order

1. **Phase 1**: Utility functions (no dependencies) ✅ DONE
2. **Phase 9**: Privacy settings fix (needed for Phase 2) ✅ DONE
3. **Phase 2 + 4**: Archive/restore operations in useVideoOperations (depends on Phase 1, 9) ✅ DONE
4. **Phase 3**: Playlists view toggle (depends on Phase 1) ✅ DONE
5. **Phase 5**: Video list bulk UI (depends on Phase 2+4) ✅ DONE
6. **Phase 6**: Video card buttons (depends on Phase 2+4) ✅ DONE
7. **Phase 7**: Video player buttons (depends on Phase 2+4) ✅ DONE
8. **Phase 8**: Restore error modal (depends on Phase 2+4) ✅ DONE
9. **Phase 10**: View Archive button per playlist (depends on Phase 1, 3) ✅ DONE

**Estimated total implementation time**: 8-12 hours

---

## Additional Considerations

### Security & Permissions
- All operations require valid YouTube OAuth token
- Firestore security rules should validate userId on all operations
- YouTube API quota considerations: Each archive/restore uses multiple API calls (delete + add)

### Error Handling Patterns
- Network errors: Retry logic with exponential backoff
- API errors: Check for 401/403 and trigger re-authentication
- Partial failures: If archiving 10 videos and 1 fails, what happens? (Current: all-or-nothing with batch)

### Mobile Responsiveness
- Ensure Archive/Restore buttons are touch-friendly (adequate size/spacing)
- Consider swipe gestures for archive/restore on mobile
- Verify modal works well on small screens

### Accessibility
- Add ARIA labels to Archive/Restore buttons
- Ensure modals are keyboard-navigable (Tab, Escape)
- Add screen reader announcements for success/error messages

---

**Document Version**: 1.0  
**Created**: March 22, 2026  
**Last Updated**: March 22, 2026
