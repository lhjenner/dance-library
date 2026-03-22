import { getDisplayPlaylistName } from '../../utils/archiveHelpers';

export default function VideoListHeader({ 
  playlistTitle, 
  videoCount, 
  selectedCount, 
  isSelectionMode, 
  onStartSelection, 
  onShowMove, 
  onShowCopy, 
  onArchive,
  onRestore,
  isCurrentPlaylistArchive,
  archiving,
  restoring,
  hasArchive,
  onViewArchive,
  onCancel 
}) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">{getDisplayPlaylistName(playlistTitle)}</h2>
        <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
          {videoCount} videos
          {selectedCount > 0 && ` (${selectedCount} selected)`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {!isSelectionMode ? (
          <>
            {hasArchive && (
              <button
                onClick={onViewArchive}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors inline-flex items-center gap-2 touch-manipulation text-sm sm:text-base w-auto justify-center flex-1 sm:flex-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span className="hidden sm:inline">View Archive</span>
                <span className="sm:hidden">Archive</span>
              </button>
            )}
            <button
              onClick={onStartSelection}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors inline-flex items-center gap-2 touch-manipulation text-sm sm:text-base justify-center flex-1 sm:flex-none sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">Move/Copy Videos</span>
              <span className="sm:hidden">Move/Copy</span>
            </button>
          </>
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
                {!isCurrentPlaylistArchive && (
                  <button
                    onClick={onArchive}
                    disabled={archiving}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    {archiving ? 'Archiving...' : `Archive (${selectedCount})`}
                  </button>
                )}
                {isCurrentPlaylistArchive && (
                  <button
                    onClick={onRestore}
                    disabled={restoring}
                    className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white font-semibold px-4 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    {restoring ? 'Restoring...' : `Restore (${selectedCount})`}
                  </button>
                )}
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
