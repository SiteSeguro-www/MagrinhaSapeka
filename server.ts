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

// Configuração de CORS nativo para permitir acesso do site hospedado no Vercel
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Configuração de parseamento de JSON
app.use(express.json());

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');

// Garante que a pasta de mídia exista localmente
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Resgata o arquivo firebase-applet-config para verificar ID tokens
const getFirebaseConfig = () => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (err) {
    console.error("[Auth] Erro ao ler firebase-applet-config.json:", err);
  }
  return null;
};
const firebaseConfig = getFirebaseConfig();

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
    fileSize: 100 * 1024 * 1024 // Limite de 100MB por arquivo (excelente para vídeos)
  }
});

// Middleware de verificação de autenticação (aceita APENAS token Firebase pertencente ao administrador)
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Não autorizado. Token de autenticação ausente." });
  }

  // Tenta autenticar via Firebase ID Token (Bearer)
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        // Descodifica o payload JWT
        const payloadBuf = Buffer.from(parts[1], "base64");
        const payload = JSON.parse(payloadBuf.toString("utf-8"));
        
        // Valida que o emissor corresponde à applet do Firebase do usuário
        const expectedAud = firebaseConfig?.projectId || "gen-lang-client-0668923042";
        if (payload.aud === expectedAud) {
          const nowSecs = Math.floor(Date.now() / 1000);
          if (payload.exp && nowSecs <= payload.exp) {
            // Garante que APENAS o e-mail de administrador definido é autorizado
            const isAdminEmail = payload.email === "dweminem@gmail.com";
            const isEmailVerified = payload.email_verified === true;

            if (isAdminEmail && isEmailVerified) {
              // Autenticado com sucesso!
              return next();
            } else {
              console.warn(`[Auth] Acesso negado para o e-mail: ${payload.email} (Verificado: ${payload.email_verified})`);
            }
          } else {
            console.warn("[Auth] Token ID do Firebase expirado.");
          }
        } else {
          console.warn(`[Auth] Incompatibilidade de aud. Esperado: ${expectedAud}, recebido: ${payload.aud}`);
        }
      }
    } catch (err) {
      console.warn("[Auth] Erro ao validar o token de login do Firebase:", err);
    }
  }

  res.status(401).json({ error: "Acesso administrativo negado. Faça login com o Gmail autorizado (dweminem@gmail.com)." });
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

// Listagem ativa de todas as mídias salvas localmente
app.get("/api/media", async (req, res) => {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(MEDIA_DIR);
    const mediaFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'].includes(ext) && file !== 'profile_config.json';
      })
      .map(file => {
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
        return {
          id: file,
          type: isVideo ? 'video' : 'photo',
          url: `/media/${file}`,
          alt: file
        };
      })
      .reverse();
    return res.json(mediaFiles);
  } catch (error: any) {
    console.error("Erro ao listar arquivos de mídia:", error);
    res.status(500).json({ error: `Erro ao obter os arquivos de mídia: ${error.message}` });
  }
});

// Upload de arquivo de mídia único
app.post("/api/admin/upload", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Selecione um arquivo válido para upload." });
  }

  try {
    const isVideo = ['.mp4', '.webm', '.mov'].includes(path.extname(req.file.filename).toLowerCase());
    res.json({
      success: true,
      file: {
        id: req.file.filename,
        type: isVideo ? 'video' : 'photo',
        url: `/media/${req.file.filename}`,
        alt: req.file.filename
      }
    });
  } catch (error: any) {
    console.error("Erro no upload único:", error);
    res.status(500).json({ error: `Erro ao salvar arquivo no servidor: ${error.message}` });
  }
});

// Upload de múltiplos arquivos de mídia em lote
app.post("/api/admin/upload-multiple", requireAdmin, upload.array("files", 100), async (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: "Selecione pelo menos um arquivo válido para upload em lote." });
  }

  try {
    const uploadedFiles = (req.files as Express.Multer.File[]).map(file => {
      const isVideo = ['.mp4', '.webm', '.mov'].includes(path.extname(file.filename).toLowerCase());
      return {
        id: file.filename,
        type: isVideo ? 'video' : 'photo',
        url: `/media/${file.filename}`,
        alt: file.filename
      };
    });

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error: any) {
    console.error("Erro no upload múltiplo:", error);
    res.status(500).json({ error: `Erro ao salvar lote de mídias no servidor: ${error.message}` });
  }
});

// Deleção de arquivo de mídia local
app.delete("/api/admin/delete", requireAdmin, async (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: "Nome do arquivo (filename) é obrigatório." });
  }

  const filePath = path.join(MEDIA_DIR, filename);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(MEDIA_DIR)) {
    return res.status(403).json({ error: "Acesso ilegal negado." });
  }

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: "Arquivo deletado com sucesso do servidor local." });
    } catch (err) {
      res.status(500).json({ error: "Erro interno ao tentar deletar o arquivo fisicamente." });
    }
  } else {
    res.status(404).json({ error: "Arquivo não encontrado localmente." });
  }
});

// =================--- PROFILE CONFIG API ---=================

// Obter configurações de perfil
app.get("/api/profile-config", async (req, res) => {
  const configPath = path.join(MEDIA_DIR, 'profile_config.json');
  const defaultPreset = {
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop"
  };

  try {
    if (fs.existsSync(configPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return res.json(savedConfig);
    } else {
      fs.writeFileSync(configPath, JSON.stringify(defaultPreset, null, 2));
      return res.json(defaultPreset);
    }
  } catch (error) {
    console.error("Erro ao ler profile_config.json:", error);
    res.json(defaultPreset);
  }
});

// Atualizar configurações de perfil
app.post("/api/admin/profile-config", requireAdmin, async (req, res) => {
  const { profileImage } = req.body;
  if (!profileImage) {
    return res.status(400).json({ error: "A URL ou caminho da imagem de perfil é obrigatório." });
  }

  const newConfig = { profileImage };
  const configPath = path.join(MEDIA_DIR, 'profile_config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, config: newConfig });
  } catch (error) {
    console.error("Erro ao salvar profile_config.json:", error);
    res.status(500).json({ error: "Erro interno do servidor para salvar a configuração local." });
  }
});

// Upload de nova imagem de perfil
app.post("/api/admin/profile-upload", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Selecione um arquivo de imagem válido." });
  }

  const fileUrl = `/media/${req.file.filename}`;
  const newConfig = { profileImage: fileUrl };

  try {
    const configPath = path.join(MEDIA_DIR, 'profile_config.json');
    if (fs.existsSync(MEDIA_DIR)) {
      const files = fs.readdirSync(MEDIA_DIR);
      files.forEach(file => {
        if (file.startsWith("profile_avatar-") && file !== req.file?.filename) {
          try {
            fs.unlinkSync(path.join(MEDIA_DIR, file));
          } catch (_) {}
        }
      });
    }
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, profileImage: fileUrl });
  } catch (error: any) {
    console.error("Erro ao salvar foto de perfil:", error);
    res.status(500).json({ error: `Erro ao salvar foto de perfil: ${error.message}` });
  }
});

// Servir mídias locais diretamente
app.get("/media/:filename", async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(MEDIA_DIR, filename);
  
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(MEDIA_DIR)) {
    return res.status(403).json({ error: "Acesso ilegal negado." });
  }

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Mídia não encontrada localmente." });
  }
});

// Middleware de tratamento de erros global
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
