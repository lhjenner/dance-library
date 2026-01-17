export default function TagFilter({ 
  allTags, 
  selectedTags, 
  showUntaggedOnly, 
  filteredCount, 
  totalCount, 
  onToggleTag, 
  onToggleUntagged 
}) {
  if (allTags.length === 0 && filteredCount === totalCount) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold mb-3">Filter by Tags</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onToggleUntagged}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            showUntaggedOnly
              ? 'bg-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Untagged Only
        </button>
        
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
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
        <div className="text-sm text-gray-400">
          Showing {filteredCount} of {totalCount} videos
          {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
          {showUntaggedOnly && ' without tags'}
        </div>
      )}
    </div>
  );
}
