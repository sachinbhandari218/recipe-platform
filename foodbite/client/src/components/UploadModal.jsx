import React, { useState } from 'react';

export default function UploadModal({ isOpen, onClose, userId, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50MB limit');
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    setErrorMessage('');
    const isVid = file.type.startsWith('video');
    setIsVideo(isVid);

    if (isVid) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        if (videoElement.duration > 10.05) {
          setErrorMessage('Video duration must be 10 seconds or less. Selected: ' + videoElement.duration.toFixed(1) + 's');
          setSelectedFile(null);
          setPreviewUrl('');
          return;
        }
        setDuration(videoElement.duration);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      };
      videoElement.src = objectUrl;
    } else {
      setDuration(0);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a photo or video under 10 seconds');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('userId', userId);
      formData.append('caption', caption);
      formData.append('duration', duration);

      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload story');
      }

      onUploadSuccess(data);
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 text-zinc-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 text-center">
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-black uppercase tracking-wider rounded-full bg-orange-950 text-orange-400 border border-orange-800/40">
            24H Ephemeral Story
          </span>
          <h3 className="text-xl font-black text-white tracking-tight">Share Food Story</h3>
          <p className="text-xs text-zinc-400 mt-1">Images or short videos up to 10s (max 50MB)</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-4 text-center hover:border-orange-500 transition-colors">
            {previewUrl ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black">
                {isVideo ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-orange-400">
                  {isVideo ? duration.toFixed(1) + 's / 10s' : 'Photo'}
                </span>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-zinc-300">Choose Photo or Video</span>
                <span className="text-[10px] text-zinc-500 mt-1">MP4, MOV, JPEG, PNG, WEBP</span>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, video/mp4, video/webm, video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Food Story Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What are you cooking or tasting?"
              maxLength={280}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedFile}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/20 hover:from-orange-500 hover:to-amber-500 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Posting Story...' : '🔥 Post Daily Food Story'}
          </button>
        </form>
      </div>
    </div>
  );
}
