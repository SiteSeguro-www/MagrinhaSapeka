import { Hero } from '../components/Hero';
import { Gallery } from '../components/Gallery';

interface HomeProps {
  isUnlocked: boolean;
  onActivate: () => void;
  onMediaClick: () => void;
}

export function Home({ isUnlocked, onActivate, onMediaClick }: HomeProps) {
  return (
    <>
      <Hero onActivate={onActivate} isUnlocked={isUnlocked} />
      
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <Gallery isUnlocked={isUnlocked} onMediaClick={onMediaClick} />
      </div>

      {/* Benefits Section */}
      {!isUnlocked && (
         <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-8">Por que ativar as notificações?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-2xl">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="font-bold mb-2">Acesso Imediato</h3>
              <p className="text-sm text-muted-foreground">Conteúdo exclusivo liberado instantaneamente na sua tela.</p>
            </div>
            <div className="glass p-6 rounded-2xl">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="font-bold mb-2">Fotos Restritas</h3>
              <p className="text-sm text-muted-foreground">Atualizações de ensaios fotográficos que não vão pro Instagram.</p>
            </div>
            <div className="glass p-6 rounded-2xl">
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="font-bold mb-2">Vídeos Exclusivos</h3>
              <p className="text-sm text-muted-foreground">Avisos em primeira mão sempre que eu postar vídeos novos.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
