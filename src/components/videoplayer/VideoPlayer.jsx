import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import useYouTubePlayer from './useYouTubePlayer';
import useVideoSegments from './useVideoSegments';
import useOrientation from './hooks/useOrientation';
import SegmentItem from './SegmentItem';
import LandscapeControls from './LandscapeControls';
import PortraitControls from './PortraitControls';
import SegmentMarkingSection from './SegmentMarkingSection';
import TagsAndNotesSection from './TagsAndNotesSection';

export default function VideoPlayer({ video, onBack }) {
  const { user } = useAuth();
  const { preferences, updatePreference } = usePreferences();
  const [selectedSegmentForPlayback, setSelectedSegmentForPlayback] = useState(null);
  const isLandscape = useOrientation();

  // Use custom hooks
  const {
    player,
    playerRef,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    loading,
    handlePlayPause,
    handleSpeedChange: originalHandleSpeedChange,
    handlePlaySegment: originalHandlePlaySegment,
  } = useYouTubePlayer(video.youtubeId, preferences.defaultPlaybackSpeed);

  // Wrap speed change to save to preferences
  const handleSpeedChange = (speed) => {
    originalHandleSpeedChange(speed);
    updatePreference('defaultPlaybackSpeed', speed);
  };

  // Wrap play segment to scroll to video on mobile portrait
  const handlePlaySegment = (segment) => {
    originalHandlePlaySegment(segment);
    // Only scroll on mobile portrait (not landscape, not desktop)
    if (!isLandscape && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle segment selection in landscape mode
  const handleSelectSegmentForPlayback = (segment) => {
    setSelectedSegmentForPlayback(segment);
    // Play the selected segment
    originalHandlePlaySegment(segment);
  };

  // Clear segment selection and return to normal playback
  const handleClearSegmentSelection = () => {
    setSelectedSegmentForPlayback(null);
  };

  // Handle play from start in landscape mode
  const handlePlayFromStart = () => {
    if (selectedSegmentForPlayback) {
      // Play segment from beginning
      originalHandlePlaySegment(selectedSegmentForPlayback);
    } else {
      // Play video from beginning
      if (player) {
        player.seekTo(0);
        player.playVideo();
      }
    }
  };

  // Modified play/pause for landscape with segment selection
  const handleLandscapePlayPause = () => {
    if (selectedSegmentForPlayback) {
      if (isPlaying) {
        // If playing, just pause
        handlePlayPause();
      } else {
        // If paused, check if we're within the segment range
        const { startTime, endTime } = selectedSegmentForPlayback;
        if (currentTime >= startTime && currentTime < endTime) {
          // Within segment, just resume
          handlePlayPause();
        } else {
          // Outside segment, restart from beginning
          originalHandlePlaySegment(selectedSegmentForPlayback);
        }
      }
    } else {
      // Normal play/pause
      handlePlayPause();
    }
  };

  const {
    segments,
    currentSegment,
    manualStart,
    manualEnd,
    setManualStart,
    setManualEnd,
    formatTime,
    handleSetStart,
    handleSetEnd,
    handleManualSegment,
    handleAddSegmentTag,
    handleRemoveSegmentTag,
    handleDeleteSegment,
  } = useVideoSegments(video.id, user.uid);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors touch-manipulation ${
          isLandscape ? 'fixed top-2 left-2 z-[60] bg-gray-800 p-2 rounded-lg' : 'mb-4 sm:mb-6'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {!isLandscape && 'Back to Videos'}
      </button>

      {/* Video Title - hidden in landscape */}
      {!isLandscape && (
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{video.title}</h2>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Video Player - Goes fullscreen in landscape */}
        <div className={`lg:col-span-2 ${isLandscape ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
          <div className={`${isLandscape ? 'h-full flex flex-col' : 'bg-gray-800 rounded-lg overflow-hidden mb-4 relative'}`}>
            {/* Player container */}
            <div className={`${isLandscape ? 'flex-1 bg-black' : ''} relative`}>
              <div ref={playerRef} className={isLandscape ? 'w-full h-full' : 'w-full aspect-video'}></div>
            </div>

            {/* Landscape controls bar */}
            {isLandscape && (
              <LandscapeControls
                player={player}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                segments={segments}
                selectedSegmentForPlayback={selectedSegmentForPlayback}
                currentTime={currentTime}
                onPlayFromStart={handlePlayFromStart}
                onPlayPause={selectedSegmentForPlayback ? handleLandscapePlayPause : handlePlayPause}
                onSpeedChange={handleSpeedChange}
                onSelectSegment={handleSelectSegmentForPlayback}
                onClearSegment={handleClearSegmentSelection}
                onSetStart={handleSetStart}
                onSetEnd={handleSetEnd}
                currentSegmentStart={currentSegment.start}
              />
            )}
          </div>

          {/* Portrait mode controls - hidden in landscape */}
          {!isLandscape && (
            <>
              <PortraitControls
                player={player}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                currentTime={currentTime}
                duration={duration}
                segments={segments}
                selectedSegmentForPlayback={selectedSegmentForPlayback}
                onPlayFromStart={handlePlayFromStart}
                onPlayPause={selectedSegmentForPlayback ? handleLandscapePlayPause : handlePlayPause}
                onSpeedChange={handleSpeedChange}
                onSelectSegment={handleSelectSegmentForPlayback}
                onClearSegment={handleClearSegmentSelection}
                formatTime={formatTime}
              />

              <SegmentMarkingSection
                player={player}
                currentTime={currentTime}
                currentSegmentStart={currentSegment.start}
                manualStart={manualStart}
                manualEnd={manualEnd}
                duration={duration}
                onSetManualStart={setManualStart}
                onSetManualEnd={setManualEnd}
                onSetStart={handleSetStart}
                onSetEnd={handleSetEnd}
                onManualSegment={handleManualSegment}
                formatTime={formatTime}
              />
            </>
          )}
        </div>

        {/* Segments List - Hidden in landscape, shown in portrait and desktop */}
        {!isLandscape && (
          <div className="lg:col-span-1 order-1 lg:order-none">
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Segments ({segments.length})
              </h3>

              {segments.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No segments yet. Mark segments using the controls above.
                </p>
              ) : (
                <div className="space-y-3">
                  {segments.map((segment, index) => (
                    <SegmentItem
                      key={segment.id}
                      segment={segment}
                      index={index}
                      onDelete={() => handleDeleteSegment(segment.id)}
                      onPlay={() => handlePlaySegment(segment)}
                      onAddTag={(tag) => handleAddSegmentTag(segment.id, tag)}
                      onRemoveTag={(tag) => handleRemoveSegmentTag(segment.id, tag)}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags and Notes - order-2 on mobile so it appears after Segments */}
        {!isLandscape && (
          <div className="lg:col-span-2 order-2 lg:order-none">
            <TagsAndNotesSection videoId={video.id} userId={user.uid} />
          </div>
        )}
      </div>
    </div>
  );
}
