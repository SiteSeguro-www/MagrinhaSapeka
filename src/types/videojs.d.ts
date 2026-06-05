import 'video.js';

declare module 'video.js' {
  interface Player {
    ima: (options: any) => void;
  }
}
