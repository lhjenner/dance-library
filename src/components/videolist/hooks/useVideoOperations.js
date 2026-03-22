import { useState } from 'react';
import { db } from '../../../firebase/config';
import { doc, setDoc, getDoc, deleteDoc, updateDoc, increment, collection } from 'firebase/firestore';
import { getArchivePlaylistName, getOriginalPlaylistName, isArchivePlaylist, findPlaylistByTitle } from '../../../utils/archiveHelpers';

export function useVideoOperations(
  playlist,
  videos,
  setVideos,
  selectedVideo,
  setSelectedVideo,
  loadVideos,
  deleteVideoFromPlaylist,
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylistOnYouTube,
  targetPlaylists,
  user
) {
  const [operating, setOperating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [snackbar, setSnackbar] = useState({ isOpen: false, message: '', type: 'success' });

  const handleRemoveVideo = async (videoToDelete, setError) => {
    if (!videoToDelete) return;

    try {
      setOperating(true);
      setError(null);

      if (videoToDelete.playlistItemId) {
        await deleteVideoFromPlaylist(videoToDelete.playlistItemId);
      }
      
      const videoRef = doc(db, 'videos', videoToDelete.id);
      await deleteDoc(videoRef);
      
      // Update video count
      const playlistRef = doc(db, 'playlists', playlist.id);
      await updateDoc(playlistRef, {
        videoCount: increment(-1)
      });
      
      setVideos(videos.filter(v => v.id !== videoToDelete.id));
      
      if (selectedVideo && selectedVideo.id === videoToDelete.id) {
        setSelectedVideo(null);
      }

      return true;
    } catch (err) {
      console.error('Error removing video:', err);
      setError('Failed to remove video. Please try again.');
      return false;
    } finally {
      setOperating(false);
    }
  };

  const handleMoveVideos = async (selectedVideos, selectedTargetPlaylist, setError) => {
    if (!selectedTargetPlaylist || selectedVideos.length === 0) return false;

    try {
      setOperating(true);
      setError(null);

      for (const videoId of selectedVideos) {
        const video = videos.find(v => v.id === videoId);
        
        await addVideoToPlaylist(selectedTargetPlaylist, videoId);
        
        if (video.playlistItemId) {
          await deleteVideoFromPlaylist(video.playlistItemId);
        }
        
        const videoRef = doc(db, 'videos', videoId);
        await deleteDoc(videoRef);
      }

      // Update video counts
      const sourcePlaylistRef = doc(db, 'playlists', playlist.id);
      await updateDoc(sourcePlaylistRef, {
        videoCount: increment(-selectedVideos.length)
      });

      const targetPlaylistRef = doc(db, 'playlists', selectedTargetPlaylist);
      await updateDoc(targetPlaylistRef, {
        videoCount: increment(selectedVideos.length)
      });

      await loadVideos();

      // Show success message
      const count = selectedVideos.length;
      setSnackbar({
        isOpen: true,
        message: `Successfully moved ${count} video${count !== 1 ? 's' : ''}`,
        type: 'success'
      });

      return true;
    } catch (err) {
      console.error('Error moving videos:', err);
      setError('Failed to move videos. Some videos may have been moved. Please try again.');
      setSnackbar({
        isOpen: true,
        message: 'Failed to move videos',
        type: 'error'
      });
      return false;
    } finally {
      setOperating(false);
    }
  };

  const handleCopyVideos = async (selectedVideos, selectedCopyPlaylists, setError) => {
    if (selectedCopyPlaylists.length === 0 || selectedVideos.length === 0) return false;

    try {
      setOperating(true);
      setError(null);

      for (const videoId of selectedVideos) {
        for (const targetPlaylistId of selectedCopyPlaylists) {
          await addVideoToPlaylist(targetPlaylistId, videoId);
        }
      }

      // Update video counts for all destination playlists
      for (const targetPlaylistId of selectedCopyPlaylists) {
        const targetPlaylistRef = doc(db, 'playlists', targetPlaylistId);
        await updateDoc(targetPlaylistRef, {
          videoCount: increment(selectedVideos.length)
        });
      }

      // Show success message
      const count = selectedVideos.length;
      const playlistCount = selectedCopyPlaylists.length;
      setSnackbar({
        isOpen: true,
        message: `Successfully copied ${count} video${count !== 1 ? 's' : ''} to ${playlistCount} playlist${playlistCount !== 1 ? 's' : ''}`,
        type: 'success'
      });

      return true;
    } catch (err) {
      console.error('Error copying videos:', err);
      setError('Failed to copy videos. Some videos may have been copied. Please try again.');
      setSnackbar({
        isOpen: true,
        message: 'Failed to copy videos',
        type: 'error'
      });
      return false;
    } finally {
      setOperating(false);
    }
  };

  // Build full playlists list (current + targets) for archive lookups
  const getAllPlaylists = () => [playlist, ...(targetPlaylists || [])];

  const handleArchiveVideos = async (videoIds, setError) => {
    if (!playlist || videoIds.length === 0) return false;

    try {
      setArchiving(true);
      setError(null);

      const allPlaylists = getAllPlaylists();
      const archivePlaylistName = getArchivePlaylistName(playlist.title);
      let archivePlaylist = findPlaylistByTitle(archivePlaylistName, allPlaylists);

      // Create archive playlist if it doesn't exist
      if (!archivePlaylist) {
        const privacyStatus = playlist.privacyStatus || 'unlisted';
        const result = await createPlaylist(archivePlaylistName, '', privacyStatus);

        const playlistData = {
          id: result.id,
          userId: user.uid,
          youtubeId: result.id,
          title: result.snippet.title,
          description: result.snippet.description || '',
          thumbnail: '',
          videoCount: 0,
          privacyStatus: result.status?.privacyStatus || privacyStatus,
          lastSynced: new Date(),
          order: allPlaylists.length,
        };
        await setDoc(doc(collection(db, 'playlists'), result.id), playlistData);
        archivePlaylist = playlistData;
      }

      // Move each video: remove from source on YouTube, add to archive on YouTube, update Firestore
      for (const videoId of videoIds) {
        const video = videos.find(v => v.id === videoId);
        if (!video) continue;

        try {
          if (video.playlistItemId) {
            try {
              await deleteVideoFromPlaylist(video.playlistItemId);
            } catch (deleteErr) {
              // If delete fails, video might already be removed from YouTube
              // Log the error but continue with archiving process
              console.warn(`Could not remove video "${video.title}" from source playlist (may already be removed):`, deleteErr);
            }
          }
          const addResult = await addVideoToPlaylist(archivePlaylist.id, video.youtubeId);

          const videoRef = doc(db, 'videos', videoId);
          await updateDoc(videoRef, {
            playlistId: archivePlaylist.id,
            playlistItemId: addResult.id,
            position: 0,
          });
        } catch (err) {
          console.error(`Error archiving video "${video.title}" (${videoId}):`, err);
          throw new Error(`Failed to archive "${video.title}": ${err.message}`);
        }
      }

      // Update video counts
      const sourceRef = doc(db, 'playlists', playlist.id);
      await updateDoc(sourceRef, { videoCount: increment(-videoIds.length) });

      const archiveRef = doc(db, 'playlists', archivePlaylist.id);
      await updateDoc(archiveRef, { videoCount: increment(videoIds.length) });

      await loadVideos();

      const count = videoIds.length;
      setSnackbar({
        isOpen: true,
        message: `Successfully archived ${count} video${count !== 1 ? 's' : ''}`,
        type: 'success',
      });
      return true;
    } catch (err) {
      console.error('Error archiving videos:', err);
      setError('Failed to archive videos. Please try again.');
      setSnackbar({ isOpen: true, message: 'Failed to archive videos', type: 'error' });
      return false;
    } finally {
      setArchiving(false);
    }
  };

  const handleRestoreVideos = async (videoIds, setError) => {
    if (!playlist || videoIds.length === 0) return { success: false, error: 'UNKNOWN' };

    try {
      setRestoring(true);
      setError(null);

      const allPlaylists = getAllPlaylists();
      const originalPlaylistName = getOriginalPlaylistName(playlist.title);
      const originalPlaylist = findPlaylistByTitle(originalPlaylistName, allPlaylists);

      if (!originalPlaylist) {
        return { success: false, error: 'MISSING_ORIGINAL', originalPlaylistName };
      }

      // Move each video back to original playlist
      for (const videoId of videoIds) {
        const video = videos.find(v => v.id === videoId);
        if (!video) continue;

        try {
          if (video.playlistItemId) {
            try {
              await deleteVideoFromPlaylist(video.playlistItemId);
            } catch (deleteErr) {
              // If delete fails, video might already be removed from YouTube
              // Log the error but continue with restore process
              console.warn(`Could not remove video "${video.title}" from archive playlist (may already be removed):`, deleteErr);
            }
          }
          const addResult = await addVideoToPlaylist(originalPlaylist.id, video.youtubeId);

          const videoRef = doc(db, 'videos', videoId);
          await updateDoc(videoRef, {
            playlistId: originalPlaylist.id,
            playlistItemId: addResult.id,
            position: 0,
          });
        } catch (err) {
          console.error(`Error restoring video "${video.title}" (${videoId}):`, err);
          throw new Error(`Failed to restore "${video.title}": ${err.message}`);
        }
      }

      // Update video counts
      const archiveRef = doc(db, 'playlists', playlist.id);
      await updateDoc(archiveRef, { videoCount: increment(-videoIds.length) });

      const originalRef = doc(db, 'playlists', originalPlaylist.id);
      await updateDoc(originalRef, { videoCount: increment(videoIds.length) });

      // Check if archive playlist is now empty — delete if so
      const archiveSnap = await getDoc(archiveRef);
      const remainingCount = archiveSnap.data()?.videoCount || 0;

      if (remainingCount <= 0) {
        await deletePlaylistOnYouTube(playlist.id);
        await deleteDoc(archiveRef);
      }

      await loadVideos();

      const count = videoIds.length;
      setSnackbar({
        isOpen: true,
        message: `Successfully restored ${count} video${count !== 1 ? 's' : ''}`,
        type: 'success',
      });
      return { success: true, error: null };
    } catch (err) {
      console.error('Error restoring videos:', err);
      setError('Failed to restore videos. Please try again.');
      setSnackbar({ isOpen: true, message: 'Failed to restore videos', type: 'error' });
      return { success: false, error: 'UNKNOWN' };
    } finally {
      setRestoring(false);
    }
  };

  return {
    operating,
    archiving,
    restoring,
    snackbar,
    setSnackbar,
    handleRemoveVideo,
    handleMoveVideos,
    handleCopyVideos,
    handleArchiveVideos,
    handleRestoreVideos,
    isCurrentPlaylistArchive: isArchivePlaylist(playlist?.title || ''),
  };
}
