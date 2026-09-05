import React from 'react';

interface CommentaryFeedProps {
  commentary: string[];
}

export const CommentaryFeed: React.FC<CommentaryFeedProps> = ({ commentary }) => (
  <div className="panel p-5">
    <h3 className="rule-heading mb-4">Match commentary</h3>
    <div className="max-h-80 space-y-0 overflow-y-auto">
      {commentary.map((line, idx) => (
        <p
          key={idx}
          className="border-b border-line py-2.5 text-sm leading-relaxed text-ink-2 last:border-b-0"
        >
          {line}
        </p>
      ))}
    </div>
  </div>
);
