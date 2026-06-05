import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, LogOut, CheckCircle, AlertCircle, FileVideo, FileImage, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/cn';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  alt: string;
}

export function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados específicos para gerenciamento da foto de perfil
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop');
  const [profileInputUrl, setProfileInputUrl] = useState('');
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Verifica o token salvo localmente no início
  useEffect(() => {
    const savedToken = localStorage.getItem('magrinha_sapeka_admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Busca dados do servidor sempre que o admin for verificado
  useEffect(() => {
    if (isAuthenticated) {
      fetchMedia();
      fetchProfileConfig();
    }
  }, [isAuthenticated]);

  const fetchProfileConfig = async () => {
    try {
      const res = await fetch('/api/profile-config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.profileImage) {
          setProfileImage(data.profileImage);
          setProfileInputUrl(data.profileImage);
        }
      }
    } catch (e) {
      console.error("Erro ao buscar configuração de perfil:", e);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (e) {
      console.error("Erro ao buscar mídias no painel administrador:", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('magrinha_sapeka_admin_token', data.token);
        setStatusMsg({ text: "Login efetuado com sucesso!", type: "success" });
      } else {
        const err = await res.json();
        setStatusMsg({ text: err.error || "Senha inválida.", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: "Erro ao conectar com o servidor.", type: "error" });
    }
  };

  const handleLogout = () => {
    setToken('');
    setIsAuthenticated(false);
    localStorage.removeItem('magrinha_sapeka_admin_token');
    setStatusMsg(null);
  };

  // Funções de Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setStatusMsg(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      if (res.ok) {
        setStatusMsg({ text: "Arquivo enviado com sucesso!", type: "success" });
        fetchMedia(); // Recarrega galeria
      } else {
        const err = await res.json();
        setStatusMsg({ text: err.error || "Ocorreu um erro no upload.", type: "error" });
      }
    } catch (e) {
      setStatusMsg({ text: "Erro na rede ao tentar enviar o arquivo.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    const confirmDelete = window.confirm(`Deseja realmente excluir permanentemente a mídia "${filename}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        setStatusMsg({ text: "Mídia deletada com sucesso!", type: "success" });
        fetchMedia(); // Recarrega galeria
      } else {
        const err = await res.json();
        setStatusMsg({ text: err.error || "Não foi possível excluir a mídia.", type: "error" });
      }
    } catch (e) {
      setStatusMsg({ text: "Erro ao tentar se comunicar com o servidor.", type: "error" });
    }
  };

  const handleSaveProfileUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);
    try {
      const res = await fetch('/api/admin/profile-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ profileImage: profileInputUrl })
      });

      if (res.ok) {
        setProfileImage(profileInputUrl);
        setProfileStatus({ text: "Link da imagem de perfil salvo com sucesso!", type: "success" });
      } else {
        const err = await res.json();
        setProfileStatus({ text: err.error || "Houve um erro ao salvar o link.", type: "error" });
      }
    } catch (err) {
      setProfileStatus({ text: "Erro ao conectar com o servidor.", type: "error" });
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setProfileUploading(true);
    setProfileStatus(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/admin/profile-upload', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.profileImage);
        setProfileInputUrl(data.profileImage);
        setProfileStatus({ text: "Foto de perfil enviada e atualizada com sucesso!", type: "success" });
      } else {
        const err = await res.json();
        setProfileStatus({ text: err.error || "Ocorreu um erro no upload.", type: "error" });
      }
    } catch (e) {
      setProfileStatus({ text: "Erro de rede ao carregar a imagem de perfil.", type: "error" });
    } finally {
      setProfileUploading(false);
    }
  };

  // TELA DE LOGIN DO ADMIN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 pb-32 flex flex-col justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl border border-primary/20 flex flex-col items-center text-center shadow-xl"
        >
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={32} />
          </div>
          
          <h1 className="text-3xl font-black mb-2 text-foreground">Painel de Administração</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Área de acesso restrita para upload e gerenciamento de fotos e vídeos da plataforma.
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="admin-pass" className="text-sm font-semibold ml-1">Senha de Acesso</label>
              <input
                id="admin-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center text-lg tracking-widest"
                placeholder="••••••••••••"
              />
            </div>

            {statusMsg && (
              <div className={cn(
                "p-4 rounded-xl text-sm flex items-center gap-3",
                statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              )}>
                {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all mt-2"
            >
              Entrar no Painel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // TELA PRINCIPAL DO ADMIN (LOGADO)
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Acesso Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-1">Carregue novas mídias ou remova arquivos existentes.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-transparent hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all font-semibold"
        >
          <LogOut size={18} />
          <span>Sair do Painel</span>
        </button>
      </div>

      {statusMsg && (
        <div className={cn(
          "p-4 rounded-xl mb-8 text-base flex items-center gap-3 max-w-xl",
          statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        )}>
          {statusMsg.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* SEÇÃO DE CONFIGURAÇÃO DA FOTO DE PERFIL */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-primary/10 mb-10 shadow-lg">
        <h2 className="text-xl md:text-2xl font-black mb-1 flex items-center gap-2">
          <span>📸</span> Editar Foto de Perfil do Topo
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Altere a imagem circular que aparece no topo da página inicial do seu site. Você pode enviar uma foto nova ou colar um link público.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-4 text-center p-4 rounded-2xl bg-background/40 border border-border/50">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg glass">
                <img 
                  src={profileImage} 
                  alt="Pré-visualização do perfil" 
                  className="w-full h-full object-cover"
                />
              </div>
              {profileUploading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                </div>
              )}
            </div>
            
            <div>
              <input 
                ref={profileFileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleProfileImageUpload}
              />
              <button
                type="button"
                disabled={profileUploading}
                onClick={() => profileFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all text-center"
              >
                {profileUploading ? "Enviando..." : "Enviar Nova Foto"}
              </button>
              <p className="text-xs text-muted-foreground mt-2">Formatos aceitos: JPG, PNG ou WEBP</p>
            </div>
          </div>

          {/* URL Input Form */}
          <div className="md:col-span-2 flex flex-col justify-center">
            <form onSubmit={handleSaveProfileUrl} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="profile-url" className="text-sm font-bold ml-1">Ou cole uma URL/Link de imagem externa:</label>
                <div className="flex gap-2">
                  <input
                    id="profile-url"
                    type="url"
                    required
                    value={profileInputUrl}
                    onChange={(e) => setProfileInputUrl(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none text-sm"
                    placeholder="https://exemplo.com/sua-foto.jpg"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-foreground text-background dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl font-bold text-sm transition-colors active:scale-95"
                  >
                    Salvar Link
                  </button>
                </div>
              </div>

              {profileStatus && (
                <div className={cn(
                  "p-3 rounded-xl text-xs flex items-center gap-2",
                  profileStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                )}>
                  {profileStatus.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  <span>{profileStatus.text}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ÁREA DE DRAG & DROP PARA UPLOAD */}
      <h2 className="text-xl font-bold mb-4">Adicionar Nova Mídia</h2>
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full min-h-[220px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300",
          dragActive ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/40 bg-surface/50",
          uploading ? "pointer-events-none opacity-60" : ""
        )}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-primary animate-spin" />
            <p className="text-lg font-bold text-primary animate-pulse">Enviando arquivos e mídias para o servidor...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Upload size={32} />
            </div>
            <div>
              <p className="text-lg font-bold">Arraste e solte fotos ou vídeos aqui</p>
              <p className="text-sm text-muted-foreground mt-1">Ou clique para selecionar no seu dispositivo</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase font-semibold">
              Tipos aceitos: JPG, PNG, WEBP, MP4, WEBM (Max 100MB)
            </span>
          </div>
        )}
      </div>

      {/* LISTA DE MÍDIAS EXISTENTES */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mídias no Site ({mediaList.length})</h2>
          <button 
            onClick={fetchMedia}
            className="text-sm text-primary hover:underline font-semibold"
          >
            Atualizar Lista
          </button>
        </div>

        {mediaList.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center text-muted-foreground">
            Ainda não há mídias salvas no servidor. Faça o primeiro upload acima!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {mediaList.map((item) => (
              <div 
                key={item.id} 
                className="relative rounded-2xl overflow-hidden glass aspect-square border border-border group"
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full relative bg-black/40 flex items-center justify-center">
                    <video src={item.url} muted className="w-full h-full object-cover opacity-80" />
                    <FileVideo size={36} className="absolute text-white pointer-events-none drop-shadow-md" />
                  </div>
                ) : (
                  <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                )}

                {/* Info Overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 text-white z-10">
                  <span className="text-xs truncate font-mono text-white/80">{item.alt}</span>
                  
                  <button
                    onClick={() => handleDelete(item.alt)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 transition-colors text-sm font-bold mt-auto active:scale-95"
                  >
                    <Trash2 size={16} />
                    <span>Excluir Mídia</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
