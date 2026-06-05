import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
}

export function NotificationModal({ isOpen, onClose, onRequestPermission }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="glass w-full max-w-md rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell size={32} />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Para acessar os conteúdos gratuitos é necessário ativar as notificações. Sem isso, o conteúdo continuará bloqueado.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={onRequestPermission}
                className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
              >
                Ativar Notificações
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-border bg-transparent hover:bg-surface transition-colors"
              >
                Agora não
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
