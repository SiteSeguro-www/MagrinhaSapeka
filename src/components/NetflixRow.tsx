import { useRef } from 'react';
import { motion } from 'motion/react';
import { Lock, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import { getMediaUrl } from '../lib/api';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  alt: string;
  isLocal?: boolean;
}

interface NetflixRowProps {
  title: string;
  items: MediaItem[];
  isUnlocked: boolean;
  onMediaClick: (item: MediaItem) => void;
}

export function NetflixRow({ title, items, isUnlocked, onMediaClick }: NetflixRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-8 md:mb-12 relative group">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 md:px-8 tracking-tight">
        {title}
      </h2>

      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-20 bg-black/50 w-10 md:w-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-white"
        >
          <ChevronLeft size={32} />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-2 md:gap-3 overflow-x-auto overflow-y-hidden px-4 md:px-12 netflix-row scroll-smooth snap-x no-scrollbar"
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              onClick={() => onMediaClick(item)}
              className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[280px] aspect-video relative rounded-md overflow-hidden cursor-pointer snap-start bg-zinc-900 border border-white/5"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              
              {item.type === 'video' ? (
                <video 
                  src={getMediaUrl(item.url, item.isLocal)} 
                  className={cn(
                    "w-full h-full object-cover",
                    !isUnlocked && "blur-xl"
                  )}
                  muted
                  playsInline
                />
              ) : (
                <img 
                  src={getMediaUrl(item.url, item.isLocal)} 
                  alt={item.alt}
                  className={cn(
                    "w-full h-full object-cover",
                    !isUnlocked && "blur-xl"
                  )}
                />
              )}

              {!isUnlocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <Lock size={20} className="text-white mb-2" />
                  <span className="text-[10px] uppercase font-bold text-white tracking-widest">Restrito</span>
                </div>
              )}

              {isUnlocked && (
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2">
                  {item.type === 'video' && <Play size={14} className="text-primary fill-primary" />}
                  <span className="text-[10px] text-white/80 font-medium truncate max-w-[120px]">
                    {item.alt || 'Conteúdo Exclusivo'}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 bg-black/50 w-10 md:w-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-white"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
}
