import { useState, useEffect } from 'react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import VideoPlayer from '../videoplayer/VideoPlayer';
import VideoListHeader from './VideoListHeader';
import TagFilter from './TagFilter';
import SortableVideoCard from './SortableVideoCard';
import MoveVideoModal from './MoveVideoModal';
import CopyVideoModal from './CopyVideoModal';
import DeleteVideoModal from './DeleteVideoModal';
import PlaylistOrderErrorModal from './PlaylistOrderErrorModal';
import RestoreErrorModal from './RestoreErrorModal';
import Snackbar from './Snackbar';
import { useVideoData } from './hooks/useVideoData';
import { useVideoOperations } from './hooks/useVideoOperations';
import { useTagFiltering } from './hooks/useTagFiltering';

function VideoList({ playlist, onBack, onRestoreComplete }) {
  const { user } = useAuth();
  const { getPlaylistVideos, deleteVideoFromPlaylist, addVideoToPlaylist, updateVideoPosition, createPlaylist, deletePlaylist, getPlaylists } = useYouTube();
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Selected video state
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  
  // Modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPlaylistOrderErrorModal, setShowPlaylistOrderErrorModal] = useState(false);
  const [restoreErrorData, setRestoreErrorData] = useState({ isOpen: false, originalPlaylistName: '', videoIds: [] });
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [selectedTargetPlaylist, setSelectedTargetPlaylist] = useState(null);
  const [selectedCopyPlaylists, setSelectedCopyPlaylists] = useState([]);

  // Custom hooks
  const {
    videos,
    setVideos,
    loading,
    error,
    setError,
    allTags,
    targetPlaylists,
    loadVideos,
  } = useVideoData(playlist, user, getPlaylistVideos);

  const {
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
    isCurrentPlaylistArchive,
  } = useVideoOperations(
    playlist,
    videos,
    setVideos,
    selectedVideo,
    setSelectedVideo,
    loadVideos,
    deleteVideoFromPlaylist,
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    targetPlaylists,
    user,
    getPlaylists
  );

  const {
    selectedTags,
    showUntaggedOnly,
    filterMode,
    toggleTag,
    toggleUntagged,
    toggleFilterMode,
    clearFilters,
    filteredVideos,
  } = useTagFiltering(videos);

  // State for reordering
  const [isReordering, setIsReordering] = useState(false);

  // Handle video drag and drop reorder
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);

    // Optimistically update local state
    const newVideos = arrayMove(videos, oldIndex, newIndex);
    const updatedVideos = newVideos.map((video, index) => ({
      ...video,
      position: index,
    }));
    setVideos(updatedVideos);

    // Update YouTube and Firestore
    setIsReordering(true);
    try {
      const movedVideo = videos[oldIndex];
      
      // Check if playlistItemId exists
      if (!movedVideo.playlistItemId) {
        throw new Error('Video missing playlistItemId. Please refresh the page to sync data from YouTube.');
      }
      
      // Update video position on YouTube
      await updateVideoPosition(
        movedVideo.playlistItemId,
        playlist.youtubeId,
        movedVideo.youtubeId,
        newIndex
      );

      // Update positions in Firestore for all affected videos
      for (const video of updatedVideos) {
        const videoRef = doc(db, 'videos', video.id);
        await updateDoc(videoRef, { position: video.position });
      }

      setSnackbar({ message: 'Video order updated', type: 'success', isOpen: true });
    } catch (err) {
      console.error('Error reordering video:', err);
      
      // Check if error is about playlist not being set to Manual order
      const errorMessage = err.message.toLowerCase();
      if (errorMessage.includes('manual') || errorMessage.includes('order') || errorMessage.includes('playlist order')) {
        setShowPlaylistOrderErrorModal(true);
      } else {
        setSnackbar({ message: `Failed to reorder: ${err.message}`, type: 'error', isOpen: true });
      }
      
      // Revert on error
      loadVideos();
    } finally {
      setIsReordering(false);
    }
  };

  const toggleVideoSelection = (videoId) => {
    if (selectedVideos.includes(videoId)) {
      setSelectedVideos(selectedVideos.filter(id => id !== videoId));
    } else {
      setSelectedVideos([...selectedVideos, videoId]);
    }
  };

  const toggleCopyPlaylistSelection = (playlistId) => {
    if (selectedCopyPlaylists.includes(playlistId)) {
      setSelectedCopyPlaylists(selectedCopyPlaylists.filter(id => id !== playlistId));
    } else {
      setSelectedCopyPlaylists([...selectedCopyPlaylists, playlistId]);
    }
  };

  const onConfirmRemoveVideo = async () => {
    const success = await handleRemoveVideo(videoToDelete, setError);
    if (success) {
      setShowDeleteModal(false);
      setVideoToDelete(null);
    }
  };

  const onConfirmMoveVideos = async () => {
    const success = await handleMoveVideos(selectedVideos, selectedTargetPlaylist, setError);
    if (success) {
      setSelectedVideos([]);
      setShowMoveModal(false);
      setSelectedTargetPlaylist(null);
      setIsSelectionMode(false);
    }
  };

  const onConfirmCopyVideos = async () => {
    const success = await handleCopyVideos(selectedVideos, selectedCopyPlaylists, setError);
    if (success) {
      setSelectedVideos([]);
      setShowCopyModal(false);
      setIsSelectionMode(false);
      setSelectedCopyPlaylists([]);
    }
  };

  const onBulkArchive = async () => {
    const success = await handleArchiveVideos(selectedVideos, setError);
    if (success) {
      setSelectedVideos([]);
      setIsSelectionMode(false);
    }
  };

  const onBulkRestore = async () => {
    const result = await handleRestoreVideos(selectedVideos, setError);
    if (result.success) {
      setSelectedVideos([]);
      setIsSelectionMode(false);
      // Navigate back if archive playlist was deleted
      if (result.playlistDeleted && onRestoreComplete) {
        const count = selectedVideos.length;
        onRestoreComplete(`Successfully restored ${count} video${count !== 1 ? 's' : ''}`);
      }
    } else if (result.error === 'MISSING_ORIGINAL') {
      setRestoreErrorData({
        isOpen: true,
        originalPlaylistName: result.originalPlaylistName,
        videoIds: [...selectedVideos],
      });
    }
  };

  const handleRecreateAndRestore = async (playlistName, videoIds) => {
    try {
      const result = await createPlaylist(playlistName);

      const playlistData = {
        id: result.id,
        userId: user.uid,
        youtubeId: result.id,
        title: result.snippet.title,
        description: result.snippet.description || '',
        thumbnail: '',
        videoCount: 0,
        privacyStatus: result.status?.privacyStatus || 'unlisted',
        lastSynced: new Date(),
        order: (targetPlaylists?.length || 0) + 1,
      };
      await setDoc(doc(collection(db, 'playlists'), result.id), playlistData);

      const retryResult = await handleRestoreVideos(videoIds, setError);
      if (retryResult.success) {
        setRestoreErrorData({ isOpen: false, originalPlaylistName: '', videoIds: [] });
        setSelectedVideos([]);
        setIsSelectionMode(false);
        // Navigate back if archive playlist was deleted
        if (retryResult.playlistDeleted && onRestoreComplete) {
          const count = videoIds.length;
          onRestoreComplete(`Successfully restored ${count} video${count !== 1 ? 's' : ''}`);
        }
      }
    } catch (err) {
      console.error('Error recreating playlist:', err);
      setError('Failed to recreate playlist. Please try again.');
    }
  };

  const handleSelectDifferentPlaylist = (videoIds) => {
    setRestoreErrorData({ isOpen: false, originalPlaylistName: '', videoIds: [] });
    setSelectedVideos(videoIds);
    setShowMoveModal(true);
  };

  if (loading) {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-gray-900 pb-4">
          <button
            onClick={onBack}
            className="pt-4 mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Playlists
          </button>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-400">Loading videos...</div>
        </div>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <VideoPlayer
        video={selectedVideo}
        onBack={() => setSelectedVideo(null)}
        isCurrentPlaylistArchive={isCurrentPlaylistArchive}
        onArchive={async () => {
          const success = await handleArchiveVideos([selectedVideo.id], setError);
          if (success) setSelectedVideo(null);
        }}
        onRestore={async () => {
          const result = await handleRestoreVideos([selectedVideo.id], setError);
          if (result.success) {
            setSelectedVideo(null);
            // Navigate back if archive playlist was deleted
            if (result.playlistDeleted && onRestoreComplete) {
              onRestoreComplete('Successfully restored 1 video');
            }
          } else if (result.error === 'MISSING_ORIGINAL') {
            setRestoreErrorData({
              isOpen: true,
              originalPlaylistName: result.originalPlaylistName,
              videoIds: [selectedVideo.id],
            });
          }
        }}
      />
    );
  }

  return (
    <div>
      <MoveVideoModal
        isOpen={showMoveModal}
        selectedCount={selectedVideos.length}
        playlists={targetPlaylists}
        selectedPlaylist={selectedTargetPlaylist}
        onSelectPlaylist={setSelectedTargetPlaylist}
        onMove={onConfirmMoveVideos}
        onCancel={() => {
          setShowMoveModal(false);
          setSelectedTargetPlaylist(null);
        }}
        isOperating={operating}
      />

      <CopyVideoModal
        isOpen={showCopyModal}
        selectedCount={selectedVideos.length}
        playlists={targetPlaylists}
        selectedPlaylists={selectedCopyPlaylists}
        onTogglePlaylist={toggleCopyPlaylistSelection}
        onCopy={onConfirmCopyVideos}
        onCancel={() => {
          setShowCopyModal(false);
          setSelectedCopyPlaylists([]);
        }}
        isOperating={operating}
      />

      <DeleteVideoModal
        isOpen={showDeleteModal}
        videoTitle={videoToDelete?.title || ''}
        onConfirm={onConfirmRemoveVideo}
        onCancel={() => {
          setShowDeleteModal(false);
          setVideoToDelete(null);
        }}
        isDeleting={operating}
      />

      <PlaylistOrderErrorModal
        isOpen={showPlaylistOrderErrorModal}
        onClose={() => setShowPlaylistOrderErrorModal(false)}
      />

      <RestoreErrorModal
        isOpen={restoreErrorData.isOpen}
        onClose={() => setRestoreErrorData({ isOpen: false, originalPlaylistName: '', videoIds: [] })}
        originalPlaylistName={restoreErrorData.originalPlaylistName}
        videoIds={restoreErrorData.videoIds}
        onRecreate={handleRecreateAndRestore}
        onSelectDifferent={handleSelectDifferentPlaylist}
      />

      <div className="sticky top-0 z-50 bg-gray-900 pb-4">
        <button
          onClick={onBack}
          className="pt-4 mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Playlists
        </button>

        <VideoListHeader
          playlistTitle={playlist.title}
          videoCount={videos.length}
          selectedCount={selectedVideos.length}
          isSelectionMode={isSelectionMode}
          onStartSelection={() => setIsSelectionMode(true)}
          onShowMove={() => setShowMoveModal(true)}
          onShowCopy={() => setShowCopyModal(true)}
          onArchive={onBulkArchive}
          onRestore={onBulkRestore}
          isCurrentPlaylistArchive={isCurrentPlaylistArchive}
          archiving={archiving}
          restoring={restoring}
          onCancel={() => {
            setIsSelectionMode(false);
            setSelectedVideos([]);
          }}
        />
      </div>

      <TagFilter
        allTags={allTags}
        selectedTags={selectedTags}
        showUntaggedOnly={showUntaggedOnly}
        filterMode={filterMode}
        filteredCount={filteredVideos.length}
        totalCount={videos.length}
        onToggleTag={toggleTag}
        onToggleUntagged={toggleUntagged}
        onToggleFilterMode={toggleFilterMode}
        onClearFilters={clearFilters}
        videos={videos}
      />

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400">
            {videos.length === 0 
              ? 'No videos in this playlist.'
              : 'No videos match the selected filters.'}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredVideos.map(v => v.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={`space-y-3 ${isReordering ? 'opacity-50 pointer-events-none' : ''}`}>
              {filteredVideos.map((video) => (
                <SortableVideoCard
                  key={video.id}
                  video={video}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedVideos.includes(video.id)}
                  onToggleSelection={toggleVideoSelection}
                  onClick={setSelectedVideo}
                  onRemove={(video) => {
                    setVideoToDelete(video);
                    setShowDeleteModal(true);
                  }}
                  isCurrentPlaylistArchive={isCurrentPlaylistArchive}
                  onArchive={async (video) => {
                    await handleArchiveVideos([video.id], setError);
                  }}
                  onRestore={async (video) => {
                    const result = await handleRestoreVideos([video.id], setError);
                    if (result.success && result.playlistDeleted) {
                      // Navigate back and show success message
                      if (onRestoreComplete) {
                        onRestoreComplete('Successfully restored 1 video(s).');
                      }
                      onBack();
                    } else if (result.error === 'MISSING_ORIGINAL') {
                      setRestoreErrorData({
                        isOpen: true,
                        originalPlaylistName: result.originalPlaylistName,
                        videoIds: [video.id],
                      });
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </div>
  );
}

export default VideoList;
