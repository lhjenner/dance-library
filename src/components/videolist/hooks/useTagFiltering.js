import { useState } from 'react';

export function useTagFiltering(videos) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [showUntaggedOnly, setShowUntaggedOnly] = useState(false);
  const [filterMode, setFilterMode] = useState('AND'); // 'AND' or 'OR'

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleUntagged = () => {
    setShowUntaggedOnly(!showUntaggedOnly);
    setSelectedTags([]);
  };

  const toggleFilterMode = () => {
    setFilterMode(prevMode => prevMode === 'AND' ? 'OR' : 'AND');
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setShowUntaggedOnly(false);
  };

  const filteredVideos = videos.filter(video => {
    if (showUntaggedOnly) {
      return !video.allTags || video.allTags.length === 0;
    }
    
    if (selectedTags.length > 0) {
      if (!video.allTags || video.allTags.length === 0) return false;
      
      if (filterMode === 'AND') {
        return selectedTags.every(tag => video.allTags.includes(tag));
      } else {
        return selectedTags.some(tag => video.allTags.includes(tag));
      }
    }
    
    return true;
  });

  return {
    selectedTags,
    showUntaggedOnly,
    filterMode,
    toggleTag,
    toggleUntagged,
    toggleFilterMode,
    clearFilters,
    filteredVideos,
  };
}
