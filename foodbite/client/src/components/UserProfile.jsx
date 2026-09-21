import React from 'react';

export default function UserProfile({ user, activePosts, onTriggerUpload }) {
  if (!user) return null;

  return (
    <div className="h-full w-full overflow-y-auto bg-black text-zinc-100 p-5 space-y-6">
      <div className="flex items-center space-x-4 pt-2">
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="w-20 h-20 rounded-full border-2 border-orange-500 p-0.5 object-cover"
        />
        <div>
          <h2 className="text-xl font-black text-white">{user.username}</h2>
          <p className="text-xs text-zinc-400">{user.email}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400">
            Ephemeral Food Creator
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950/40 border border-orange-500/30 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
              Daily Culinary Streak
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-black text-white">{user.streak}</span>
              <span className="text-xs font-bold text-zinc-400">Days Active</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-3xl animate-bounce">
            🔥
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {user.streak > 0 ? 'Streak preservation window:' : 'Streak expired:'}
          </span>
          <span className={`font-mono font-bold ${user.streak > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {user.streak > 0 ? user.hoursRemaining + 'h remaining' : 'Post to restart'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 flex items-center justify-center space-x-2 hover:from-orange-500 hover:to-amber-500 active:scale-95 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
        <span>Post New Food Story</span>
      </button>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Active 24H Stories ({activePosts ? activePosts.length : 0})
          </h3>
          <span className="text-[10px] text-zinc-500">Auto-purges after 24 hours</span>
        </div>

        {!activePosts || activePosts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-900 text-center">
            <p className="text-xs text-zinc-500">No active stories in the 24-hour window.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activePosts.map((post) => (
              <div
                key={post._id}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800"
              >
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt="Active post"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                  <span className="text-[10px] font-bold text-orange-400">
                    {post.mediaType === 'video' ? '🎬 Reel' : '📷 Photo'}
                  </span>
                  {post.caption && (
                    <span className="text-[10px] text-white line-clamp-1">{post.caption}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
