import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { getApiUrl, getMediaUrl } from '../lib/api';
import { VideoPlayer } from './VideoPlayer';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  alt: string;
  isLocal?: boolean;
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

import { NetflixRow } from './NetflixRow';

export function Gallery({ isUnlocked, onMediaClick }: { isUnlocked: boolean, onMediaClick: () => void }) {
  const [allItems, setAllItems] = useState<MediaItem[]>(DUMMY_CONTENT);
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: string; isLocal?: boolean } | null>(null);

  useEffect(() => {
    async function loadMedia() {
      try {
        let localList: MediaItem[] = [];
        let apiList: MediaItem[] = [];

        try {
          const localRes = await fetch('/media/media.json');
          if (localRes.ok) {
            localList = await localRes.json();
          }
        } catch (e) {
          console.warn("Sem media.json estático:", e);
        }

        try {
          const res = await fetch(getApiUrl('/api/media'));
          if (res.ok) {
            apiList = await res.json();
          }
        } catch (err) {
          console.error("Erro ao ler mídias da API dinâmica:", err);
        }

        const mergedMap = new Map<string, MediaItem>();

        if (Array.isArray(localList)) {
          localList.forEach(item => {
            if (item && item.url) {
              mergedMap.set(item.url, { ...item, isLocal: true });
            }
          });
        }

        if (Array.isArray(apiList)) {
          apiList.forEach(item => {
            if (item && item.url) {
              mergedMap.set(item.url, item);
            }
          });
        }

        const mergedList = Array.from(mergedMap.values()).filter(item => {
          const isFavicon = item.id.toLowerCase().startsWith('favicon') || item.url.toLowerCase().includes('favicon');
          return !isFavicon;
        });

        if (mergedList.length > 0) {
          setAllItems(mergedList);
        } else {
          setAllItems(DUMMY_CONTENT);
        }
      } catch (err) {
        console.error("Erro geral recuperando mídias:", err);
        setAllItems(DUMMY_CONTENT);
      }
    }
    loadMedia();
  }, []);

  const handleMediaOpen = (item: MediaItem) => {
    if (!isUnlocked) {
      onMediaClick();
    } else {
      setActiveMedia({ url: item.url, type: item.type, isLocal: item.isLocal });
    }
  };

  // Group items by category (mock categories for now based on index/type)
  const newestItems = allItems.slice(0, 6);
  const videosOnly = allItems.filter(i => i.type === 'video');
  const photosOnly = allItems.filter(i => i.type === 'photo');

  return (
    <div className="bg-black py-12 md:-mt-24 relative z-20">
      <div className="space-y-4">
        <NetflixRow 
          title="Em Alta Agora" 
          items={newestItems} 
          isUnlocked={isUnlocked} 
          onMediaClick={handleMediaOpen} 
        />
        
        <NetflixRow 
          title="Vídeos Exclusivos" 
          items={videosOnly} 
          isUnlocked={isUnlocked} 
          onMediaClick={handleMediaOpen} 
        />

        <NetflixRow 
          title="Minha Galeria de Fotos" 
          items={photosOnly} 
          isUnlocked={isUnlocked} 
          onMediaClick={handleMediaOpen} 
        />

        <NetflixRow 
          title="Adicionados Recentemente" 
          items={[...allItems].reverse()} 
          isUnlocked={isUnlocked} 
          onMediaClick={handleMediaOpen} 
        />
      </div>

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
                <VideoPlayer 
                  src={getMediaUrl(activeMedia.url, activeMedia.isLocal)}
                  className="w-full h-auto bg-black"
                />
              ) : (
                <img 
                  src={getMediaUrl(activeMedia.url, activeMedia.isLocal)} 
                  alt="Expanded view" 
                  className="max-w-full max-h-[90vh] object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
