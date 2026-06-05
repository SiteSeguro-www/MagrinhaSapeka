import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BellRing } from 'lucide-react';
import { cn } from '../lib/cn';
import { getApiUrl, getMediaUrl } from '../lib/api';

interface HeroProps {
  onActivate: () => void;
  isUnlocked: boolean;
}

export function Hero({ onActivate, isUnlocked }: HeroProps) {
  const [profileImg, setProfileImg] = useState<string>("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=800&fit=crop");
  const [isProfileImgLocal, setIsProfileImgLocal] = useState<boolean>(false);

  useEffect(() => {
    async function loadProfileConfig() {
      let profile_url = '';
      let is_url_local = false;

      try {
        const localRes = await fetch('/media/profile_config.json');
        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData && localData.profileImage) {
            profile_url = localData.profileImage;
            is_url_local = true;
          }
        }
      } catch (e) {
        console.warn("Sem profile_config.json estático:", e);
      }

      try {
        const res = await fetch(getApiUrl('/api/profile-config'));
        if (res.ok) {
          const data = await res.json();
          if (data && data.profileImage) {
            profile_url = data.profileImage;
            is_url_local = false;
          }
        }
      } catch (err) {
        console.error("Erro ao carregar imagem de perfil do servidor:", err);
      }

      if (profile_url) {
        setProfileImg(profile_url);
        setIsProfileImgLocal(is_url_local);
      }
    }
    loadProfileConfig();
  }, []);

  return (
    <section className="relative w-full h-[85vh] md:h-screen flex items-center md:items-end overflow-hidden">
      {/* Cinematic Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={getMediaUrl(profileImg, isProfileImgLocal)} 
          alt="Featured Background"
          className="w-full h-full object-cover"
        />
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-30 w-full max-w-7xl mx-auto px-4 md:px-8 pb-32 md:pb-64 pointer-events-none"
      >
        <div className="max-w-2xl pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="w-1 h-8 bg-primary rounded-full" />
            <span className="text-white font-black text-sm md:text-base uppercase tracking-[0.3em]">
              Série Original
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-4 leading-[0.9]">
            MAGRINHA<br />
            <span className="text-primary italic">SAPEKA</span>
          </h1>

          {!isUnlocked && (
            <p className="text-lg md:text-2xl text-gray-200 mb-8 font-medium max-w-lg leading-snug drop-shadow-lg">
              Ative as notificações para liberar acesso imediato a todas as fotos e vídeos exclusivos gratuitamente.
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            {!isUnlocked ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onActivate}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-md font-black text-lg md:text-xl transition-all shadow-2xl hover:bg-gray-200"
              >
                <BellRing size={24} />
                <span>ATIVAR NOTIFICAÇÕES</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-3 bg-primary/20 backdrop-blur-xl border border-primary/40 text-white px-8 py-4 rounded-md font-black text-lg md:text-xl shadow-2xl">
                <BellRing size={24} className="text-primary animate-pulse" />
                <span>ACESSO LIBERADO!</span>
              </div>
            )}
            
            <button className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-md font-bold text-lg hover:bg-white/30 transition-all border border-white/10">
              Saber mais
            </button>
          </div>
        </div>
      </motion.div>

      {/* Decorative Badge */}
      <div className="absolute top-24 right-8 hidden xl:block animate-fade-in">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition-all" />
          <img 
            src={getMediaUrl(profileImg, isProfileImgLocal)} 
            className="w-48 h-48 rounded-full border-2 border-white/20 relative z-10 object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            alt="Profile Avatar"
          />
        </div>
      </div>
    </section>
  );
}
