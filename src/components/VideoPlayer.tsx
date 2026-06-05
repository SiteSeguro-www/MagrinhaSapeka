import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads';
import 'videojs-ima';
import 'videojs-ima/dist/videojs.ima.css';

interface VideoPlayerProps {
  src: string;
  vastTag?: string;
  className?: string;
}

export function VideoPlayer({ src, vastTag, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Inicializa o player
    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{ src, type: 'video/mp4' }]
    }, () => {
      console.log('Player inicializado');

      if (vastTag) {
        (player as any).ima({
          adTagUrl: vastTag,
        });
        (player as any).ima.initializeAdDisplayContainer();
        player.requestAds();
      }
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [src, vastTag]);

  return (
    <div data-vjs-player className={className}>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
}
