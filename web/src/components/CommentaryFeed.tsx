import React from 'react';

interface CommentaryFeedProps {
  commentary: string[];
}

export const CommentaryFeed: React.FC<CommentaryFeedProps> = ({ commentary }) => {
  return (
    <div className="card">
      <h3 className="text-lg font-bold text-primary mb-4">Match Commentary</h3>
      <div className="max-h-80 overflow-y-auto space-y-3">
        {commentary.map((line, idx) => (
          <p key={idx} className="text-sm text-text leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};
