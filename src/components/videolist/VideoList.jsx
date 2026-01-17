import { useState, useEffect } from 'react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayer from '../videoplayer/VideoPlayer';
import VideoListHeader from './VideoListHeader';
import TagFilter from './TagFilter';
import VideoCard from './VideoCard';
import MoveVideoModal from './MoveVideoModal';
import CopyVideoModal from './CopyVideoModal';
import DeleteVideoModal from './DeleteVideoModal';
import Snackbar from './Snackbar';
import { useVideoData } from './hooks/useVideoData';
import { useVideoOperations } from './hooks/useVideoOperations';
import { useTagFiltering } from './hooks/useTagFiltering';

function VideoList({ playlist, onBack }) {
  const { user } = useAuth();
  const { getPlaylistVideos, deleteVideoFromPlaylist, addVideoToPlaylist } = useYouTube();
  
  // Selected video state
  const [selectedVideo, setSelectedVideo] = useState(() => {
    if (user) {
      const stored = localStorage.getItem(`selected_video_${user.uid}`);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  
  // Modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    snackbar,
    setSnackbar,
    handleRemoveVideo,
    handleMoveVideos,
    handleCopyVideos,
  } = useVideoOperations(
    playlist,
    videos,
    setVideos,
    selectedVideo,
    setSelectedVideo,
    loadVideos,
    deleteVideoFromPlaylist,
    addVideoToPlaylist
  );

  const {
    selectedTags,
    showUntaggedOnly,
    toggleTag,
    toggleUntagged,
    filteredVideos,
  } = useTagFiltering(videos);

  // Persist selected video to localStorage

  // Persist selected video to localStorage
  useEffect(() => {
    if (user) {
      if (selectedVideo) {
        localStorage.setItem(`selected_video_${user.uid}`, JSON.stringify(selectedVideo));
      } else {
        localStorage.removeItem(`selected_video_${user.uid}`);
      }
    }
  }, [selectedVideo, user]);

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

  if (loading) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Playlists
        </button>
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

      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
        onCancel={() => {
          setIsSelectionMode(false);
          setSelectedVideos([]);
        }}
      />

      <TagFilter
        allTags={allTags}
        selectedTags={selectedTags}
        showUntaggedOnly={showUntaggedOnly}
        filteredCount={filteredVideos.length}
        totalCount={videos.length}
        onToggleTag={toggleTag}
        onToggleUntagged={toggleUntagged}
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
        <div className="space-y-3">
          {filteredVideos.map((video) => (
            <VideoCard
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
            />
          ))}
        </div>
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
