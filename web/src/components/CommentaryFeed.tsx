import React from 'react';

interface CommentaryFeedProps {
  commentary: string[];
}

export const CommentaryFeed: React.FC<CommentaryFeedProps> = ({ commentary }) => {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md">
      <h3 className="text-lg font-bold text-white mb-4">Match Commentary</h3>
      <div className="max-h-80 overflow-y-auto space-y-3">
        {commentary.map((line, idx) => (
          <p key={idx} className="text-sm text-white/90 leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};
