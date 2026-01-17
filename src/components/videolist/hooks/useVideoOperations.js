import { useState } from 'react';
import { db } from '../../../firebase/config';
import { doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';

export function useVideoOperations(
  playlist,
  videos,
  setVideos,
  selectedVideo,
  setSelectedVideo,
  loadVideos,
  deleteVideoFromPlaylist,
  addVideoToPlaylist
) {
  const [operating, setOperating] = useState(false);
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

  return {
    operating,
    snackbar,
    setSnackbar,
    handleRemoveVideo,
    handleMoveVideos,
    handleCopyVideos,
  };
}
