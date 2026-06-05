import { Download, CheckCircle, Moon, Sun } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { motion } from 'motion/react';

export function Header({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { isInstalled, canInstall, installApp } = usePWA();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/media/favicon.jpg" alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-bold hidden sm:inline-block text-white">Galeria Exclusiva</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {isInstalled ? (
            <div className="flex items-center gap-2 text-green-500 font-medium text-[10px] sm:text-xs bg-green-500/10 px-2 sm:px-3 py-1 rounded-full border border-green-500/20">
              <CheckCircle size={14} />
              <span className="uppercase tracking-wider font-bold">App Instalado</span>
            </div>
          ) : (
            canInstall && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={installApp}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
              >
                <Download size={14} />
                <span>Instalar</span>
              </motion.button>
            )
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
