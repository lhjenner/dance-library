import { useState, useEffect, useRef } from 'react';
import { useAllTags } from './hooks/useAllTags';

export default function SegmentItem({ segment, index, onDelete, onPlay, onAddTag, onRemoveTag, formatTime, userId }) {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const { allTags } = useAllTags(userId);

  // Filter suggestions based on input
  const filteredSuggestions = tagInput.trim()
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(tagInput.trim().toLowerCase()) &&
        !segment.tags?.includes(tag)
      )
    : [];

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

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag) {
      onAddTag(trimmedTag);
      setTagInput('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If a suggestion is selected, use it
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (tagInput.trim()) {
        // Otherwise, add the typed input
        addTag(tagInput);
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

  return (
    <div className="bg-gray-700 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">Segment {index + 1}</span>
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          Delete
        </button>
      </div>
      
      <div className="text-sm text-gray-300 mb-2">
        {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
      </div>

      {/* Segment Tags */}
      {segment.tags && segment.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {segment.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-0.5 rounded text-xs"
            >
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add tag..."
          value={tagInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-gray-600 border border-gray-500 rounded-lg shadow-lg max-h-32 overflow-y-auto"
          >
            {filteredSuggestions.map((tag, index) => (
              <button
                key={tag}
                onClick={() => handleSuggestionClick(tag)}
                className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-500 transition-colors ${
                  index === selectedSuggestionIndex ? 'bg-gray-500' : ''
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onPlay}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors"
      >
        Play Segment
      </button>
    </div>
  );
}
