export default function DeleteVideoModal({ 
  isOpen, 
  videoTitle, 
  onConfirm, 
  onCancel, 
  isDeleting 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
        <h3 className="text-lg sm:text-xl font-bold mb-4">Remove Video</h3>
        <p className="text-gray-300 mb-6 text-sm sm:text-base">
          Are you sure you want to remove <span className="font-semibold">"{videoTitle}"</span> from this playlist?
        </p>
        <div className="flex justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white px-4 py-3 sm:py-2 rounded text-sm sm:text-base touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded text-sm sm:text-base touch-manipulation"
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
