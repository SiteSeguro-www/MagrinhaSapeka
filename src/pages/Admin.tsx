import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, LogOut, CheckCircle, AlertCircle, FileVideo, ShieldAlert, LogIn } from 'lucide-react';
import { cn } from '../lib/cn';
import { getApiUrl, getMediaUrl } from '../lib/apiConfig';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth, db, storage } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  alt: string;
}

export function Admin() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados específicos para gerenciamento da foto de perfil
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop');
  const [profileInputUrl, setProfileInputUrl] = useState('');
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Escuta alterações de Autenticação no Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === 'dweminem@gmail.com') {
          setCurrentUser(user);
          setIsAuthenticated(true);
          // Resgata o ID Token real para autenticar no backend Express
          try {
            const idToken = await user.getIdToken();
            setToken(`Bearer ${idToken}`);
          } catch (err) {
            console.error("Erro ao obter ID Token do Firebase:", err);
          }
        } else {
          // Se o e-mail não for do admin, faz o signout imediatamente e mostra uma mensagem de erro
          setCurrentUser(null);
          setIsAuthenticated(false);
          setToken('');
          await signOut(auth);
          setStatusMsg({ text: "Acesso negado. Apenas o e-mail dweminem@gmail.com está autorizado a acessar este painel administrativo.", type: "error" });
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setToken('');
      }
    });

    return () => unsubscribe();
  }, []);

  // Busca dados do Firebase Firestore e Express em tempo real assim que logado
  useEffect(() => {
    if (isAuthenticated) {
      // Escutar lista de mídias direto do Firestore
      const mediaCollectionRef = collection(db, 'media');
      const q = query(mediaCollectionRef, orderBy('createdAt', 'desc'));
      
      const unsubscribeMedia = onSnapshot(q, (snapshot) => {
        const items: MediaItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            type: data.type || 'photo',
            url: getMediaUrl(data.url),
            alt: data.alt || doc.id
          });
        });
        setMediaList(items);
      }, (error) => {
        console.warn("[Admin] Falha ao ler Firestore, buscando via Express:", error);
        fetchMediaLegacy();
      });

      // Escutar configurações de perfil direto do Firestore
      const profileDocRef = doc(db, 'configs', 'profile');
      const unsubscribeProfile = onSnapshot(profileDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.profileImage) {
            const formattedUrl = getMediaUrl(data.profileImage);
            setProfileImage(formattedUrl);
            setProfileInputUrl(formattedUrl);
          }
        } else {
          fetchProfileConfigLegacy();
        }
      }, (error) => {
        console.warn("[Admin] Falha ao escutar configs de perfil no Firestore:", error);
        fetchProfileConfigLegacy();
      });

      return () => {
        unsubscribeMedia();
        unsubscribeProfile();
      };
    }
  }, [isAuthenticated]);

  // Fallback de busca de configs legadas (via Express)
  const fetchProfileConfigLegacy = async () => {
    try {
      const res = await fetch(getApiUrl('/api/profile-config'));
      if (res.ok) {
        const data = await res.json();
        if (data && data.profileImage) {
          const formattedUrl = getMediaUrl(data.profileImage);
          setProfileImage(formattedUrl);
          setProfileInputUrl(formattedUrl);
        }
      }
    } catch (e) {
      console.error("Erro ao buscar configuração de perfil alternativa:", e);
    }
  };

  // Fallback de busca de mídias legadas (via Express)
  const fetchMediaLegacy = async () => {
    try {
      const res = await fetch(getApiUrl('/api/media'));
      if (res.ok) {
        const data = await res.json();
        const formattedData = data.map((item: MediaItem) => ({
          ...item,
          url: getMediaUrl(item.url)
        }));
        setMediaList(formattedData);
      }
    } catch (e) {
      console.error("Erro ao carregar mídias alternativa:", e);
    }
  };

  // Login pelo Firebase usando Conta Google Popup
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setStatusMsg(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user.email === 'dweminem@gmail.com') {
        setStatusMsg({ text: "Super Login Efetuado com Sucesso via Google!", type: "success" });
      } else {
        await signOut(auth);
        setStatusMsg({ text: "Acesso negado. Apenas o e-mail dweminem@gmail.com está autorizado a acessar este painel administrativo.", type: "error" });
      }
    } catch (err: any) {
      console.error("Erro no login do Firebase Google:", err);
      setStatusMsg({ text: err.message || "Erro ao realizar login com o Google.", type: "error" });
    }
  };

  // Logout do Firebase Auth
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStatusMsg({ text: "Desconectado do painel administrativo.", type: "success" });
    } catch (err: any) {
      setStatusMsg({ text: "Erro ao tentar desautorizar sessão.", type: "error" });
    }
  };

  // Funções de Drag & Drop para múltiplos arquivos (Lote)
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
    }
  };

  // Faz upload de arquivos para o Firebase Storage, e salva metadados no Firestore
  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setUploadingCount(files.length);
    setStatusMsg(null);

    try {
      let successCount = 0;
      for (const file of files) {
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.'))
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        const uniqueFilename = `${Date.now()}_${cleanName}${fileExtension}`;
        
        const isVideo = ['.mp4', '.webm', '.mov'].includes(fileExtension);
        const type = isVideo ? 'video' : 'photo';

        // Cria a referência no Storage
        const storageRef = ref(storage, `gallery/${uniqueFilename}`);
        
        // Faz o upload do arquivo
        await uploadBytes(storageRef, file);
        
        // Obtém a URL de download pública
        const downloadUrl = await getDownloadURL(storageRef);

        const cleanId = uniqueFilename.replace(/[^a-zA-Z0-9_\\-]/g, "_");
        await setDoc(doc(db, 'media', cleanId), {
          id: uniqueFilename,
          type: type,
          url: downloadUrl,
          alt: file.name,
          createdAt: serverTimestamp()
        });

        successCount++;
      }

      setStatusMsg({ text: `${successCount} arquivo(s) enviado(s) com sucesso para o Firebase Storage!`, type: "success" });
    } catch (e: any) {
      console.error("Erro no upload para o Firebase Storage:", e);
      setStatusMsg({ text: `Erro ao salvar arquivos: ${e.message || e}`, type: "error" });
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  };

  // Exclusão de Mídia do Firestore e Firebase Storage
  const handleDelete = async (filename: string, fileUrl: string) => {
    const confirmDelete = window.confirm(`Deseja realmente excluir permanentemente a mídia "${filename}"?`);
    if (!confirmDelete) return;

    setStatusMsg(null);
    try {
      // 1. Exclui a referência direta no Firestore
      const cleanId = filename.replace(/[^a-zA-Z0-9_\\-]/g, "_");
      await deleteDoc(doc(db, 'media', cleanId));

      // 2. Tenta remover o arquivo do Firebase Storage se for URL do storage
      if (fileUrl && fileUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const storageRef = ref(storage, `gallery/${filename}`);
          await deleteObject(storageRef);
        } catch (storageErr) {
          console.warn("Falha ao remover arquivo físico do Firebase Storage:", storageErr);
        }
      } else {
        // Fallback e arquivos locais legados
        try {
          await fetch(getApiUrl('/api/admin/delete'), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify({ filename })
          });
        } catch (_) {}
      }

      setStatusMsg({ text: "Mídia deletada com sucesso!", type: "success" });
    } catch (e: any) {
      console.error("Erro ao deletar mídia:", e);
      setStatusMsg({ text: "Erro ao tentar realizar a exclusão.", type: "error" });
    }
  };

  // Altera configurações de imagem de perfil de topo no Firestore e Express
  const handleSaveProfileUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);
    try {
      // 1. Salva no Firestore direto
      await setDoc(doc(db, 'configs', 'profile'), {
        profileImage: profileInputUrl
      });

      // 2. Notifica o backend Express por segurança para redundância local
      await fetch(getApiUrl('/api/admin/profile-config'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ profileImage: profileInputUrl })
      });

      const formattedUrl = getMediaUrl(profileInputUrl);
      setProfileImage(formattedUrl);
      setProfileStatus({ text: "Link da imagem de perfil salvo com sucesso!", type: "success" });
    } catch (err: any) {
      console.error("Erro ao atualizar perfil do topo:", err);
      setProfileStatus({ text: "Erro ao sincronizar informações no banco de dados.", type: "error" });
    }
  };

  // Envia foto de avatar ao Firebase Storage e atualiza sua referência no Firestore
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setProfileUploading(true);
    setProfileStatus(null);

    try {
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const uniqueFilename = `profile_${Date.now()}${fileExtension}`;

      // Cria referência no Storage para a foto de perfil
      const storageRef = ref(storage, `profiles/${uniqueFilename}`);
      
      // Upload do arquivo
      await uploadBytes(storageRef, file);
      
      // Obtém a URL pública do avatar
      const downloadUrl = await getDownloadURL(storageRef);

      // Atualiza a URL do Perfil do Topo no Google Firestore
      await setDoc(doc(db, 'configs', 'profile'), {
        profileImage: downloadUrl
      });

      setProfileImage(downloadUrl);
      setProfileInputUrl(downloadUrl);
      setProfileStatus({ text: "Foto de perfil enviada e atualizada com sucesso no Firebase!", type: "success" });
    } catch (e: any) {
      console.error("Erro ao enviar foto de avatar para o Storage:", e);
      setProfileStatus({ text: `Erro ao fazer upload da imagem: ${e.message || e}`, type: "error" });
    } finally {
      setProfileUploading(false);
    }
  };

  // TELA DE LOGIN DO ADMIN (Focada em Firebase Google Login)
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 pb-32 flex flex-col justify-center min-h-[70vh] font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl border border-primary/20 flex flex-col items-center text-center shadow-xl mb-8"
        >
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={32} />
          </div>
          
          <h1 className="text-3xl font-black mb-2 text-foreground">Painel de Administração</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Área de acesso restrita para upload e gerenciamento de mídias conectada ao Firebase em tempo real.
          </p>

          <div className="w-full flex flex-col gap-4">
            {statusMsg && (
              <div className={cn(
                "p-4 rounded-xl text-sm flex flex-col gap-2 text-left",
                statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              )}>
                <div className="flex items-center gap-3">
                  {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span className="font-bold">{statusMsg.type === 'success' ? 'Sucesso' : 'Falha no Login'}</span>
                </div>
                <span className="text-xs font-mono break-all">{statusMsg.text}</span>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all cursor-pointer"
            >
              <LogIn size={20} />
              Entrar com Google (Firebase)
            </button>
            <p className="text-xs text-muted-foreground">Logue apenas com <strong className="text-primary">dweminem@gmail.com</strong> para obter acesso de gravação.</p>
          </div>
        </motion.div>

        {/* Guia de Configuração para Vercel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-950/40 p-6 rounded-2xl border border-border text-left"
        >
          <h3 className="text-amber-500 text-sm font-extrabold flex items-center gap-2 mb-3">
            <span>⚠️</span> ATENÇÃO: CONFIGURAÇÃO DO SEU FIREBASE PARA A VERCEL
          </h3>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Se você estiver acessando pela Vercel (<code className="text-primary">magrinha-sapeka.vercel.app</code>), o login do Google falhará ou as imagens de upload não serão exibidas para visitas públicas se você não concluir os 2 ajustes abaixo no seu Console do Firebase:
          </p>

          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-lg bg-background/50 border border-border/60">
              <span className="font-bold text-foreground block mb-1">1. Liberar seu site Vercel no Firebase (Auth)</span>
              <ol className="list-decimal pl-4 text-muted-foreground flex flex-col gap-1">
                <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">Console do Firebase</a> e entre em seu projeto.</li>
                <li>Vá no menu lateral em <strong>Authentication</strong> e acesse a aba <strong>Settings</strong> (Configurações).</li>
                <li>Clique em <strong>Authorized Domains</strong> (Domínios Autorizados) e adicione o domínio: <strong className="text-white">magrinha-sapeka.vercel.app</strong></li>
              </ol>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-border/60">
              <span className="font-bold text-foreground block mb-1">2. Ativar e Configurar o Firebase Storage (Uploads)</span>
              <ol className="list-decimal pl-4 text-muted-foreground flex flex-col gap-1">
                <li>No menu lateral, clique em <strong>Storage</strong> (Armazenamento) e clique no botão <strong>Get Started (Começar)</strong> se ainda não tiver feito isso.</li>
                <li>Acesse a aba <strong>Rules (Regras)</strong> e cole a regra de leitura pública e escrita autenticada abaixo:</li>
              </ol>
              <pre className="mt-2 p-2 bg-black/80 rounded border border-border text-[10px] text-zinc-300 font-mono overflow-x-auto whitespace-pre">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == 'dweminem@gmail.com';
    }
  }
}`}
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // TELA PRINCIPAL DO ADMIN (LOGADO)
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-border font-sans">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Acesso Administrativo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conectado como <strong className="text-primary">{currentUser?.email}</strong>. Sincronizado com o Firestore em Tempo Real.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-transparent hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all font-semibold cursor-pointer"
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
      <div className="glass p-6 md:p-8 rounded-3xl border border-primary/10 mb-10 shadow-lg pr-4 font-sans">
        <h2 className="text-xl md:text-2xl font-black mb-1 flex items-center gap-2">
          <span>📸</span> Editar Foto de Perfil do Topo
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Altere a imagem circular que aparece no topo da página inicial do seu site. Você pode enviar uma nova foto que será salva no banco ou colar uma URL pública.
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
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all text-center cursor-pointer"
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
                <label htmlFor="profile-url" className="text-sm font-bold ml-1 text-foreground">Ou cole uma URL/Link de imagem externa:</label>
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
                    className="px-6 py-3 bg-foreground text-background dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl font-bold text-sm transition-colors active:scale-95 cursor-pointer"
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
      <h2 className="text-xl font-bold mb-4 font-sans text-foreground">Adicionar Novas Mídias em Lote</h2>
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full min-h-[220px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 font-sans",
          dragActive ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/40 bg-surface/50",
          uploading ? "pointer-events-none opacity-60" : ""
        )}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-primary animate-spin" />
            <p className="text-lg font-bold text-primary animate-pulse">Armazenando {uploadingCount} arquivo(s) e registrando no Firestore...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Upload size={32} />
            </div>
            <div>
              <p className="text-lg font-bold">Arraste e solte várias fotos ou vídeos aqui (Lote)</p>
              <p className="text-sm text-muted-foreground mt-1">Ou clique para selecionar vários no seu dispositivo</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase font-semibold">
              Tipos aceitos: JPG, PNG, WEBP, MP4, WEBM (Max 100MB por lote)
            </span>
          </div>
        )}
      </div>

      {/* LISTA DE MÍDIAS EXISTENTES */}
      <div className="mt-16 font-sans">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mídias no Site ({mediaList.length})</h2>
          <p className="text-xs text-muted-foreground">Atualiza em tempo real graças ao Firebase</p>
        </div>

        {mediaList.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center text-muted-foreground">
            Ainda não há mídias salvas no Firebase Firestore. Comece arrastando arquivos acima!
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
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      <span>▶</span> Vídeo
                    </span>
                  </div>
                ) : (
                  <img src={item.url} alt={item.alt} className="w-full h-full object-cover animate-fade-in" />
                )}

                {/* Info Overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 text-white z-10">
                  <span className="text-xs truncate font-mono text-white/80">{item.id}</span>
                  
                  <button
                    onClick={() => handleDelete(item.id, item.url)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 transition-colors text-sm font-bold mt-auto active:scale-95 cursor-pointer"
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
