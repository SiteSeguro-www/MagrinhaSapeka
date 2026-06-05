import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  className?: string;
  onReady?: (player: Player) => void;
}

export const VideoPlayer = (props: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const { src, className, onReady } = props;

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video");
      videoElement.classList.add('video-js', 'vjs-big-play-centered', 'vjs-theme-city');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        muted: true, // Required for autoplay in most browsers
        preload: 'auto',
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'liveDisplay',
            'remainingTimeDisplay',
            'customControlSpacer',
            'playbackRateMenuButton',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'audioTrackButton',
            'fullscreenToggle'
          ]
        },
        sources: [{
          src: src,
          type: 'video/mp4'
        }]
      }, () => {
        onReady && onReady(player);
      });

      player.on('error', () => {
        const error = player.error();
        console.error('VideoJS Error:', error);
      });

    } else if (playerRef.current) {
      const player = playerRef.current;
      player.src({ src, type: 'video/mp4' });
      player.load();
      player.play().catch(e => console.log("Autoplay blocked or failed:", e));
    }
  }, [src]);

  // Dispose the player on unmount
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} />
    </div>
  );
}
