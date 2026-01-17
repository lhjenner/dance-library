import { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

export function useVideoData(playlist, user, getPlaylistVideos) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [targetPlaylists, setTargetPlaylists] = useState([]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const youtubeVideos = await getPlaylistVideos(playlist.youtubeId);
      const videosRef = collection(db, 'videos');
      
      for (let i = 0; i < youtubeVideos.length; i++) {
        const video = youtubeVideos[i];
        const videoData = {
          id: video.snippet.resourceId.videoId,
          userId: user.uid,
          youtubeId: video.snippet.resourceId.videoId,
          playlistId: playlist.id,
          playlistItemId: video.id,
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

      const q = query(videosRef, where('userId', '==', user.uid), where('playlistId', '==', playlist.id));
      const querySnapshot = await getDocs(q);
      
      const loadedVideos = [];
      for (const videoDoc of querySnapshot.docs) {
        const videoData = { id: videoDoc.id, ...videoDoc.data() };
        
        const segmentsRef = collection(videoDoc.ref, 'segments');
        const segmentsSnapshot = await getDocs(segmentsRef);
        
        const segmentTags = [];
        segmentsSnapshot.forEach((segDoc) => {
          const segData = segDoc.data();
          if (segData.tags) {
            segmentTags.push(...segData.tags);
          }
        });
        
        videoData.allTags = [...(videoData.tags || []), ...segmentTags];
        loadedVideos.push(videoData);
      }

      setVideos(loadedVideos);

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

  const loadAllPlaylists = async () => {
    try {
      const playlistsRef = collection(db, 'playlists');
      const q = query(playlistsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const loadedPlaylists = [];
      querySnapshot.forEach((doc) => {
        const playlistData = { id: doc.id, ...doc.data() };
        if (playlistData.id !== playlist.id) {
          loadedPlaylists.push(playlistData);
        }
      });
      
      loadedPlaylists.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTargetPlaylists(loadedPlaylists);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  useEffect(() => {
    loadVideos();
    loadAllPlaylists();
  }, [playlist.id]);

  return {
    videos,
    setVideos,
    loading,
    error,
    setError,
    allTags,
    targetPlaylists,
    loadVideos,
  };
}
