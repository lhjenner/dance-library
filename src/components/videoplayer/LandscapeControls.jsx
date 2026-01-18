import { useState } from 'react';

export default function LandscapeControls({
  player,
  isPlaying,
  playbackSpeed,
  segments,
  selectedSegmentForPlayback,
  currentTime,
  onPlayFromStart,
  onPlayPause,
  onSpeedChange,
  onSelectSegment,
  onClearSegment,
  onSetStart,
  onSetEnd,
  currentSegmentStart,
}) {
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleSelectSegment = (segment) => {
    onSelectSegment(segment);
    setShowSegmentSelector(false);
  };

  return (
    <div className="bg-gray-800 p-2 flex items-center gap-2 relative">
      {/* Play from Start Button */}
      <button
        onClick={onPlayFromStart}
        disabled={!player}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors touch-manipulation text-xs whitespace-nowrap"
      >
        Play from Start
      </button>

      {/* Play/Pause Button - Modified when segment selected */}
      <button
        onClick={onPlayPause}
        disabled={!player}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded transition-colors touch-manipulation text-xs whitespace-nowrap flex items-center gap-1"
      >
        {selectedSegmentForPlayback ? (
          <>
            {isPlaying ? 'Pause Segment' : 'Play Segment'}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClearSegment();
              }}
              className="hover:text-red-300 ml-1 cursor-pointer"
            >
              ×
            </span>
          </>
        ) : (
          <>{isPlaying ? 'Pause' : 'Play'}</>
        )}
      </button>

      {/* Collapsible Speed Control */}
      <div className="relative">
        <button
          onClick={() => setShowSpeedOptions(!showSpeedOptions)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors touch-manipulation flex items-center gap-1"
        >
          <span className="text-xs">{playbackSpeed}x</span>
          <svg 
            className={`w-3 h-3 transition-transform ${showSpeedOptions ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Expanded speed options - positioned above */}
        {showSpeedOptions && (
          <div className="absolute bottom-full left-0 mb-1 bg-gray-800 rounded shadow-lg p-1 flex gap-1 z-10">
            {speeds.filter(speed => speed !== playbackSpeed).map(speed => (
              <button
                key={speed}
                onClick={() => {
                  onSpeedChange(speed);
                  setShowSpeedOptions(false);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors touch-manipulation text-xs"
              >
                {speed}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Segments Selector */}
      <div className="relative">
        <button
          onClick={() => setShowSegmentSelector(!showSegmentSelector)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition-colors touch-manipulation text-xs whitespace-nowrap"
        >
          Segments
        </button>
        
        {/* Segments flyout - positioned above */}
        {showSegmentSelector && (
          <div className="absolute bottom-full left-0 mb-1 bg-gray-800 rounded shadow-lg p-2 z-10 max-h-64 overflow-y-auto min-w-[480px]">
            {segments.length === 0 ? (
              <div className="text-gray-400 text-xs p-2">No segments yet</div>
            ) : (
              <div className="space-y-1">
                {segments.map((segment, index) => (
                  <button
                    key={segment.id}
                    onClick={() => handleSelectSegment(segment)}
                    className="w-full text-left bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors touch-manipulation"
                  >
                    <div className="text-xs font-semibold mb-1">Segment {index + 1}</div>
                    {segment.tags && segment.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {segment.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block bg-purple-600 text-white px-1.5 py-0.5 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1"></div>

      {/* Segment Controls */}
      <button
        onClick={() => onSetStart(currentTime)}
        disabled={!player}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-2 sm:px-4 py-2 rounded transition-colors touch-manipulation text-xs sm:text-sm whitespace-nowrap"
      >
        Set Start
      </button>
      
      <button
        onClick={() => onSetEnd(currentTime)}
        disabled={!player || currentSegmentStart === null}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-2 sm:px-4 py-2 rounded transition-colors touch-manipulation text-xs sm:text-sm whitespace-nowrap"
      >
        Set End
      </button>
    </div>
  );
}
