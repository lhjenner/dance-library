import { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, doc, writeBatch, getDocs, onSnapshot, query, where, collectionGroup } from 'firebase/firestore';

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
      
      // Use batched writes for better performance
      const batch = writeBatch(db);
      const videosRef = collection(db, 'videos');
      
      youtubeVideos.forEach((video) => {
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
        
        batch.set(doc(videosRef, video.snippet.resourceId.videoId), videoData, { merge: true });
      });
      
      // Commit all video writes at once
      await batch.commit();

      const q = query(videosRef, where('userId', '==', user.uid), where('playlistId', '==', playlist.id));
      const querySnapshot = await getDocs(q);
      
      // Get all video IDs for segment query
      const videoIds = querySnapshot.docs.map(doc => doc.id);
      
      // Fetch segments - use collectionGroup if available, fallback to individual queries
      const segmentsMap = new Map();
      if (videoIds.length > 0) {
        try {
          // Try collectionGroup query (requires index - faster)
          const segmentsQuery = query(
            collectionGroup(db, 'segments'),
            where('userId', '==', user.uid)
          );
          const segmentsSnapshot = await getDocs(segmentsQuery);
          
          segmentsSnapshot.forEach((segDoc) => {
            const segData = segDoc.data();
            const videoId = segDoc.ref.parent.parent.id;
            
            if (videoIds.includes(videoId)) {
              if (!segmentsMap.has(videoId)) {
                segmentsMap.set(videoId, []);
              }
              if (segData.tags) {
                segmentsMap.get(videoId).push(...segData.tags);
              }
            }
          });
        } catch (error) {
          // If collectionGroup fails (index not ready), fetch segments per video
          console.log('CollectionGroup not ready, using fallback:', error.message);
          for (const videoDoc of querySnapshot.docs) {
            const segmentsRef = collection(videoDoc.ref, 'segments');
            const segmentsSnapshot = await getDocs(segmentsRef);
            
            const segmentTags = [];
            segmentsSnapshot.forEach((segDoc) => {
              const segData = segDoc.data();
              if (segData.tags) {
                segmentTags.push(...segData.tags);
              }
            });
            
            if (segmentTags.length > 0) {
              segmentsMap.set(videoDoc.id, segmentTags);
            }
          }
        }
      }
      
      // Build video objects with all tags
      const loadedVideos = querySnapshot.docs.map((videoDoc) => {
        const videoData = { id: videoDoc.id, ...videoDoc.data() };
        const segmentTags = segmentsMap.get(videoDoc.id) || [];
        videoData.allTags = [...(videoData.tags || []), ...segmentTags];
        return videoData;
      });

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

  // Set up real-time listener for segments to update tags immediately
  useEffect(() => {
    if (videos.length === 0) return;

    // Listen to collectionGroup for all segments with userId
    const segmentsQuery = query(
      collectionGroup(db, 'segments'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(segmentsQuery, (snapshot) => {
      // Build segments map from snapshot
      const segmentsMap = new Map();
      
      snapshot.forEach((segDoc) => {
        const segData = segDoc.data();
        const videoId = segDoc.ref.parent.parent.id;
        
        if (!segmentsMap.has(videoId)) {
          segmentsMap.set(videoId, []);
        }
        if (segData.tags) {
          segmentsMap.get(videoId).push(...segData.tags);
        }
      });

      // Update videos with new segment tags
      setVideos(prevVideos => {
        const updatedVideos = prevVideos.map(video => {
          const segmentTags = segmentsMap.get(video.id) || [];
          return {
            ...video,
            allTags: [...(video.tags || []), ...segmentTags]
          };
        });

        // Update allTags
        const tagsSet = new Set();
        updatedVideos.forEach(video => {
          if (video.allTags) {
            video.allTags.forEach(tag => tagsSet.add(tag));
          }
        });
        setAllTags(Array.from(tagsSet).sort());

        return updatedVideos;
      });
    }, (error) => {
      console.log('Segments listener error:', error.message);
    });

    return () => unsubscribe();
  }, [videos.length, user.uid]);

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
