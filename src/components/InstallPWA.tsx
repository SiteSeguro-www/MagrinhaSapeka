import { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWA } from '../hooks/usePWA';

export function InstallPWA() {
  const { isInstalled, isIOS, canInstall, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // If it's not installed yet, show the prompt after a short delay
    if (canInstall) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, canInstall]);

  const handleInstallClick = async () => {
    if (isIOS) return;
    await installApp();
    setIsVisible(false);
  };

  if (!isVisible || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-8 md:bottom-8 md:w-96"
      >
        <div className="bg-black/95 border border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.3)] rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
          {/* Background Highlight */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary to-primary/50 p-4 rounded-2xl shadow-lg shadow-primary/20">
              <Download className="text-white w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl text-white tracking-tight uppercase">Instalar App Oficial</h3>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Acesse mais rápido e receba alertas de novas fotos e vídeos exclusivos no seu celular.
              </p>
            </div>
          </div>

          {isIOS ? (
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-sm font-medium text-white text-center">Para instalar no seu iPhone:</p>
              <ol className="text-xs text-gray-300 space-y-3">
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">1</span>
                  <span>Toque no botão <Share2 className="inline-block mx-1 w-4 h-4 text-blue-400" /> (Compartilhar) na barra do Safari.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">2</span>
                  <span>Role para baixo e toque em <PlusSquare className="inline-block mx-1 w-4 h-4" /> "Adicionar à Tela de Início".</span>
                </li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-primary/30 text-lg"
            >
              <Download size={22} className="animate-bounce" />
              <span>INSTALAR AGORA</span>
            </button>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-black">
            <span className="w-8 h-[1px] bg-gray-800" />
            Galeria Exclusiva
            <span className="w-8 h-[1px] bg-gray-800" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
