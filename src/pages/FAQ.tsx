import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

const FAQS = [
  {
     q: "Como acessar o conteúdo bloqueado?",
     a: "É muito simples! Basta clicar no botão vermelho 'Ativar Notificações' na nossa página inicial e depois confirmar 'Permitir' no alerta que vai aparecer na tela do seu celular ou PC. O conteúdo é liberado no mesmo exato segundo de forma 100% gratuita."
  },
  {
     q: "É seguro ativar as notificações?",
     a: "Sim, é totalmente seguro. Nós utilizamos tecnologia oficial e nativa do próprio navegador Google Chrome, Safari ou Edge. Não instalamos nada no seu celular, apenas enviamos um aviso (semelhante ao de uma mensagem) quando subimos fotos ou vídeos novos."
  },
  {
     q: "Tem algum custo?",
     a: "Não! O acesso a todos os materiais exibidos é completamente gratuito no momento em que a permissão de notificações está ativada."
  },
  {
     q: "Como faço para cancelar?",
     a: "Se mudar de ideia depois, é muito fácil. Basta clicar no ícone de 'Cadeado' na barra de endereços lá em cima no seu navegador, selecionar 'Permissões' ou 'Configurações do Site' e desativar as notificações."
  },
  {
     q: "Em quais aparelhos funciona?",
     a: "Nosso sistema é otimizado para celulares modernos com Android, além de computadores Windows, Mac e Linux."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 pb-32">
      <h1 className="text-3xl md:text-5xl font-black mb-10 text-foreground">Dúvidas Frequentes</h1>
      
      <div className="flex flex-col gap-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          
          return (
            <div 
              key={index} 
              className="glass p-1 rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div className="flex justify-between items-center p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-bold">{faq.q}</h3>
                <div className={cn(
                  "w-8 h-8 rounded-full bg-surface flex items-center justify-center transition-transform duration-300",
                  isOpen && "rotate-180 bg-primary text-white"
                )}>
                  <ChevronDown size={20} />
                </div>
              </div>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-5 md:px-6 pb-6 text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
