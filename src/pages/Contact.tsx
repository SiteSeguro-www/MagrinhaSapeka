export function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 pb-32">
      <h1 className="text-3xl md:text-5xl font-black mb-8 text-foreground">Contato</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Tem dúvidas, sugestões comerciais ou encontrou algum problema técnico? Fale com a nossa equipe.
      </p>
      
      <div className="glass p-8 md:p-10 rounded-3xl mt-8">
        <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); alert("Mensagem enviada com sucesso! Retornaremos o mais breve possível."); }}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-semibold ml-1">Nome completo</label>
              <input 
                id="name"
                type="text" 
                required
                className="w-full px-5 py-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                placeholder="Como podemos te chamar?" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold ml-1">E-mail</label>
              <input 
                id="email"
                type="email" 
                required
                className="w-full px-5 py-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                placeholder="seu@melhoremail.com" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-semibold ml-1">Sua Mensagem</label>
            <textarea 
              id="message"
              required
              className="w-full px-5 py-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[160px] resize-y" 
              placeholder="Digite aqui sua dúvida ou sugestão..."
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="w-full md:w-auto md:ml-auto bg-primary text-white py-4 px-10 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all mt-4"
          >
            Enviar Mensagem
          </button>
        </form>
      </div>
    </div>
  );
}
