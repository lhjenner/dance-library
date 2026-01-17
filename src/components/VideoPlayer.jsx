import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';

// Load YouTube IFrame API
const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  });
};

export default function VideoPlayer({ video, onBack }) {
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [segments, setSegments] = useState([]);
  const [currentSegment, setCurrentSegment] = useState({ start: null, end: null });
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const playerRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  // Load YouTube API and initialize player
  useEffect(() => {
    let mounted = true;

    const initPlayer = async () => {
      await loadYouTubeAPI();
      
      if (!mounted) return;

      const newPlayer = new window.YT.Player(playerRef.current, {
        videoId: video.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            setDuration(event.target.getDuration());
            setLoading(false);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    initPlayer();

    return () => {
      mounted = false;
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      if (player) {
        player.destroy();
      }
    };
  }, [video.youtubeId]);

  // Update current time while playing
  useEffect(() => {
    if (isPlaying && player) {
      timeUpdateInterval.current = setInterval(() => {
        const time = player.getCurrentTime();
        setCurrentTime(time);
      }, 100);
    } else {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [isPlaying, player]);

  // Load segments from Firestore
  useEffect(() => {
    const loadSegments = async () => {
      try {
        const videoDoc = doc(db, 'videos', video.id);
        const segmentsRef = collection(videoDoc, 'segments');
        const q = query(segmentsRef);
        const querySnapshot = await getDocs(q);
        
        const loadedSegments = [];
        querySnapshot.forEach((doc) => {
          loadedSegments.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by start time
        loadedSegments.sort((a, b) => a.startTime - b.startTime);
        setSegments(loadedSegments);
      } catch (err) {
        console.error('Error loading segments:', err);
      }
    };

    loadSegments();
  }, [video.id, user.uid]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleSpeedChange = (speed) => {
    if (!player) return;
    player.setPlaybackRate(speed);
    setPlaybackSpeed(speed);
  };

  const handleSetStart = () => {
    setCurrentSegment({ ...currentSegment, start: currentTime });
    setManualStart(formatTime(currentTime));
  };

  const handleSetEnd = async () => {
    const endTime = currentTime;
    
    if (currentSegment.start === null) {
      alert('Please set a start time first');
      return;
    }
    
    if (endTime <= currentSegment.start) {
      alert('End time must be after start time');
      return;
    }

    await saveSegment(currentSegment.start, endTime);
  };

  const parseTime = (timeString) => {
    // Parse MM:SS or M:SS format
    const parts = timeString.split(':');
    if (parts.length !== 2) return null;
    
    const mins = parseInt(parts[0]);
    const secs = parseInt(parts[1]);
    
    if (isNaN(mins) || isNaN(secs) || secs >= 60 || mins < 0 || secs < 0) {
      return null;
    }
    
    return mins * 60 + secs;
  };

  const handleManualSegment = async () => {
    const startTime = parseTime(manualStart);
    const endTime = parseTime(manualEnd);
    
    if (startTime === null) {
      alert('Invalid start time. Use format MM:SS (e.g., 1:30)');
      return;
    }
    
    if (endTime === null) {
      alert('Invalid end time. Use format MM:SS (e.g., 2:45)');
      return;
    }
    
    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }
    
    if (endTime > duration) {
      alert('End time cannot exceed video duration');
      return;
    }

    await saveSegment(startTime, endTime);
    setManualStart('');
    setManualEnd('');
  };

  const saveSegment = async (startTime, endTime) => {
    // Save segment to Firestore
    try {
      const videoDoc = doc(db, 'videos', video.id);
      const segmentsRef = collection(videoDoc, 'segments');
      const newSegmentRef = doc(segmentsRef);
      
      const segmentData = {
        startTime: startTime,
        endTime: endTime,
        createdAt: new Date(),
      };
      
      await setDoc(newSegmentRef, segmentData);
      
      // Add to local state
      setSegments([...segments, { id: newSegmentRef.id, ...segmentData }].sort((a, b) => a.startTime - b.startTime));
      
      // Reset current segment
      setCurrentSegment({ start: null, end: null });
      setManualStart('');
      setManualEnd('');
    } catch (err) {
      console.error('Error saving segment:', err);
      alert('Failed to save segment');
    }
  };

  const handlePlaySegment = (segment) => {
    if (!player) return;
    
    player.seekTo(segment.startTime, true);
    player.playVideo();
    
    // Stop at end time
    const checkTime = setInterval(() => {
      const time = player.getCurrentTime();
      if (time >= segment.endTime) {
        player.pauseVideo();
        clearInterval(checkTime);
      }
    }, 100);
  };

  const handleDeleteSegment = async (segmentId) => {
    try {
      const videoDoc = doc(db, 'videos', video.id);
      const segmentDoc = doc(videoDoc, 'segments', segmentId);
      await deleteDoc(segmentDoc);
      
      setSegments(segments.filter(s => s.id !== segmentId));
    } catch (err) {
      console.error('Error deleting segment:', err);
      alert('Failed to delete segment');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Videos
      </button>

      {/* Video Title */}
      <h2 className="text-2xl font-bold mb-6">{video.title}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
            <div ref={playerRef} className="w-full aspect-video"></div>
          </div>

          {/* Playback Controls */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePlayPause}
                disabled={!player}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <div className="text-gray-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Speed Controls */}
            <div>
              <div className="text-sm text-gray-400 mb-2">Playback Speed</div>
              <div className="flex gap-2 flex-wrap">
                {speeds.map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-3 py-1 rounded transition-colors ${
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

          {/* Segment Marking */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Mark Segment</h3>
            
            {/* Click-based marking */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Click to Mark</div>
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={handleSetStart}
                  disabled={!player}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Set Start
                </button>
                
                <button
                  onClick={handleSetEnd}
                  disabled={!player || currentSegment.start === null}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
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
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="0:00"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded w-20 text-center"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="text"
                  placeholder="0:00"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded w-20 text-center"
                />
                <button
                  onClick={handleManualSegment}
                  disabled={!manualStart || !manualEnd}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Example: 1:30 for 1 minute 30 seconds
              </div>
            </div>
          </div>
        </div>

        {/* Segments List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              Segments ({segments.length})
            </h3>

            {segments.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No segments yet. Mark segments using the controls on the left.
              </p>
            ) : (
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="bg-gray-700 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Segment {index + 1}</span>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                    </div>
                    <button
                      onClick={() => handlePlaySegment(segment)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors"
                    >
                      Play Segment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
