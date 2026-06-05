import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BellRing } from 'lucide-react';
import { cn } from '../lib/cn';
import { getApiUrl, getMediaUrl } from '../lib/apiConfig';

interface HeroProps {
  onActivate: () => void;
  isUnlocked: boolean;
}

export function Hero({ onActivate, isUnlocked }: HeroProps) {
  const [profileImg, setProfileImg] = useState<string>("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop");

  useEffect(() => {
    async function loadProfileConfig() {
      try {
        const res = await fetch(getApiUrl('/api/profile-config'));
        if (res.ok) {
          const data = await res.json();
          if (data && data.profileImage) {
            setProfileImg(getMediaUrl(data.profileImage));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar imagem de perfil do servidor:", err);
      }
    }
    loadProfileConfig();
  }, []);

  return (
    <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background elegant gradient fx */}
      <div className="absolute inset-0 pointer-events-none w-full h-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto flex flex-col items-center pt-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-2xl relative z-10 glass ring-4 ring-primary/20">
            <img 
              src={profileImg} 
              alt="Magrinha Sapeka"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-primary/40 rounded-full blur-[30px] -z-10 animate-pulse"></div>
        </motion.div>

        <span className="px-4 py-1.5 rounded-full glass text-sm font-semibold text-primary mb-6 uppercase tracking-wider">
          Conteúdo Exclusivo
        </span>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
          <span className="block">Magrinha Sapeka</span>
          {!isUnlocked && (
            <span className="block text-2xl md:text-4xl font-medium mt-4 text-foreground/80">
              ATIVE AS NOTIFICAÇÕES PARA VER MEUS CONTEÚDOS GRATUITAMENTE
            </span>
          )}
        </h1>

        {!isUnlocked && (
          <>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Sempre que eu publicar algo novo você será avisado e poderá acessar meus conteúdos gratuitamente.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onActivate}
              className="flex items-center gap-3 bg-primary text-white px-8 py-5 rounded-2xl font-bold text-xl md:text-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all"
            >
              <BellRing size={28} />
              <span>ATIVAR NOTIFICAÇÕES</span>
            </motion.button>
          </>
        )}
        
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-primary mt-4 font-semibold text-xl md:text-2xl flex items-center gap-3 glass px-8 py-4 rounded-xl"
          >
            <BellRing size={28} />
            Acesso Liberado! Aproveite o conteúdo.
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
