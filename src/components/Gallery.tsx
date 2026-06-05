import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { getApiUrl, getMediaUrl } from '../lib/api';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  alt: string;
}

// Fallback caso não tenha nada na pasta ainda
const DUMMY_CONTENT: MediaItem[] = [
  { id: '1', type: 'photo', url: 'https://images.unsplash.com/photo-1518104593124-ac2e69bb0665?q=80&w=800&auto=format&fit=crop', alt: 'Portrait 1' },
  { id: '2', type: 'photo', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop', alt: 'Portrait 2' },
  { id: '3', type: 'video', url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?q=80&w=800&auto=format&fit=crop', alt: 'Video thumbnail 1' },
  { id: '4', type: 'photo', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop', alt: 'Portrait 3' },
  { id: '5', type: 'photo', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop', alt: 'Portrait 4' },
  { id: '6', type: 'video', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop', alt: 'Video thumbnail 2' },
];

const ITEMS_PER_PAGE = 6;

export function Gallery({ isUnlocked, onMediaClick }: { isUnlocked: boolean, onMediaClick: () => void }) {
  const [allItems, setAllItems] = useState<MediaItem[]>(DUMMY_CONTENT);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: string } | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Busca as mídias de verdade no servidor Express
  useEffect(() => {
    async function loadMedia() {
      try {
        const res = await fetch(getApiUrl('/api/media'));
        if (res.ok) {
          const data: MediaItem[] = await res.json();
          if (data && data.length > 0) {
            setAllItems(data);
          } else {
            setAllItems(DUMMY_CONTENT);
          }
        }
      } catch (err) {
        console.error("Erro ao ler mídias da API:", err);
        setAllItems(DUMMY_CONTENT);
      }
    }
    loadMedia();
  }, []);

  // Implementação do Infinite Scroll (Página Infinita)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && displayedCount < allItems.length) {
        setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, allItems.length));
      }
    }, {
      rootMargin: '120px', // Carrega novos itens um pouco antes para suavidade total
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [displayedCount, allItems.length]);

  const displayedItems = allItems.slice(0, displayedCount);
  const hasMore = displayedCount < allItems.length;

  const handleMediaOpen = (item: MediaItem) => {
    if (!isUnlocked) {
      onMediaClick();
    } else {
      setActiveMedia({ url: item.url, type: item.type });
    }
  };

  return (
    <>
      <section className="w-full max-w-7xl mx-auto p-4 md:p-8" id="gallery">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 auto-rows-[300px]">
          {displayedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              onClick={() => handleMediaOpen(item)}
              className={cn(
                "relative overflow-hidden rounded-2xl group cursor-pointer glass border border-white/5",
                index % 4 === 0 ? "md:col-span-2 md:row-span-2" : ""
              )}
            >
              <div className="absolute inset-0 bg-muted/20 animate-pulse -z-10" />
              
              {item.type === 'video' ? (
                <video 
                  src={getMediaUrl(item.url)} 
                  muted 
                  loop 
                  playsInline
                  autoPlay={false}
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-700",
                    isUnlocked ? "group-hover:scale-105" : "blur-xl scale-110",
                  )}
                  onMouseOver={(e) => isUnlocked && e.currentTarget.play()}
                  onMouseOut={(e) => isUnlocked && e.currentTarget.pause()}
                />
              ) : (
                <img 
                  src={getMediaUrl(item.url)} 
                  alt={item.alt}
                  loading="lazy"
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-700",
                    isUnlocked ? "group-hover:scale-105" : "blur-xl scale-110",
                  )}
                />
              )}

              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-[4px] transition-all group-hover:bg-black/60">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <Lock size={28} />
                  </div>
                  <span className="font-bold tracking-wide uppercase text-sm">Desbloquear acesso</span>
                </div>
              )}

              {isUnlocked && item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90">
                    <Play size={28} className="translate-x-0.5" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Elemento observador do Infinite Scroll */}
        <div ref={loaderRef} className="w-full h-20 flex items-center justify-center mt-8">
          {hasMore && (
            <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
          )}
        </div>
      </section>

      {/* Lightbox / Video Player Modal ampliado */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveMedia(null)}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <button 
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[210]"
              onClick={() => setActiveMedia(null)}
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden glass shadow-2xl flex items-center justify-center"
            >
              {activeMedia.type === 'video' ? (
                <video 
                  src={getMediaUrl(activeMedia.url)} 
                  controls 
                  autoPlay 
                  playsInline
                  className="max-w-full max-h-[90vh] object-contain bg-black"
                />
              ) : (
                <img 
                  src={getMediaUrl(activeMedia.url)} 
                  alt="Expanded view" 
                  className="max-w-full max-h-[90vh] object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
