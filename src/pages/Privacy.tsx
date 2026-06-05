export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 pb-32">
      <h1 className="text-3xl md:text-5xl font-black mb-8 text-foreground">Política de Privacidade</h1>
      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <p>A sua privacidade é importante para nós. Esta política explica como coletamos e protegemos suas informações quando você visita nosso site.</p>
        
        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">1. Coleta de Dados</h2>
          <p>Coletamos apenas as informações essenciais para o funcionamento adequado da plataforma, como preferências de visualização (ex: tema claro/escuro) e o status de permissão das suas notificações.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">2. Notificações Push</h2>
          <p>Ao ativar nossas notificações, utilizamos a API oficial do seu navegador. Não coletamos números de telefone ou emails para este propósito. Nenhuma informação pessoal é vinculada a estes alertas de conteúdo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">3. Armazenamento Local</h2>
          <p>Utilizamos o armazenamento local do seu próprio dispositivo (localStorage) para lembrar se você já desbloqueou o conteúdo, proporcionando uma experiência sem interrupções nas próximas visitas.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">4. Compartilhamento</h2>
          <p>Nós nunca vendemos, alugamos ou compartilhamos suas informações de navegação ou interações com terceiros.</p>
        </section>
      </div>
    </div>
  );
}
