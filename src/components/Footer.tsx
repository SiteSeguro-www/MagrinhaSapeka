import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full py-12 text-center text-muted-foreground text-sm border-t border-border mt-auto">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-base font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
          <Link to="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link>
          <Link to="/sobre" className="hover:text-primary transition-colors">Sobre Nós</Link>
          <Link to="/contato" className="hover:text-primary transition-colors">Contato</Link>
          <Link to="/faq" className="hover:text-primary transition-colors">Dúvidas (FAQ)</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Magrinha Sapeka. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
