/**
 * Converts a playlist name to its archive version.
 * e.g. "Reels" → "zzReels Archive"
 */
export function getArchivePlaylistName(playlistTitle) {
  return `zz${playlistTitle} Archive`;
}

/**
 * Extracts the original playlist name from an archive playlist.
 * e.g. "zzReels Archive" → "Reels"
 */
export function getOriginalPlaylistName(archivePlaylistTitle) {
  return archivePlaylistTitle.replace(/^zz/, '').replace(/ Archive$/, '');
}

/**
 * Checks if a playlist name matches the archive pattern (starts with "zz", ends with " Archive").
 */
export function isArchivePlaylist(playlistTitle) {
  return /^zz.+ Archive$/.test(playlistTitle);
}

/**
 * Gets the display name for a playlist, removing the "zz" prefix if it's an archive.
 * e.g. "zzReels Archive" → "Reels Archive"
 * e.g. "Regular Playlist" → "Regular Playlist"
 */
export function getDisplayPlaylistName(playlistTitle) {
  if (isArchivePlaylist(playlistTitle)) {
    return playlistTitle.replace(/^zz/, '');
  }
  return playlistTitle;
}

/**
 * Finds a playlist by title in the given array (case-insensitive).
 * Returns the playlist object or null.
 */
export function findPlaylistByTitle(title, playlists) {
  return playlists.find(p => p.title.toLowerCase() === title.toLowerCase()) || null;
}
