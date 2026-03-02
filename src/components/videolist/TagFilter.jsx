import { useState, useMemo } from 'react';

export default function TagFilter({ 
  allTags, 
  selectedTags, 
  showUntaggedOnly, 
  filterMode,
  filteredCount, 
  totalCount, 
  onToggleTag, 
  onToggleUntagged,
  onToggleFilterMode,
  videos
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate available tags based on current selection (AND mode only)
  const availableTags = useMemo(() => {
    // In OR mode or when no tags selected, show all tags
    if (filterMode === 'OR' || selectedTags.length === 0) {
      return allTags;
    }

    // In AND mode with selected tags, only show tags that exist on videos matching ALL selected tags
    const matchingVideos = videos.filter(video => {
      if (!video.allTags || video.allTags.length === 0) return false;
      return selectedTags.every(tag => video.allTags.includes(tag));
    });

    // Collect all unique tags from matching videos
    const tagsSet = new Set();
    matchingVideos.forEach(video => {
      if (video.allTags) {
        video.allTags.forEach(tag => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  }, [allTags, selectedTags, filterMode, videos]);

  if (allTags.length === 0 && filteredCount === totalCount) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 hover:text-gray-300 transition-colors"
        >
          <h3 className="text-sm sm:text-base font-semibold">Filter by Tags</h3>
          <svg 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Filter criteria:</span>
          <button
            onClick={onToggleFilterMode}
            className="px-3 py-1 rounded text-xs font-semibold transition-colors bg-red-600 text-white hover:bg-red-700"
            title={filterMode === 'AND' ? 'Videos must have ALL selected tags' : 'Videos must have ANY selected tag'}
          >
            {filterMode}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onToggleUntagged}
          className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors touch-manipulation ${
            showUntaggedOnly
              ? 'bg-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Untagged Only
        </button>
        
        {availableTags.map(tag => (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors touch-manipulation ${
              selectedTags.includes(tag)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {(selectedTags.length > 0 || showUntaggedOnly) && (
        <div className="text-xs sm:text-sm text-gray-400">
          Showing {filteredCount} of {totalCount} videos
          {selectedTags.length > 0 && (
            <>
              {` with ${filterMode === 'AND' ? 'all' : 'any'} of: ${selectedTags.join(', ')}`}
            </>
          )}
          {showUntaggedOnly && ' without tags'}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
