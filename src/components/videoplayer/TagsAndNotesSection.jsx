import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAllTags } from './hooks/useAllTags';

export default function TagsAndNotesSection({ videoId, userId }) {
  const [videoTags, setVideoTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const { allTags } = useAllTags(userId);

  // Filter suggestions based on input
  const filteredSuggestions = tagInput.trim()
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(tagInput.trim().toLowerCase()) &&
        !videoTags.includes(tag)
      )
    : [];

  // Load video tags and notes from Firestore
  useEffect(() => {
    const loadVideoData = async () => {
      try {
        const videoRef = doc(db, 'videos', videoId);
        const videoSnapshot = await getDoc(videoRef);
        
        if (videoSnapshot.exists()) {
          const videoData = videoSnapshot.data();
          setVideoTags(videoData.tags || []);
          const loadedNotes = videoData.notes || '';
          setNotes(loadedNotes);
          // Auto-show notes section if there are existing notes
          if (loadedNotes.trim()) {
            setShowNotes(true);
          }
        }
      } catch (err) {
        console.error('Error loading video data:', err);
      }
    };

    loadVideoData();
  }, [videoId, userId]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = async (newTag) => {
    const tag = newTag.trim().toLowerCase();
    
    if (!tag || videoTags.includes(tag)) {
      setTagInput('');
      setShowSuggestions(false);
      return;
    }

    const updatedTags = [...videoTags, tag];
    
    try {
      const videoRef = doc(db, 'videos', videoId);
      await updateDoc(videoRef, { tags: updatedTags });
      setVideoTags(updatedTags);
      setTagInput('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } catch (err) {
      console.error('Error adding tag:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      alert(`Failed to add tag: ${err.message}`);
    }
  };

  const handleAddTag = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If a suggestion is selected, use it
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredSuggestions.length) {
        await addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (tagInput.trim()) {
        // Otherwise, add the typed input
        await addTag(tagInput);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setShowSuggestions(true);
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setShowSuggestions(true);
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    setSelectedSuggestionIndex(-1);
    
    if (value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag);
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
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a tag (press Enter)"
            value={tagInput}
            onChange={handleInputChange}
            onKeyDown={handleAddTag}
            className="w-full bg-gray-700 text-white px-3 py-3 sm:py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm touch-manipulation"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {filteredSuggestions.map((tag, index) => (
                <button
                  key={tag}
                  onClick={() => handleSuggestionClick(tag)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 transition-colors ${
                    index === selectedSuggestionIndex ? 'bg-gray-600' : ''
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          e.g., "whip", "lindy hop", "advanced"
        </div>
      </div>

      {/* Notes */}
      <div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between text-sm text-gray-400 mb-2 hover:text-gray-300 transition-colors"
        >
          <span>Notes</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showNotes && (
          <div className="animate-in slide-in-from-top duration-200">
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
        )}
      </div>
    </div>
  );
}
