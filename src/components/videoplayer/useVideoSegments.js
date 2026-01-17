import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, doc, setDoc, getDocs, query, deleteDoc, updateDoc } from 'firebase/firestore';

export default function useVideoSegments(videoId, userId) {
  const [segments, setSegments] = useState([]);
  const [currentSegment, setCurrentSegment] = useState({ start: null, end: null });
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');

  // Load segments from Firestore
  useEffect(() => {
    const loadSegments = async () => {
      try {
        const videoDoc = doc(db, 'videos', videoId);
        const segmentsRef = collection(videoDoc, 'segments');
        const q = query(segmentsRef);
        const querySnapshot = await getDocs(q);
        
        const loadedSegments = [];
        querySnapshot.forEach((doc) => {
          loadedSegments.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by start time
        loadedSegments.sort((a, b) => a.startTime - b.startTime);
        setSegments(loadedSegments);
      } catch (err) {
        console.error('Error loading segments:', err);
      }
    };

    loadSegments();
  }, [videoId, userId]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeString) => {
    // Parse MM:SS or M:SS format
    const parts = timeString.split(':');
    if (parts.length !== 2) return null;
    
    const mins = parseInt(parts[0]);
    const secs = parseInt(parts[1]);
    
    if (isNaN(mins) || isNaN(secs) || secs >= 60 || mins < 0 || secs < 0) {
      return null;
    }
    
    return mins * 60 + secs;
  };

  const handleSetStart = (currentTime) => {
    setCurrentSegment({ ...currentSegment, start: currentTime });
    setManualStart(formatTime(currentTime));
  };

  const handleSetEnd = async (currentTime) => {
    const endTime = currentTime;
    
    if (currentSegment.start === null) {
      alert('Please set a start time first');
      return;
    }
    
    if (endTime <= currentSegment.start) {
      alert('End time must be after start time');
      return;
    }

    await saveSegment(currentSegment.start, endTime);
  };

  const handleManualSegment = async (duration) => {
    const startTime = parseTime(manualStart);
    const endTime = parseTime(manualEnd);
    
    if (startTime === null) {
      alert('Invalid start time. Use format MM:SS (e.g., 1:30)');
      return;
    }
    
    if (endTime === null) {
      alert('Invalid end time. Use format MM:SS (e.g., 2:45)');
      return;
    }
    
    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }
    
    if (endTime > duration) {
      alert('End time cannot exceed video duration');
      return;
    }

    await saveSegment(startTime, endTime);
    setManualStart('');
    setManualEnd('');
  };

  const saveSegment = async (startTime, endTime) => {
    // Save segment to Firestore
    try {
      const videoDoc = doc(db, 'videos', videoId);
      const segmentsRef = collection(videoDoc, 'segments');
      const newSegmentRef = doc(segmentsRef);
      
      const segmentData = {
        startTime: startTime,
        endTime: endTime,
        tags: [],
        notes: '',
        createdAt: new Date(),
      };
      
      await setDoc(newSegmentRef, segmentData);
      
      // Add to local state
      setSegments([...segments, { id: newSegmentRef.id, ...segmentData }].sort((a, b) => a.startTime - b.startTime));
      
      // Reset current segment
      setCurrentSegment({ start: null, end: null });
      setManualStart('');
      setManualEnd('');
    } catch (err) {
      console.error('Error saving segment:', err);
      alert('Failed to save segment');
    }
  };

  const handleAddSegmentTag = async (segmentId, tag) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    const newTag = tag.trim().toLowerCase();
    if (!newTag || (segment.tags || []).includes(newTag)) return;

    const updatedTags = [...(segment.tags || []), newTag];
    
    try {
      const videoDoc = doc(db, 'videos', videoId);
      const segmentRef = doc(videoDoc, 'segments', segmentId);
      await updateDoc(segmentRef, { tags: updatedTags });
      
      setSegments(segments.map(s => 
        s.id === segmentId ? { ...s, tags: updatedTags } : s
      ));
    } catch (err) {
      console.error('Error adding segment tag:', err);
      alert('Failed to add segment tag');
    }
  };

  const handleRemoveSegmentTag = async (segmentId, tagToRemove) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    const updatedTags = (segment.tags || []).filter(tag => tag !== tagToRemove);
    
    try {
      const videoDoc = doc(db, 'videos', videoId);
      const segmentRef = doc(videoDoc, 'segments', segmentId);
      await updateDoc(segmentRef, { tags: updatedTags });
      
      setSegments(segments.map(s => 
        s.id === segmentId ? { ...s, tags: updatedTags } : s
      ));
    } catch (err) {
      console.error('Error removing segment tag:', err);
      alert('Failed to remove segment tag');
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    try {
      const videoDoc = doc(db, 'videos', videoId);
      const segmentDoc = doc(videoDoc, 'segments', segmentId);
      await deleteDoc(segmentDoc);
      
      setSegments(segments.filter(s => s.id !== segmentId));
    } catch (err) {
      console.error('Error deleting segment:', err);
      alert('Failed to delete segment');
    }
  };

  return {
    segments,
    currentSegment,
    manualStart,
    manualEnd,
    setManualStart,
    setManualEnd,
    formatTime,
    handleSetStart,
    handleSetEnd,
    handleManualSegment,
    handleAddSegmentTag,
    handleRemoveSegmentTag,
    handleDeleteSegment,
  };
}
