import { useState } from 'react';

export default function RestoreErrorModal({ 
  isOpen, 
  onClose, 
  originalPlaylistName,
  videoIds,
  onRecreate,
  onSelectDifferent,
}) {
  const [isCreating, setIsCreating] = useState(false);
  
  if (!isOpen) return null;
  
  const handleRecreate = async () => {
    setIsCreating(true);
    try {
      await onRecreate(originalPlaylistName, videoIds);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-red-400">
          Playlist Not Found
        </h3>
        
        <p className="text-gray-300 mb-6 text-sm sm:text-base">
          The playlist <span className="font-semibold text-white">"{originalPlaylistName}"</span> no longer exists. 
          Would you like to recreate it or move the video(s) to a different playlist?
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRecreate}
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors touch-manipulation text-sm sm:text-base w-full"
          >
            {isCreating ? 'Creating...' : `Recreate "${originalPlaylistName}"`}
          </button>
          
          <button
            onClick={() => onSelectDifferent(videoIds)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors touch-manipulation text-sm sm:text-base w-full"
          >
            Select Different Playlist
          </button>
          
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors touch-manipulation text-sm sm:text-base w-full"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
