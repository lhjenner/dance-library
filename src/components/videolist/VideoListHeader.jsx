export default function VideoListHeader({ 
  playlistTitle, 
  videoCount, 
  selectedCount, 
  isSelectionMode, 
  onStartSelection, 
  onShowMove, 
  onShowCopy, 
  onCancel 
}) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">{playlistTitle}</h2>
        <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
          {videoCount} videos
          {selectedCount > 0 && ` (${selectedCount} selected)`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {!isSelectionMode ? (
          <button
            onClick={onStartSelection}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors inline-flex items-center gap-2 touch-manipulation text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Move/Copy Videos</span>
            <span className="sm:hidden">Move/Copy</span>
          </button>
        ) : (
          <>
            {selectedCount > 0 && (
              <>
                <button
                  onClick={onShowMove}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-sm sm:text-base flex-1 sm:flex-none"
                >
                  Move ({selectedCount})
                </button>
                <button
                  onClick={onShowCopy}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-sm sm:text-base flex-1 sm:flex-none"
                >
                  Copy ({selectedCount})
                </button>
              </>
            )}
            <button
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-sm sm:text-base w-full sm:w-auto"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
