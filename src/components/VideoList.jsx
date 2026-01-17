import { useState, useEffect } from 'react';
import { useYouTube } from '../contexts/YouTubeContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import VideoPlayer from './videoplayer';

function VideoList({ playlist, onBack }) {
  const { user } = useAuth();
  const { getPlaylistVideos, deleteVideoFromPlaylist } = useYouTube();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(() => {
    // Restore selected video from localStorage
    if (user) {
      const stored = localStorage.getItem(`selected_video_${user.uid}`);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [showUntaggedOnly, setShowUntaggedOnly] = useState(false);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    loadVideos();
  }, [playlist.id]);

  // Save selected video to localStorage
  useEffect(() => {
    if (user) {
      if (selectedVideo) {
        localStorage.setItem(`selected_video_${user.uid}`, JSON.stringify(selectedVideo));
      } else {
        localStorage.removeItem(`selected_video_${user.uid}`);
      }
    }
  }, [selectedVideo, user]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch videos from YouTube
      const youtubeVideos = await getPlaylistVideos(playlist.youtubeId);

      // Save to Firestore
      const videosRef = collection(db, 'videos');
      
      for (let i = 0; i < youtubeVideos.length; i++) {
        const video = youtubeVideos[i];
        const videoData = {
          id: video.snippet.resourceId.videoId,
          userId: user.uid,
          youtubeId: video.snippet.resourceId.videoId,
          playlistId: playlist.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.medium?.url || '',
          publishedAt: new Date(video.snippet.publishedAt),
          addedToPlaylist: new Date(video.snippet.publishedAt),
          tags: [],
          segments: [],
          notes: '',
        };
        
        await setDoc(doc(videosRef, video.snippet.resourceId.videoId), videoData, { merge: true });
      }

      // Load from Firestore
      const q = query(
        videosRef,
        where('userId', '==', user.uid),
        where('playlistId', '==', playlist.id)
      );
      const querySnapshot = await getDocs(q);
      
      const loadedVideos = [];
      
      // Load videos and their segments
      for (const videoDoc of querySnapshot.docs) {
        const videoData = { id: videoDoc.id, ...videoDoc.data() };
        
        // Load segments for this video
        const segmentsRef = collection(videoDoc.ref, 'segments');
        const segmentsSnapshot = await getDocs(segmentsRef);
        
        const segmentTags = [];
        segmentsSnapshot.forEach((segDoc) => {
          const segData = segDoc.data();
          if (segData.tags) {
            segmentTags.push(...segData.tags);
          }
        });
        
        // Combine video tags and segment tags
        videoData.allTags = [
          ...(videoData.tags || []),
          ...segmentTags
        ];
        
        loadedVideos.push(videoData);
      }

      setVideos(loadedVideos);

      // Extract all unique tags from videos (including segment tags)
      const tagsSet = new Set();
      loadedVideos.forEach(video => {
        if (video.allTags) {
          video.allTags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet).sort());
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveVideo = async (video) => {
    if (!confirm(`Remove "${video.title}" from this playlist?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Remove from YouTube
      await deleteVideoFromPlaylist(playlist.youtubeId, video.id);
      
      // Remove from Firestore
      const videoRef = doc(db, 'videos', video.id);
      await deleteDoc(videoRef);
      
      // Update local state
      setVideos(videos.filter(v => v.id !== video.id));
      
      // If this was the selected video, deselect it
      if (selectedVideo && selectedVideo.id === video.id) {
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error('Error removing video:', err);
      setError('Failed to remove video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    // Filter by untagged (only checking video-level tags, not segment tags)
    if (showUntaggedOnly) {
      return !video.tags || video.tags.length === 0;
    }
    
    // Filter by selected tags (check both video and segment tags)
    if (selectedTags.length > 0) {
      if (!video.allTags || video.allTags.length === 0) return false;
      return selectedTags.some(tag => video.allTags.includes(tag));
    }
    
    return true;
  });

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

  // If a video is selected, show the video player
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
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Playlists
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">{playlist.title}</h2>
        <p className="text-gray-400 mt-2">{videos.length} videos</p>
      </div>

      {/* Filters */}
      {(allTags.length > 0 || videos.some(v => !v.tags || v.tags.length === 0)) && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">Filter by Tags</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => {
                setShowUntaggedOnly(!showUntaggedOnly);
                setSelectedTags([]);
              }}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                showUntaggedOnly
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Untagged Only
            </button>
            
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  toggleTag(tag);
                  setShowUntaggedOnly(false);
                }}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {(selectedTags.length > 0 || showUntaggedOnly) && (
            <div className="text-sm text-gray-400">
              Showing {filteredVideos.length} of {videos.length} videos
              {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
              {showUntaggedOnly && ' without tags'}
            </div>
          )}
        </div>
      )}

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
            <div
              key={video.id}
              className="bg-gray-800 rounded-lg p-4 flex gap-4 hover:bg-gray-750 transition-colors"
            >
              {video.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-40 h-24 object-cover rounded flex-shrink-0 cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                />
              )}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedVideo(video)}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg">{video.title}</h3>
                  {(!video.allTags || video.allTags.length === 0) && (
                    <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                      No tags
                    </span>
                  )}
                </div>
                {video.allTags && video.allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[...new Set(video.allTags)].map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveVideo(video);
                }}
                className="text-red-400 hover:text-red-300 p-2 flex-shrink-0"
                title="Remove from playlist"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VideoList;
