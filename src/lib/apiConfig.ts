const isExternal = !window.location.hostname.includes("run.app") && 
                     window.location.hostname !== "localhost" && 
                     window.location.hostname !== "127.0.0.1";

// Permite definir a URL de produção na Vercel através de variáveis de ambiente.
// Caso contrário, usa a URL do ambiente de desenvolvimento ativo do AI Studio,
// onde as mídias salvas e configurações do admin de fato encontram-se no disco físico.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isExternal 
  ? "https://ais-dev-voop6yrtycadndon66d4j4-109493740571.us-east5.run.app" 
  : "");

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function getMediaUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
}
