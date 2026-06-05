import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware para habilitar CORS (Cross-Origin Resource Sharing) de forma flexível para a Vercel e outras origens
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Permite qualquer origem ou reflete a origem da requisição para facilitar a integração com a Vercel
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configuração de parseamento de JSON
app.use(express.json());

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');

// Garante que a pasta de mídia exista localmente
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Atualiza o arquivo indexador estático 'media.json' na inicialização e upload/deleção
const updateMediaJson = () => {
  try {
    if (!fs.existsSync(MEDIA_DIR)) return;
    const files = fs.readdirSync(MEDIA_DIR);
    const mediaFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        const isFavicon = file.toLowerCase().startsWith('favicon');
        return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'].includes(ext) && !isFavicon;
      })
      .map(file => {
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
        return {
          id: file,
          type: isVideo ? 'video' : 'photo',
          url: `/media/${encodeURIComponent(file)}`, // Rota estática do Express
          alt: file
        };
      })
      .reverse();

    fs.writeFileSync(path.join(MEDIA_DIR, 'media.json'), JSON.stringify(mediaFiles, null, 2), 'utf-8');
    console.log(`[Media Indexer] Sincronizado com sucesso! ${mediaFiles.length} arquivos catalogados.`);
  } catch (err) {
    console.error("[Media Indexer] Erro ao sincronizar media.json:", err);
  }
};

// Executa na inicialização do servidor
updateMediaJson();

// Senha administrativa configurada no .env ou fallback seguro
const getAdminPassword = () => {
  return process.env.ADMIN_PASSWORD || "minhasenhasapeka";
};

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, MEDIA_DIR);
  },
  filename: (req, file, cb) => {
    // Normaliza o nome do arquivo para evitar caracteres incompatíveis
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, fileExtension)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    
    // Se for upload de perfil, damos um prefixo específico para limpeza posterior
    const isProfile = req.originalUrl && req.originalUrl.includes("profile");
    const prefix = isProfile ? "profile_avatar-" : "";
    cb(null, `${prefix}${Date.now()}_${cleanName}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de arquivo não suportado. Envie apenas imagens (.jpg, .png, .webp) ou vídeos (.mp4, .webm, .mov)."));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // Limite de 100MB por arquivo (ótimo para vídeos)
  }
});

// Middleware de verificação de autenticação de administrador simples
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader === getAdminPassword()) {
    next();
  } else {
    res.status(401).json({ error: "Não autorizado. Senha de administrador incorreta ou ausente." });
  }
};

// =================--- API ENDPOINTS ---=================

// Rota de login de administrador
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === getAdminPassword()) {
    res.json({ success: true, token: getAdminPassword() });
  } else {
    res.status(401).json({ error: "Senha incorreta. Tente novamente." });
  }
});

// Listagem ativa de todas as mídias salvas em /public/media/
app.get("/api/media", (req, res) => {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(MEDIA_DIR);
    const mediaFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        const isFavicon = file.toLowerCase().startsWith('favicon');
        return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'].includes(ext) && !isFavicon;
      })
      .map(file => {
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
        return {
          id: file,
          type: isVideo ? 'video' : 'photo',
          url: `/media/${encodeURIComponent(file)}`, // Rota estática do Express
          alt: file
        };
      })
      // Coloca as mais recentes primeiro
      .reverse();

    res.json(mediaFiles);
  } catch (error) {
    console.error("Erro ao listar arquivos de mídia:", error);
    res.status(500).json({ error: "Erro ao obter os arquivos de mídia." });
  }
});

// Upload de arquivo de mídia (protegido por senha)
app.post("/api/admin/upload", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Selecione um arquivo válido para upload." });
  }
  const isVideo = ['.mp4', '.webm', '.mov'].includes(path.extname(req.file.filename).toLowerCase());
  
  // Atualiza indexador
  updateMediaJson();

  res.json({
    success: true,
    file: {
      id: req.file.filename,
      type: isVideo ? 'video' : 'photo',
      url: `/media/${req.file.filename}`,
      alt: req.file.filename
    }
  });
});

// Upload de múltiplos arquivos de mídia em lote (protegido por senha)
app.post("/api/admin/upload-multiple", requireAdmin, upload.array("files", 100), (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: "Selecione pelo menos um arquivo válido para upload em lote." });
  }

  const uploadedFiles = req.files.map(file => {
    const isVideo = ['.mp4', '.webm', '.mov'].includes(path.extname(file.filename).toLowerCase());
    return {
      id: file.filename,
      type: isVideo ? 'video' : 'photo',
      url: `/media/${file.filename}`,
      alt: file.filename
    };
  });

  // Atualiza indexador
  updateMediaJson();

  res.json({
    success: true,
    files: uploadedFiles
  });
});

// Deleção de arquivo de mídia (protegido por senha)
app.delete("/api/admin/delete", requireAdmin, (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: "Nome do arquivo (filename) é obrigatório." });
  }

  const filePath = path.join(MEDIA_DIR, filename);
  // Impede que tentem ler arquivos de fora do diretório de mídia (ataque de Directory Traversal)
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(MEDIA_DIR)) {
    return res.status(403).json({ error: "Acesso ilegal negado." });
  }

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      
      // Atualiza indexador após deleção física
      updateMediaJson();

      res.json({ success: true, message: "Arquivo deletado com sucesso do servidor." });
    } catch (err) {
      res.status(500).json({ error: "Erro interno ao tentar deletar o arquivo fisicamente." });
    }
  } else {
    res.status(404).json({ error: "Arquivo não encontrado." });
  }
});

// =================--- PROFILE CONFIG API ---=================

// Obter configurações de perfil
app.get("/api/profile-config", (req, res) => {
  const configPath = path.join(MEDIA_DIR, 'profile_config.json');
  const defaultPreset = {
    profileImage: "/media/favicon.jpg"
  };

  try {
    if (fs.existsSync(configPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return res.json(savedConfig);
    } else {
      // Cria arquivo padrão se não existir
      fs.writeFileSync(configPath, JSON.stringify(defaultPreset, null, 2));
      return res.json(defaultPreset);
    }
  } catch (error) {
    console.error("Erro ao ler profile_config.json:", error);
    res.json(defaultPreset);
  }
});

// Atualizar configurações de perfil (Senha protegida - via link)
app.post("/api/admin/profile-config", requireAdmin, (req, res) => {
  const { profileImage } = req.body;
  if (!profileImage) {
    return res.status(400).json({ error: "A URL ou caminho da imagem de perfil é obrigatório." });
  }

  const configPath = path.join(MEDIA_DIR, 'profile_config.json');
  try {
    const newConfig = { profileImage };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, config: newConfig });
  } catch (error) {
    console.error("Erro ao salvar profile_config.json:", error);
    res.status(500).json({ error: "Erro interno do servidor para salvar a configuração." });
  }
});

// Fazer upload de uma nova imagem especificamente como Perfil (Senha protegida - via upload de arquivo)
app.post("/api/admin/profile-upload", requireAdmin, (req, res, next) => {
  console.log("[DEBUG] Recebendo pedido de upload de perfil...");
  next();
}, upload.single("file"), (req, res) => {
  console.log("[DEBUG] Multer processou o arquivo:", req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: "Selecione um arquivo de imagem válido." });
  }

  const fileUrl = `/media/${req.file.filename}`;
  const configPath = path.join(MEDIA_DIR, 'profile_config.json');

  try {
    // Tenta apagar fotos de perfil antigas iniciadas com "profile_avatar-" para poupar espaço
    if (fs.existsSync(MEDIA_DIR)) {
      const files = fs.readdirSync(MEDIA_DIR);
      files.forEach(file => {
        if (file.startsWith("profile_avatar-") && file !== req.file?.filename) {
          try {
            fs.unlinkSync(path.join(MEDIA_DIR, file));
            console.log("[DEBUG] Foto de perfil antiga deletada:", file);
          } catch (_) {}
        }
      });
    }

    const newConfig = { profileImage: fileUrl };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    console.log("[DEBUG] profile_config.json salvo com sucesso:", newConfig);
    res.json({ success: true, profileImage: fileUrl });
  } catch (error) {
    console.error("[DEBUG] Erro ao salvar foto de perfil no config:", error);
    res.status(500).json({ error: "O arquivo foi enviado, mas houve erro ao atualizar a foto de perfil nas configurações." });
  }
});

// Servir arquivos de mídia de forma estática sobre uma rota expressa limpa
app.use("/media", express.static(MEDIA_DIR));

// Middleware de tratamento de erros global (evita crashes e fornece respostas limpas)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[DEBUG] Erro global capturado pelo Express:", err);
  res.status(err.status || 500).json({ error: err.message || "Ocorreu um erro interno no servidor durante a requisição." });
});

// Configuração do motor do Vite ou servidor estático
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Modo de Desenvolvimento
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Modo de Produção
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Magrinha Sapeka Server] Online e escutando na porta http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Falha ao inicializar o servidor de aplicação:", err);
});
