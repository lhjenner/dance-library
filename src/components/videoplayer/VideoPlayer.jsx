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

export default function VideoPlayer({ video, onBack, isCurrentPlaylistArchive, onArchive, onRestore, isOperating }) {
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

  // Seek backward 10 seconds
  const handleSeekBackward = () => {
    if (player) {
      const newTime = Math.max(0, currentTime - 10);
      player.seekTo(newTime);
      if (!isPlaying) {
        player.playVideo();
      }
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
    <div className="max-w-[1600px] mx-auto">
      <div className={isLandscape ? '' : 'sticky top-0 z-50 bg-gray-900 pb-4'}>
        {/* Back button */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors touch-manipulation ${
            isLandscape ? 'fixed top-2 left-2 z-[60] bg-gray-800 p-2 rounded-lg' : 'pt-4 mb-4 sm:mb-6'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {!isLandscape && 'Back to Videos'}
        </button>

        {/* Video Title - hidden in landscape */}
        {!isLandscape && (
          <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold flex-1">{video.title}</h2>
            {/* Archive/Restore button */}
            <div className="flex-shrink-0">
              {!isCurrentPlaylistArchive && onArchive && (
                <button
                  onClick={onArchive}
                  disabled={isOperating}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors touch-manipulation text-sm font-semibold flex items-center gap-2"
                >
                  {isOperating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span>Archive</span>
                    </>
                  )}
                </button>
              )}
              {isCurrentPlaylistArchive && onRestore && (
                <button
                  onClick={onRestore}
                  disabled={isOperating}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors touch-manipulation text-sm font-semibold flex items-center gap-2"
                >
                  {isOperating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6-6m0 0l6 6m-6-6v12a6 6 0 01-12 0v-3" />
                      </svg>
                      <span>Restore</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Video Player - Goes fullscreen in landscape */}
        <div className={`lg:col-span-3 ${isLandscape ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
          {isLandscape ? (
            <>
              {/* Video area - calc height minus controls */}
              <div className="flex items-center justify-center bg-black" style={{ height: 'calc(100dvh - 52px)' }}>
                <div className="h-full aspect-video">
                  <div ref={playerRef} className="w-full h-full"></div>
                </div>
              </div>
              
              {/* Controls bar - fixed height */}
              <LandscapeControls
                player={player}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                segments={segments}
                selectedSegmentForPlayback={selectedSegmentForPlayback}
                currentTime={currentTime}
                onPlayFromStart={handlePlayFromStart}
                onPlayPause={selectedSegmentForPlayback ? handleLandscapePlayPause : handlePlayPause}
                onSeekBackward={handleSeekBackward}
                onSpeedChange={handleSpeedChange}
                onSelectSegment={handleSelectSegmentForPlayback}
                onClearSegment={handleClearSegmentSelection}
                onSetStart={handleSetStart}
                onSetEnd={handleSetEnd}
                currentSegmentStart={currentSegment.start}
                isCurrentPlaylistArchive={isCurrentPlaylistArchive}
                onArchive={onArchive}
                onRestore={onRestore}
                isOperating={isOperating}
              />
            </>
          ) : (
            <>
              <div className="rounded-lg overflow-hidden mb-6 relative lg:max-w-[1400px] lg:mx-auto lg:h-[65vh]">
                <div ref={playerRef} className="w-full aspect-video video-player-desktop lg:h-full" style={{ position: 'relative' }}></div>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:gap-6 lg:max-w-[1400px] lg:mx-auto">
                <div className="lg:flex-1">
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
                    onSeekBackward={handleSeekBackward}
                    onSpeedChange={handleSpeedChange}
                    onSelectSegment={handleSelectSegmentForPlayback}
                    onClearSegment={handleClearSegmentSelection}
                    formatTime={formatTime}
                    isCurrentPlaylistArchive={isCurrentPlaylistArchive}
                    onArchive={onArchive}
                    onRestore={onRestore}
                    isOperating={isOperating}
                  />
                </div>

                <div className="lg:flex-1">
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
                </div>
              </div>

              {/* Segments List - Below Mark Segment on desktop, after video on mobile */}
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4">
                  Segments ({segments.length})
                </h3>

                {segments.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No segments yet. Mark segments using the controls above.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                        userId={user.uid}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tags and Notes - Below Segments */}
              <div className="mt-4 sm:mt-6">
                <TagsAndNotesSection videoId={video.id} userId={user.uid} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
