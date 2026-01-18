import { useState } from 'react';

export default function PortraitControls({
  player,
  isPlaying,
  playbackSpeed,
  currentTime,
  duration,
  segments,
  selectedSegmentForPlayback,
  onPlayFromStart,
  onPlayPause,
  onSpeedChange,
  onSelectSegment,
  onClearSegment,
  formatTime,
}) {
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);

  const speeds = [0.25, 0.5, 0.75, 1];

  const handleSelectSegment = (segment) => {
    onSelectSegment(segment);
    setShowSegmentSelector(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4">
      {/* Mobile compact layout */}
      <div className="sm:hidden">
        {/* Segment selection row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Segments Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowSegmentSelector(!showSegmentSelector)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors touch-manipulation text-sm"
            >
              Segments
            </button>
            
            {/* Segments flyout - positioned above */}
            {showSegmentSelector && (
              <div className="absolute bottom-full left-0 mb-1 bg-gray-800 rounded shadow-lg p-2 z-10 max-h-64 overflow-y-auto w-full min-w-[280px]">
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
          
          {/* Clear segment selection if one is selected */}
          {selectedSegmentForPlayback && (
            <button
              onClick={onClearSegment}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors touch-manipulation text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Playback control row */}
        <div className="flex items-center gap-2 mb-3">
          {/* Play from Start Button */}
          <button
            onClick={onPlayFromStart}
            disabled={!player}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-3 rounded-lg transition-colors touch-manipulation text-sm whitespace-nowrap"
          >
            From Start
          </button>

          {/* Play/Pause Button - Modified when segment selected */}
          <button
            onClick={onPlayPause}
            disabled={!player}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors touch-manipulation flex-[2] text-sm"
          >
            {selectedSegmentForPlayback ? (
              <>{isPlaying ? 'Pause Seg' : 'Play Seg'}</>
            ) : (
              <>{isPlaying ? 'Pause' : 'Play'}</>
            )}
          </button>
          
          {/* Collapsible speed selector */}
          <button
            onClick={() => setShowSpeedOptions(!showSpeedOptions)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-3 rounded-lg transition-colors touch-manipulation flex-1 flex items-center justify-center gap-1"
          >
            <span className="text-sm">{playbackSpeed}x</span>
            <svg 
              className={`w-3 h-3 transition-transform ${showSpeedOptions ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Time display */}
        <div className="text-gray-400 text-xs text-center mb-3">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        {/* Expanded speed options */}
        {showSpeedOptions && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {speeds.filter(speed => speed !== playbackSpeed).map(speed => (
              <button
                key={speed}
                onClick={() => {
                  onSpeedChange(speed);
                  setShowSpeedOptions(false);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded transition-colors touch-manipulation"
              >
                {speed}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={onPlayPause}
            disabled={!player}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors touch-manipulation"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
      
          <div className="text-gray-400 text-base">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Speed Controls */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Playback Speed</div>
          <div className="flex gap-2">
            {speeds.map(speed => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-3 py-1 rounded transition-colors touch-manipulation ${
                  playbackSpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
