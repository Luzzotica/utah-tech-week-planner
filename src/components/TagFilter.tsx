import React from 'react';

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function TagFilter({ tags, selectedTags, onTagToggle }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onTagToggle(tag)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}