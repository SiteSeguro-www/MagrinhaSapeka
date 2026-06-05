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

// Configuração de parseamento de JSON
app.use(express.json());

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');

// Garante que a pasta de mídia exista localmente
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

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
    cb(null, `${Date.now()}_${cleanName}${fileExtension}`);
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
        return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'].includes(ext);
      })
      .map(file => {
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
        return {
          id: file,
          type: isVideo ? 'video' : 'photo',
          url: `/media/${file}`, // Rota estática do Express
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
      res.json({ success: true, message: "Arquivo deletado com sucesso do servidor." });
    } catch (err) {
      res.status(500).json({ error: "Erro interno ao tentar deletar o arquivo fisicamente." });
    }
  } else {
    res.status(404).json({ error: "Arquivo não encontrado." });
  }
});

// Servir arquivos de mídia de forma estática sobre uma rota expressa limpa
app.use("/media", express.static(MEDIA_DIR));

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
