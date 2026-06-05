import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

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
    });

    playerRef.current = player;

    // Nota: VAST requer plugins específicos de terceiros como videojs-vast-vpaid
    // Essa é uma implementação base para o player
    if (vastTag) {
      console.log('VAST tag configurada (requer plugin de terceiros):', vastTag);
      // Aqui seria a integração com o plugin de anúncios
    }

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
