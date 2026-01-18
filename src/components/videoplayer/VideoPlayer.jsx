import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { db } from '../../firebase/config';
import { collection, doc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import useYouTubePlayer from './useYouTubePlayer';
import useVideoSegments from './useVideoSegments';
import SegmentItem from './SegmentItem';

export default function VideoPlayer({ video, onBack }) {
  const { user } = useAuth();
  const { preferences, updatePreference } = usePreferences();
  const [videoTags, setVideoTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [showMarkSegment, setShowMarkSegment] = useState(() => window.innerWidth >= 640); // Expanded on desktop, collapsed on mobile

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

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

  // Load video tags and notes from Firestore
  useEffect(() => {
    const loadVideoData = async () => {
      try {
        const videoDoc = doc(db, 'videos', video.id);
        const videoSnapshot = await getDocs(query(collection(db, 'videos'), where('__name__', '==', video.id)));
        
        if (!videoSnapshot.empty) {
          const videoData = videoSnapshot.docs[0].data();
          setVideoTags(videoData.tags || []);
          setNotes(videoData.notes || '');
        }
      } catch (err) {
        console.error('Error loading video data:', err);
      }
    };

    loadVideoData();
  }, [video.id, user.uid]);

  // Detect orientation changes for mobile landscape mode
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscapeOrientation = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
      setIsLandscape(isLandscapeOrientation);
    };

    handleOrientationChange(); // Check initial orientation
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const handleAddTag = async (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      
      if (videoTags.includes(newTag)) {
        setTagInput('');
        return;
      }

      const updatedTags = [...videoTags, newTag];
      
      try {
        const videoRef = doc(db, 'videos', video.id);
        await updateDoc(videoRef, { tags: updatedTags });
        setVideoTags(updatedTags);
        setTagInput('');
      } catch (err) {
        console.error('Error adding tag:', err);
        alert('Failed to add tag');
      }
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const updatedTags = videoTags.filter(tag => tag !== tagToRemove);
    
    try {
      const videoRef = doc(db, 'videos', video.id);
      await updateDoc(videoRef, { tags: updatedTags });
      setVideoTags(updatedTags);
    } catch (err) {
      console.error('Error removing tag:', err);
      alert('Failed to remove tag');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const videoRef = doc(db, 'videos', video.id);
      await updateDoc(videoRef, { notes: notes });
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes');
    }
  };

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
              <div className="bg-gray-800 p-2 flex items-center gap-2 sm:gap-4">
                {/* Speed Controls */}
                <div className="flex gap-1">
                  {[0.25, 0.5, 0.75, 1].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-2 sm:px-3 py-2 rounded transition-colors touch-manipulation text-xs sm:text-sm ${
                        playbackSpeed === speed
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <div className="flex-1"></div>

                {/* Segment Controls */}
                <button
                  onClick={() => handleSetStart(currentTime)}
                  disabled={!player}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-2 sm:px-4 py-2 rounded transition-colors touch-manipulation text-xs sm:text-sm whitespace-nowrap"
                >
                  Set Start
                </button>
                
                <button
                  onClick={() => handleSetEnd(currentTime)}
                  disabled={!player || currentSegment.start === null}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-2 sm:px-4 py-2 rounded transition-colors touch-manipulation text-xs sm:text-sm whitespace-nowrap"
                >
                  Set End
                </button>
              </div>
            )}
          </div>

          {/* Portrait mode controls - hidden in landscape */}
          {!isLandscape && (
            <>
              {/* Playback Controls - Compact on mobile, expanded on desktop */}
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4">
                {/* Mobile compact layout */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={handlePlayPause}
                      disabled={!player}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors touch-manipulation flex-[2]"
                    >
                      {isPlaying ? 'Pause' : 'Play'}
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
                    
                    {/* Time display */}
                    <div className="text-gray-400 text-xs flex-1 text-center">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  
                  {/* Expanded speed options */}
                  {showSpeedOptions && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {speeds.filter(speed => speed !== playbackSpeed).map(speed => (
                        <button
                          key={speed}
                          onClick={() => {
                            handleSpeedChange(speed);
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

                {/* Desktop layout - unchanged */}
                <div className="hidden sm:block">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <button
                      onClick={handlePlayPause}
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
                          onClick={() => handleSpeedChange(speed)}
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

          {/* Segment Marking - Collapsible */}
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
                      onClick={() => handleSetStart(currentTime)}
                      disabled={!player}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors flex-1 sm:flex-none touch-manipulation"
                    >
                      Set Start
                    </button>
                    
                    <button
                      onClick={() => handleSetEnd(currentTime)}
                      disabled={!player || currentSegment.start === null}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors flex-1 sm:flex-none touch-manipulation"
                    >
                      Set End
                    </button>
                  </div>

                  {currentSegment.start !== null && (
                    <div className="text-sm text-gray-400">
                      Current segment start: {formatTime(currentSegment.start)}
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
                      onChange={(e) => setManualStart(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-3 sm:py-2 rounded w-24 sm:w-20 text-center text-base sm:text-sm touch-manipulation"
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="text"
                      placeholder="0:00"
                      value={manualEnd}
                      onChange={(e) => setManualEnd(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-3 sm:py-2 rounded w-24 sm:w-20 text-center text-base sm:text-sm touch-manipulation"
                    />
                    <button
                      onClick={() => handleManualSegment(duration)}
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
            </>
          )}
        </div>

        {/* Segments List - Hidden in landscape, order-1 on mobile so it appears before Tags */}
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
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Tags & Notes</h3>
            
            {/* Video Tags */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Video Tags</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {videoTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 sm:py-1 rounded-full text-sm touch-manipulation"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-300 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a tag (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-gray-700 text-white px-3 py-3 sm:py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm touch-manipulation"
              />
              <div className="text-xs text-gray-500 mt-1">
                e.g., "whip", "lindy hop", "advanced"
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="text-sm text-gray-400 mb-2">Notes</div>
              <textarea
                placeholder="Add notes about this video..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                className="w-full bg-gray-700 text-white px-3 py-3 sm:py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base sm:text-sm touch-manipulation"
                rows={4}
              />
              <div className="text-xs text-gray-500 mt-1">
                Notes save automatically when you click away
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
