import { useState, useEffect } from 'react';
import { useYouTube } from '../contexts/YouTubeContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePlaylistItem({ playlist }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: playlist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-4 hover:bg-gray-750 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg truncate">{playlist.title}</h3>
        <p className="text-gray-400 text-sm">
          {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

function Playlists() {
  const { user } = useAuth();
  const { isYouTubeConnected, connectYouTube, getPlaylists, isLoading } = useYouTube();
  const [playlists, setPlaylists] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleConnectYouTube = async () => {
    try {
      setError(null);
      await connectYouTube();
    } catch (err) {
      setError('Failed to connect YouTube. Please try again.');
      console.error(err);
    }
  };

  const syncPlaylists = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      // Fetch playlists from YouTube
      const youtubePlaylists = await getPlaylists();
      
      // Get existing playlists to preserve order
      const playlistsRef = collection(db, 'playlists');
      const q = query(playlistsRef, where('userId', '==', user.uid));
      const existingSnapshot = await getDocs(q);
      
      const existingOrders = {};
      let maxOrder = 0;
      existingSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.order !== undefined) {
          existingOrders[doc.id] = data.order;
          maxOrder = Math.max(maxOrder, data.order);
        }
      });
      
      // Save to Firestore
      for (let i = 0; i < youtubePlaylists.length; i++) {
        const playlist = youtubePlaylists[i];
        const playlistData = {
          id: playlist.id,
          userId: user.uid,
          youtubeId: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          thumbnail: playlist.snippet.thumbnails?.medium?.url || '',
          videoCount: playlist.contentDetails.itemCount,
          lastSynced: new Date(),
          order: existingOrders[playlist.id] !== undefined ? existingOrders[playlist.id] : maxOrder + i + 1,
        };
        
        await setDoc(doc(playlistsRef, playlist.id), playlistData);
      }
      
      // Fetch from Firestore to display
      await loadPlaylists();
    } catch (err) {
      setError('Failed to sync playlists. Please try again.');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const playlistsRef = collection(db, 'playlists');
      const q = query(playlistsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const loadedPlaylists = [];
      querySnapshot.forEach((doc) => {
        loadedPlaylists.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by order field
      loadedPlaylists.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setPlaylists(loadedPlaylists);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = playlists.findIndex((p) => p.id === active.id);
      const newIndex = playlists.findIndex((p) => p.id === over.id);

      const newPlaylists = arrayMove(playlists, oldIndex, newIndex);
      
      // Update order values
      const updatedPlaylists = newPlaylists.map((playlist, index) => ({
        ...playlist,
        order: index,
      }));
      
      setPlaylists(updatedPlaylists);

      // Save new order to Firestore
      try {
        for (const playlist of updatedPlaylists) {
          const playlistRef = doc(db, 'playlists', playlist.id);
          await updateDoc(playlistRef, { order: playlist.order });
        }
      } catch (err) {
        console.error('Error saving playlist order:', err);
        setError('Failed to save playlist order. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (isYouTubeConnected && user) {
      loadPlaylists();
      // Auto-sync on load
      syncPlaylists();
    } else if (!isYouTubeConnected && !isLoading && user) {
      // Auto-connect YouTube when user logs in
      handleConnectYouTube();
    }
  }, [isYouTubeConnected, user, isLoading]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading YouTube integration...</div>
      </div>
    );
  }

  if (!isYouTubeConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Connect Your YouTube Account</h2>
          <p className="text-gray-400 mb-6">
            Connect your YouTube account to access your playlists and start organizing your dance videos.
          </p>
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <button
            onClick={handleConnectYouTube}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Connect YouTube
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Playlists</h2>
        <button
          onClick={syncPlaylists}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          {syncing ? 'Syncing...' : 'Sync Playlists'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 mb-4">No playlists found. Click "Sync Playlists" to load your YouTube playlists.</p>
        </div>
      ) : (
        <div className="max-w-3xl">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={playlists.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <SortablePlaylistItem key={playlist.id} playlist={playlist} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default Playlists;
