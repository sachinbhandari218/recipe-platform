import React, { useState, useEffect } from 'react';
import StoryFeed from './components/StoryFeed';
import UserProfile from './components/UserProfile';
import UploadModal from './components/UploadModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userActivePosts, setUserActivePosts] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const demoUserId = '65fa1a2b3c4d5e6f7a8b9c0d';

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/' + demoUserId);
      const data = await res.json();
      if (data.success) {
        setUserData(data.user);
        setUserActivePosts(data.activePosts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchProfile();
  }, []);

  const handleUploadSuccess = () => {
    fetchFeed();
    fetchProfile();
    setCurrentTab('feed');
  };

  return (
    <div className="w-screen h-screen bg-zinc-950 flex justify-center items-center overflow-hidden">
      <main className="w-full h-full max-w-md bg-black relative flex flex-col shadow-2xl border-x border-zinc-900">
        <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center space-x-2 pointer-events-auto">
            <span className="text-xl">🔥</span>
            <h1 className="text-sm font-black tracking-tighter text-white uppercase">FoodBite</h1>
          </div>
          {userData && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-black text-orange-400 pointer-events-auto backdrop-blur-md">
              <span>🔥</span>
              <span>{userData.streak}</span>
            </div>
          )}
        </header>

        <section className="flex-1 w-full h-full overflow-hidden pt-12 pb-16">
          {currentTab === 'feed' ? (
            <StoryFeed
              posts={posts}
              onTriggerUpload={() => setIsUploadOpen(true)}
            />
          ) : (
            <UserProfile
              user={userData}
              activePosts={userActivePosts}
              onTriggerUpload={() => setIsUploadOpen(true)}
            />
          )}
        </section>

        <nav className="absolute bottom-0 inset-x-0 z-30 h-16 bg-zinc-950/90 border-t border-zinc-900 flex items-center justify-around px-6 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => setCurrentTab('feed')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentTab === 'feed' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[10px] font-bold">Feed</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/40 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentTab === 'profile' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </nav>

        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          userId={demoUserId}
          onUploadSuccess={handleUploadSuccess}
        />
      </main>
    </div>
  );
}
