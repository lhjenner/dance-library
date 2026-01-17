import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PreferencesContext = createContext();

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

const DEFAULT_PREFERENCES = {
  defaultPlaybackSpeed: 1,
  showEmptyPlaylists: false,
  lastAccessedPlaylistId: null,
};

export function PreferencesProvider({ children }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from Firestore
  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...docSnap.data() });
        } else {
          setPreferences(DEFAULT_PREFERENCES);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences to Firestore
  const savePreferences = async (newPreferences) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'userPreferences', user.uid);
      await setDoc(docRef, newPreferences, { merge: true });
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const updatePreference = async (key, value) => {
    await savePreferences({ [key]: value });
  };

  const value = {
    preferences,
    loading,
    updatePreference,
    savePreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
