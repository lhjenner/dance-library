import { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';

export function useAllTags(userId) {
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setAllTags([]);
      setLoading(false);
      return;
    }

    const fetchAllTags = async () => {
      try {
        setLoading(true);
        const tagsSet = new Set();

        // Fetch all video tags for the user
        const videosRef = collection(db, 'videos');
        const videosQuery = query(videosRef, where('userId', '==', userId));
        const videosSnapshot = await getDocs(videosQuery);
        
        videosSnapshot.forEach((doc) => {
          const videoData = doc.data();
          if (videoData.tags && Array.isArray(videoData.tags)) {
            videoData.tags.forEach(tag => tagsSet.add(tag));
          }
        });

        // Fetch all segment tags for the user
        // Get video IDs first for filtering
        const videoIds = videosSnapshot.docs.map(doc => doc.id);
        
        try {
          const segmentsQuery = query(collectionGroup(db, 'segments'));
          const segmentsSnapshot = await getDocs(segmentsQuery);
          
          segmentsSnapshot.forEach((doc) => {
            const segmentData = doc.data();
            const videoId = doc.ref.parent.parent.id;
            
            // Only include segments from user's videos
            if (videoIds.includes(videoId) && segmentData.tags && Array.isArray(segmentData.tags)) {
              segmentData.tags.forEach(tag => tagsSet.add(tag));
            }
          });
        } catch (error) {
          // If collectionGroup query fails (index not ready), skip segment tags
          console.log('Segment tags not available:', error.message);
        }

        setAllTags(Array.from(tagsSet).sort());
      } catch (error) {
        console.error('Error fetching tags:', error);
        setAllTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTags();
  }, [userId]);

  return { allTags, loading };
}
