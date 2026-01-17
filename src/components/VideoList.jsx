import { useState, useEffect } from 'react';
import { useYouTube } from '../contexts/YouTubeContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import VideoPlayer from './VideoPlayer';

function VideoList({ playlist, onBack }) {
  const { user } = useAuth();
  const { getPlaylistVideos } = useYouTube();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    loadVideos();
  }, [playlist.id]);

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
      querySnapshot.forEach((doc) => {
        loadedVideos.push({ id: doc.id, ...doc.data() });
      });

      setVideos(loadedVideos);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
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

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400">No videos in this playlist.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="bg-gray-800 rounded-lg p-4 flex gap-4 hover:bg-gray-750 transition-colors cursor-pointer"
            >
              {video.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-40 h-24 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VideoList;
