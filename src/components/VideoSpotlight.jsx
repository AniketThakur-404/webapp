import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';

const VideoSpotlight = () => {
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef(null);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(!isMuted);
        }
    };

    const handleVideoPress = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <section className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-white/20 my-4 bg-black group">
            {/* Header / Badge */}
            <div className="absolute top-4 left-4 z-20">
                <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-white tracking-wider uppercase">Brand Spotlight</span>
                </div>
            </div>

            {/* Video Player */}
            <div
                className="relative aspect-video w-full cursor-pointer"
                onClick={handleVideoPress}
            >
                <video
                    ref={videoRef}
                    src="/brand.mp4"
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />

                {/* Play/Pause Overlay (only shows when paused) */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 transition-opacity">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center pl-1 border border-white/30">
                            <Play size={24} className="text-white fill-white" />
                        </div>
                    </div>
                )}

                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Controls & Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-between items-end pointer-events-none">
                <div className="pointer-events-auto">
                    <h3 className="text-white font-bold text-lg leading-tight">Brand Story</h3>
                    <p className="text-white/80 text-xs mt-0.5">Experience the journey.</p>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                    }}
                    className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all pointer-events-auto"
                >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
            </div>
        </section>
    );
};

export default VideoSpotlight;
