import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const YouTubeContext = createContext();

export function useYouTube() {
  const context = useContext(YouTubeContext);
  if (!context) {
    throw new Error('useYouTube must be used within a YouTubeProvider');
  }
  return context;
}

export function YouTubeProvider({ children }) {
  const authContext = useAuth();
  const user = authContext?.user;
  const [accessToken, setAccessToken] = useState(() => {
    // Try to restore token from localStorage
    if (user) {
      return localStorage.getItem(`youtube_token_${user.uid}`);
    }
    return null;
  });
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(() => {
    // Check if we have a stored token
    if (user) {
      return !!localStorage.getItem(`youtube_token_${user.uid}`);
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  // Restore token from localStorage when user changes
  useEffect(() => {
    if (user) {
      const storedToken = localStorage.getItem(`youtube_token_${user.uid}`);
      if (storedToken) {
        setAccessToken(storedToken);
        setIsYouTubeConnected(true);
      }
    } else {
      setAccessToken(null);
      setIsYouTubeConnected(false);
    }
  }, [user]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not defined');
      setIsLoading(false);
      return;
    }

    const initTokenClient = () => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: 'select_account',
          callback: (response) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              setIsYouTubeConnected(true);
              // Persist token to localStorage
              if (user) {
                localStorage.setItem(`youtube_token_${user.uid}`, response.access_token);
              }
            }
          },
        });
        setTokenClient(client);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing token client:', error);
        setIsLoading(false);
      }
    };

    if (window.google?.accounts?.oauth2) {
      initTokenClient();
    } else {
      // Wait for Google Identity Services to load
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      const checkGoogle = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkGoogle);
          initTokenClient();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkGoogle);
          console.error('Google Identity Services failed to load');
          setIsLoading(false);
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [user]);

  const connectYouTube = async () => {
    if (!tokenClient) {
      throw new Error('Token client not initialized');
    }
    tokenClient.requestAccessToken();
  };

  const disconnectYouTube = () => {
    setAccessToken(null);
    setIsYouTubeConnected(false);
    // Clear token from localStorage
    if (user) {
      localStorage.removeItem(`youtube_token_${user.uid}`);
    }
  };

  const makeYouTubeRequest = async (endpoint, params = {}) => {
    if (!accessToken) {
      throw new Error('YouTube not connected');
    }

    const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // If token is invalid or expired, clear it and prompt reconnection
    if (response.status === 401 || response.status === 403) {
      disconnectYouTube();
      throw new Error('YouTube access expired. Please reconnect.');
    }

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    return response.json();
  };

  const getPlaylists = async () => {
    const data = await makeYouTubeRequest('playlists', {
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 50,
    });

    return data.items || [];
  };

  const getPlaylistVideos = async (playlistId) => {
    let allVideos = [];
    let nextPageToken = null;

    do {
      const params = {
        part: 'snippet,contentDetails',
        playlistId: playlistId,
        maxResults: 50,
      };

      if (nextPageToken) {
        params.pageToken = nextPageToken;
      }

      const data = await makeYouTubeRequest('playlistItems', params);
      allVideos = allVideos.concat(data.items || []);
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return allVideos;
  };

  const createPlaylist = async (title, description = '') => {
    const url = 'https://www.googleapis.com/youtube/v3/playlists';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title: title,
          description: description,
        },
        status: {
          privacyStatus: 'private',
        },
      }),
      params: {
        part: 'snippet,status',
      },
    });

    if (response.status === 401 || response.status === 403) {
      disconnectYouTube();
      throw new Error('YouTube access expired. Please reconnect.');
    }

    if (!response.ok) {
      throw new Error(`Failed to create playlist: ${response.statusText}`);
    }

    return response.json();
  };

  const updatePlaylist = async (playlistId, title, description) => {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: playlistId,
        snippet: {
          title: title,
          description: description,
        },
      }),
    });

    if (response.status === 401 || response.status === 403) {
      disconnectYouTube();
      throw new Error('YouTube access expired. Please reconnect.');
    }

    if (!response.ok) {
      throw new Error(`Failed to update playlist: ${response.statusText}`);
    }

    return response.json();
  };

  const deletePlaylist = async (playlistId) => {
    const url = `https://www.googleapis.com/youtube/v3/playlists?id=${playlistId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      disconnectYouTube();
      throw new Error('YouTube access expired. Please reconnect.');
    }

    if (!response.ok) {
      throw new Error(`Failed to delete playlist: ${response.statusText}`);
    }

    return true;
  };

  const deleteVideoFromPlaylist = async (playlistItemId) => {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?id=${playlistItemId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      disconnectYouTube();
      throw new Error('YouTube access expired. Please reconnect.');
    }

    if (!response.ok) {
      throw new Error(`Failed to remove video: ${response.statusText}`);
    }

    return true;
  };

  const addVideoToPlaylist = async (playlistId, videoId) => {
    const url = 'https://www.googleapis.com/youtube/v3/playlistItems';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId,
          },
        },
      }),
      params: {
        part: 'snippet',
      },
    });

    if (response.status === 401 || response.status === 403) {
      disconnectYouTube();
      throw new Error('YouTube access expired. Please reconnect.');
    }

    if (!response.ok) {
      throw new Error(`Failed to add video to playlist: ${response.statusText}`);
    }

    return response.json();
  };

  const value = {
    isYouTubeConnected,
    isLoading,
    connectYouTube,
    disconnectYouTube,
    getPlaylists,
    getPlaylistVideos,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    deleteVideoFromPlaylist,
    addVideoToPlaylist,
  };

  return (
    <YouTubeContext.Provider value={value}>
      {children}
    </YouTubeContext.Provider>
  );
}
