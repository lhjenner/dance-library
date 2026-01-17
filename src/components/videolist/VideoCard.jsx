export default function VideoCard({ 
  video, 
  isSelectionMode, 
  isSelected, 
  onToggleSelection, 
  onClick, 
  onRemove 
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 flex gap-3 sm:gap-4 hover:bg-gray-750 transition-colors touch-manipulation">
      {isSelectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(video.id)}
          className="w-6 h-6 sm:w-5 sm:h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer flex-shrink-0 mt-1 touch-manipulation"
        />
      )}
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-32 h-20 sm:w-40 sm:h-24 object-cover rounded flex-shrink-0 cursor-pointer touch-manipulation"
          onClick={() => onClick(video)}
        />
      )}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(video)}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm sm:text-lg line-clamp-3 sm:line-clamp-2">{video.title}</h3>
          {(!video.allTags || video.allTags.length === 0) && (
            <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
              No tags
            </span>
          )}
        </div>
        {video.allTags && video.allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {[...new Set(video.allTags)].map((tag) => (
              <span
                key={tag}
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {!isSelectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(video);
          }}
          className="text-red-400 hover:text-red-300 p-2 sm:p-2 flex-shrink-0 touch-manipulation"
          title="Remove from playlist"
        >
          <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
