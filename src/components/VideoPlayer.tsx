import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  className?: string;
  onReady?: (player: Player) => void;
}

export const VideoPlayer = (props: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const { src, className, onReady } = props;

  const getMimeType = (url: string) => {
    const u = url.toLowerCase();
    if (u.endsWith('.mp3')) return 'audio/mpeg';
    if (u.endsWith('.m4a')) return 'audio/mp4';
    if (u.endsWith('.wav')) return 'audio/wav';
    if (u.endsWith('.ogg')) return 'audio/ogg';
    return 'video/mp4';
  };

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Video.js player
    const player = playerRef.current = videojs(videoRef.current, {
      autoplay: false,
      controls: true,
      responsive: true,
      fluid: true,
      preload: 'auto',
      sources: [{ 
        src: src, 
        type: getMimeType(src)
      }]
    }, () => {
      // Callback after player is ready
      onReady && onReady(player);
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className={className} style={{ width: '100%' }}>
      <div data-vjs-player>
        <video 
          ref={videoRef} 
          className="video-js vjs-big-play-centered"
          playsInline 
        />
      </div>
    </div>
  );
}
