import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortablePlaylistItem({ playlist, onClick, onRename, onDelete, isEditing, editTitle, setEditTitle, onSaveRename }) {
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

  const handleClick = (e) => {
    // Don't trigger click if dragging
    if (isDragging) return;
    // Don't trigger click if clicking the drag handle or action buttons
    if (e.target.closest('[data-drag-handle]') || e.target.closest('[data-action]')) return;
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className="bg-gray-800 rounded-lg px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 hover:bg-gray-750 transition-colors cursor-pointer touch-manipulation"
    >
      <button
        {...attributes}
        {...listeners}
        data-drag-handle
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white p-1 touch-manipulation"
        aria-label="Drag to reorder"
      >
        <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2" data-action>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveRename();
                if (e.key === 'Escape') setEditTitle('');
              }}
              className="flex-1 bg-gray-700 text-white px-3 py-2 sm:py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base touch-manipulation"
              autoFocus
            />
            <button
              onClick={onSaveRename}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:py-1 rounded text-sm touch-manipulation"
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-base sm:text-lg truncate">{playlist.title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
      {!isEditing && (
        <div className="flex items-center gap-1 sm:gap-2" data-action>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="text-gray-400 hover:text-white p-2 sm:px-2 sm:py-1 touch-manipulation"
            title="Rename playlist"
          >
            <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-400 hover:text-red-300 p-2 sm:px-2 sm:py-1 touch-manipulation"
            title="Delete playlist"
          >
            <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
