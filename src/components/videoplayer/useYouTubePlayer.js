import { useState, useEffect, useRef } from 'react';

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

export default function useYouTubePlayer(videoId) {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  // Load YouTube API and initialize player
  useEffect(() => {
    let mounted = true;

    const initPlayer = async () => {
      await loadYouTubeAPI();
      
      if (!mounted) return;

      const newPlayer = new window.YT.Player(playerRef.current, {
        videoId: videoId,
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
  }, [videoId]);

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

  return {
    player,
    playerRef,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    loading,
    handlePlayPause,
    handleSpeedChange,
    handlePlaySegment,
  };
}
