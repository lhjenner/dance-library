export default function CreatePlaylistModal({ isOpen, title, onTitleChange, onCreate, onCancel, isCreating }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
        <h3 className="text-lg sm:text-xl font-bold mb-4">Create New Playlist</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCreate();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="Playlist title"
          className="w-full bg-gray-700 text-white px-4 py-3 sm:py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base touch-manipulation"
          autoFocus
        />
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 sm:py-2 rounded w-full sm:w-auto touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={!title.trim() || isCreating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded w-full sm:w-auto touch-manipulation"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
