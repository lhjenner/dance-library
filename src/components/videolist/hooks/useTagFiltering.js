import { useState } from 'react';

export function useTagFiltering(videos) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [showUntaggedOnly, setShowUntaggedOnly] = useState(false);

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

  const filteredVideos = videos.filter(video => {
    if (showUntaggedOnly) {
      return !video.tags || video.tags.length === 0;
    }
    
    if (selectedTags.length > 0) {
      if (!video.allTags || video.allTags.length === 0) return false;
      return selectedTags.some(tag => video.allTags.includes(tag));
    }
    
    return true;
  });

  return {
    selectedTags,
    showUntaggedOnly,
    toggleTag,
    toggleUntagged,
    filteredVideos,
  };
}
