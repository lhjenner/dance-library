export default function MoveVideoModal({ 
  isOpen, 
  selectedCount, 
  playlists, 
  selectedPlaylist, 
  onSelectPlaylist, 
  onMove, 
  onCancel, 
  isOperating 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">
          Move {selectedCount} Video{selectedCount !== 1 ? 's' : ''}
        </h3>
        <p className="text-gray-400 mb-4">Select destination playlist:</p>
        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
              className={`w-full text-left px-4 py-3 rounded transition-colors ${
                selectedPlaylist === playlist.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold">{playlist.title}</div>
              <div className="text-sm opacity-75">{playlist.videoCount} videos</div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onMove}
            disabled={!selectedPlaylist || isOperating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
          >
            {isOperating ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  );
}
