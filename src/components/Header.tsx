import { useState, useEffect } from 'react';
import { Download, CheckCircle, Moon, Sun } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';

export function Header({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { isInstalled, canInstall, installApp } = usePWA();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 z-[100] w-full transition-colors duration-500",
      isScrolled ? "bg-black border-b border-white/10" : "bg-gradient-to-b from-black/80 to-transparent"
    )}>
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/media/favicon.png" alt="Magrinha Sapeka Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-lg text-[0px]" />
          <span className="font-black text-xl md:text-2xl text-white tracking-tighter uppercase italic">
            Galeria<span className="text-primary">Exclusiva</span>
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {isInstalled ? (
            <div className="hidden sm:flex items-center gap-2 text-green-500 font-medium text-[10px] bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              <CheckCircle size={14} />
              <span className="uppercase tracking-wider font-bold">App Instalado</span>
            </div>
          ) : (
            canInstall && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={installApp}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
              >
                <Download size={14} />
                <span>Instalar</span>
              </motion.button>
            )
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
