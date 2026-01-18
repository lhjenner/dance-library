import { useState } from 'react';

export default function SegmentMarkingSection({
  player,
  currentTime,
  currentSegmentStart,
  manualStart,
  manualEnd,
  duration,
  onSetManualStart,
  onSetManualEnd,
  onSetStart,
  onSetEnd,
  onManualSegment,
  formatTime,
}) {
  const [showMarkSegment, setShowMarkSegment] = useState(() => window.innerWidth >= 640);

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4">
      <button
        onClick={() => setShowMarkSegment(!showMarkSegment)}
        className="w-full flex items-center justify-between text-base sm:text-lg font-semibold mb-0 hover:text-gray-300 transition-colors"
      >
        <h3>Mark Segment</h3>
        <svg 
          className={`w-5 h-5 transition-transform ${showMarkSegment ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showMarkSegment && (
        <div className="mt-4">
          {/* Click-based marking */}
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-2">Click to Mark</div>
            <div className="flex items-center gap-2 sm:gap-4 mb-2">
              <button
                onClick={() => onSetStart(currentTime)}
                disabled={!player}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors flex-1 sm:flex-none touch-manipulation"
              >
                Set Start
              </button>
              
              <button
                onClick={() => onSetEnd(currentTime)}
                disabled={!player || currentSegmentStart === null}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors flex-1 sm:flex-none touch-manipulation"
              >
                Set End
              </button>
            </div>

            {currentSegmentStart !== null && (
              <div className="text-sm text-gray-400">
                Current segment start: {formatTime(currentSegmentStart)}
              </div>
            )}
          </div>

          {/* Manual time input */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Or Enter Manually (MM:SS)</div>
            <div className="flex items-center gap-2 mb-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                placeholder="0:00"
                value={manualStart}
                onChange={(e) => onSetManualStart(e.target.value)}
                className="bg-gray-700 text-white px-3 py-3 sm:py-2 rounded w-24 sm:w-20 text-center text-base sm:text-sm touch-manipulation"
              />
              <span className="text-gray-400">→</span>
              <input
                type="text"
                placeholder="0:00"
                value={manualEnd}
                onChange={(e) => onSetManualEnd(e.target.value)}
                className="bg-gray-700 text-white px-3 py-3 sm:py-2 rounded w-24 sm:w-20 text-center text-base sm:text-sm touch-manipulation"
              />
              <button
                onClick={() => onManualSegment(duration)}
                disabled={!manualStart || !manualEnd}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors flex-1 sm:flex-none touch-manipulation"
              >
                Add
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Example: 1:30 for 1 minute 30 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
