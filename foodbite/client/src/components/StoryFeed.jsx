import React, { useState, useEffect, useRef } from 'react';

export default function StoryFeed({ posts, onTriggerUpload }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef({});

  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const vid = videoRefs.current[key];
      if (vid) {
        if (parseInt(key, 10) === activeIndex) {
          vid.currentTime = 0;
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      }
    });
  }, [activeIndex]);

  const handleScroll = (e) => {
    const container = e.currentTarget;
    const itemHeight = container.clientHeight;
    const index = Math.round(container.scrollTop / itemHeight);
    if (index !== activeIndex && index >= 0 && index < posts.length) {
      setActiveIndex(index);
    }
  };

  const calculateHoursLeft = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const expiresTime = createdTime + 24 * 60 * 60 * 1000;
    const remainingMs = expiresTime - Date.now();
    if (remainingMs <= 0) return 'Expiring';
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours + 'h ' + mins + 'm left';
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-black text-zinc-300">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl mb-4">
          🌮
        </div>
        <h3 className="text-xl font-black text-white">No Stories Right Now</h3>
        <p className="text-xs text-zinc-500 mt-2 max-w-xs">
          All food stories expire automatically after 24 hours. Be the first to share what you are cooking today!
        </p>
        <button
          type="button"
          onClick={onTriggerUpload}
          className="mt-6 px-6 py-3 rounded-2xl bg-orange-600 text-white text-xs font-black uppercase tracking-wider hover:bg-orange-500"
        >
          🔥 Post Food Story
        </button>
      </div>
    );
  }

  return (
    <div
      onScroll={handleScroll}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-none"
    >
      {posts.map((post, idx) => {
        const isCurrent = idx === activeIndex;
        return (
          <div
            key={post._id || idx}
            className="relative h-full w-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden"
          >
            <div className="absolute top-3 left-4 right-4 z-20 flex space-x-1.5">
              <div className="h-1 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full bg-orange-500 transition-all duration-300 ${
                    isCurrent ? 'w-full animate-pulse' : idx < activeIndex ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
              {post.mediaType === 'video' ? (
                <video
                  ref={(el) => (videoRefs.current[idx] = el)}
                  src={post.mediaUrl}
                  playsInline
                  loop
                  muted={false}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt={post.caption || 'Food story'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 p-5 bg-gradient-to-t from-black via-black/50 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={post.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={post.username}
                    className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-black text-white tracking-wide">{post.username}</h4>
                    <span className="text-[11px] font-semibold text-orange-400 flex items-center space-x-1">
                      <span>⏳</span>
                      <span>{calculateHoursLeft(post.createdAt)}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-white hover:text-orange-400 backdrop-blur-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {post.caption && (
                <p className="text-xs text-zinc-200 leading-snug line-clamp-2">
                  {post.caption}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
