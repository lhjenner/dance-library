export default function PlaylistOrderErrorModal({ 
  isOpen, 
  onClose 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-red-500">Playlist Order Error</h3>
        <p className="text-gray-300 mb-4 text-sm sm:text-base">
          Before changing the order of the videos in this playlist, the playlist order on YouTube must be set to <span className="font-semibold">Manual</span>.
        </p>
        <p className="text-gray-400 mb-6 text-xs sm:text-sm">
          To fix this, go to YouTube, open this playlist, and select "Manual" from the dropdown at the top of the playlist.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 sm:py-2 rounded text-sm sm:text-base touch-manipulation"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
