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
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState(null);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!user) return;

    const initTokenClient = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/youtube',
        prompt: 'select_account', // Force account selection
        callback: (response) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsYouTubeConnected(true);
          }
        },
      });
      setTokenClient(client);
      setIsLoading(false);
    };

    if (window.google && window.google.accounts) {
      initTokenClient();
    } else {
      // Wait for Google Identity Services to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkGoogle);
          initTokenClient();
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

  const value = {
    isYouTubeConnected,
    isLoading,
    connectYouTube,
    disconnectYouTube,
    getPlaylists,
    getPlaylistVideos,
  };

  return (
    <YouTubeContext.Provider value={value}>
      {children}
    </YouTubeContext.Provider>
  );
}
