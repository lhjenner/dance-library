import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, doc, getDocs, query, where, updateDoc } from 'firebase/firestore';

export default function TagsAndNotesSection({ videoId, userId }) {
  const [videoTags, setVideoTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');

  // Load video tags and notes from Firestore
  useEffect(() => {
    const loadVideoData = async () => {
      try {
        const videoDoc = doc(db, 'videos', videoId);
        const videoSnapshot = await getDocs(query(collection(db, 'videos'), where('__name__', '==', videoId)));
        
        if (!videoSnapshot.empty) {
          const videoData = videoSnapshot.docs[0].data();
          setVideoTags(videoData.tags || []);
          setNotes(videoData.notes || '');
        }
      } catch (err) {
        console.error('Error loading video data:', err);
      }
    };

    loadVideoData();
  }, [videoId, userId]);

  const handleAddTag = async (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      
      if (videoTags.includes(newTag)) {
        setTagInput('');
        return;
      }

      const updatedTags = [...videoTags, newTag];
      
      try {
        const videoRef = doc(db, 'videos', videoId);
        await updateDoc(videoRef, { tags: updatedTags });
        setVideoTags(updatedTags);
        setTagInput('');
      } catch (err) {
        console.error('Error adding tag:', err);
        alert('Failed to add tag');
      }
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const updatedTags = videoTags.filter(tag => tag !== tagToRemove);
    
    try {
      const videoRef = doc(db, 'videos', videoId);
      await updateDoc(videoRef, { tags: updatedTags });
      setVideoTags(updatedTags);
    } catch (err) {
      console.error('Error removing tag:', err);
      alert('Failed to remove tag');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const videoRef = doc(db, 'videos', videoId);
      await updateDoc(videoRef, { notes: notes });
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Tags & Notes</h3>
      
      {/* Video Tags */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Video Tags</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {videoTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 sm:py-1 rounded-full text-sm touch-manipulation"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-300 ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add a tag (press Enter)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="w-full bg-gray-700 text-white px-3 py-3 sm:py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm touch-manipulation"
        />
        <div className="text-xs text-gray-500 mt-1">
          e.g., "whip", "lindy hop", "advanced"
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Notes</div>
        <textarea
          placeholder="Add notes about this video..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          className="w-full bg-gray-700 text-white px-3 py-3 sm:py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base sm:text-sm touch-manipulation"
          rows={4}
        />
        <div className="text-xs text-gray-500 mt-1">
          Notes save automatically when you click away
        </div>
      </div>
    </div>
  );
}
