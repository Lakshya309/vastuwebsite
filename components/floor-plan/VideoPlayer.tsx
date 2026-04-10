"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FastForward,
  Rewind,
  X,
  ChevronDown,
  Expand,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPlayerProps {
  url: string;
  onClose?: () => void;
  title?: string;
  className?: string;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  onClose,
  title,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isModalFullScreen, setIsModalFullScreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleProgress = useCallback(() => {
    if (videoRef.current) {
      const current = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(current);
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>) => {
      if (!progressRef.current || !videoRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const time = clickPosition * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(clickPosition * 100);
    },
    []
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !videoRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const hoverPos = (e.clientX - rect.left) / rect.width;
      const hoverTimeValue = hoverPos * videoRef.current.duration;
      setHoverPosition(hoverPos * 100);
      setHoverTime(hoverTimeValue);
    },
    []
  );

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback(
    (val: number) => {
      setVolume(val);
      if (videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = val === 0;
        setIsMuted(val === 0);
      }
    },
    []
  );

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  }, []);

  const skip = useCallback((amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  }, []);

  const skipBackward = useCallback(() => skip(-10), [skip]);
  const skipForward = useCallback(() => skip(10), [skip]);

  const replay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setProgress(0);
    }
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);

    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", handleProgress);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", handleProgress);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [handleProgress]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Inline Video Player (for side panel)
  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full h-full bg-black rounded-xl overflow-hidden group flex flex-col ${className}`}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain bg-black"
          onClick={togglePlay}
        />

        {/* Full Screen Button */}
        <button
          onClick={() => setIsModalFullScreen(true)}
          className="absolute top-3 right-3 z-20 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Expand size={18} />
        </button>

        {/* Center Play Button */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-black/20"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="bg-teal-500/95 backdrop-blur-sm p-5 rounded-full shadow-2xl border border-white/20"
              >
                <Play size={40} className="text-white fill-current ml-1" />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 z-20"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              <div className="relative p-3 space-y-2">
                {/* Progress */}
                <div
                  ref={progressRef}
                  className="relative h-1 group/progress cursor-pointer"
                  onClick={handleSeek}
                  onMouseMove={handleProgressHover}
                  onMouseEnter={() => setIsHoveringProgress(true)}
                  onMouseLeave={() => setIsHoveringProgress(false)}
                >
                  {isHoveringProgress && hoverTime !== null && (
                    <div
                      className="absolute -top-8 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm text-white text-xs px-2 py-1 rounded"
                      style={{ left: `${hoverPosition}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-teal-400 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
                    style={{ left: `calc(${progress}% - 5px)` }}
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="text-white hover:text-teal-400 p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isPlaying ? (
                        <Pause size={20} fill="currentColor" />
                      ) : (
                        <Play size={20} fill="currentColor" />
                      )}
                    </button>
                    <button
                      onClick={() => skip(-10)}
                      className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Rewind size={16} />
                    </button>
                    <button
                      onClick={() => skip(10)}
                      className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <FastForward size={16} />
                    </button>

                    {/* Volume */}
                    <div
                      className="flex items-center gap-1 relative"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <button
                        onClick={toggleMute}
                        className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          showVolumeSlider ? "w-16 opacity-100" : "w-0 opacity-0"
                        }`}
                      >
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-full h-1 accent-teal-400 cursor-pointer"
                        />
                      </div>
                    </div>

                    <span className="text-white/70 text-xs font-mono tabular-nums ml-1">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Speed */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="text-white/70 hover:text-white px-2 py-0.5 hover:bg-white/10 rounded text-xs font-medium border border-white/20 hover:border-white/40 transition-colors"
                      >
                        {playbackRate}x
                      </button>
                      <AnimatePresence>
                        {showSpeedMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-1 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl overflow-hidden min-w-[70px]"
                          >
                            {PLAYBACK_RATES.map((rate) => (
                              <button
                                key={rate}
                                onClick={() => handlePlaybackRateChange(rate)}
                                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${
                                  playbackRate === rate ? "text-teal-400 bg-white/5" : "text-white/80"
                                }`}
                              >
                                {rate}x
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullScreen}
                      className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Screen Modal */}
      {isModalFullScreen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setIsModalFullScreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-7xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
                onMouseMove={showControlsTemporarily}
                onMouseLeave={handleMouseLeave}
              >
                <video
                  ref={videoRef}
                  src={url}
                  className="w-full aspect-video object-contain bg-black"
                  onClick={togglePlay}
                />
                <AnimatePresence>
                  {showControls && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-0 left-0 right-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                      <div className="relative p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                          </button>
                          <button onClick={skipBackward} className="text-white/80 hover:text-white transition-colors">
                            <Rewind size={20} />
                          </button>
                          <button onClick={skipForward} className="text-white/80 hover:text-white transition-colors">
                            <FastForward size={20} />
                          </button>
                          <span className="text-white text-sm font-mono">{formatTime(currentTime)}</span>
                          <div className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer" onClick={handleSeek}>
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-white/60 text-sm font-mono">{formatTime(duration)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="text-center mt-4">
                <h3 className="text-white text-lg font-medium">{title || "Video Analysis"}</h3>
                <p className="text-white/60 text-sm mt-1">Press ESC or click outside to close</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default VideoPlayer;
