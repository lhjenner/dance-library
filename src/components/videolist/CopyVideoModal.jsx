export default function CopyVideoModal({ 
  isOpen, 
  selectedCount, 
  playlists, 
  selectedPlaylists, 
  onTogglePlaylist, 
  onCopy, 
  onCancel, 
  isOperating 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">
          Copy {selectedCount} Video{selectedCount !== 1 ? 's' : ''}
        </h3>
        <p className="text-gray-400 mb-4">Select destination playlist(s):</p>
        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onTogglePlaylist(playlist.id)}
              className={`w-full text-left px-4 py-3 rounded transition-colors ${
                selectedPlaylists.includes(playlist.id)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{playlist.title}</div>
                  <div className="text-sm opacity-75">{playlist.videoCount} videos</div>
                </div>
                {selectedPlaylists.includes(playlist.id) && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
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
            onClick={onCopy}
            disabled={selectedPlaylists.length === 0 || isOperating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
          >
            {isOperating ? 'Copying...' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
