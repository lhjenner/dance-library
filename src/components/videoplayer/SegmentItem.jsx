import { useState } from 'react';

export default function SegmentItem({ segment, index, onDelete, onPlay, onAddTag, onRemoveTag, formatTime }) {
  const [tagInput, setTagInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      onAddTag(tagInput);
      setTagInput('');
    }
  };

  return (
    <div className="bg-gray-700 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">Segment {index + 1}</span>
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          Delete
        </button>
      </div>
      
      <div className="text-sm text-gray-300 mb-2">
        {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
      </div>

      {/* Segment Tags */}
      {segment.tags && segment.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {segment.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-0.5 rounded text-xs"
            >
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Add tag..."
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />

      <button
        onClick={onPlay}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors"
      >
        Play Segment
      </button>
    </div>
  );
}
