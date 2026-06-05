// Normalização da URL base para requisições na Vercel ou local
const rawBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || '';

// Clean up VITE_API_BASE_URL so it does not contain trailing slashes or subpaths like /admin or /api
export const API_BASE_URL = rawBaseUrl
  .replace(/\/admin\/?$/, '')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

/**
 * Constrói a URL final para os endpoints de API.
 * Se API_BASE_URL estiver vazia, retorna o caminho relativo original (útil para build unificado Express/Vite).
 * Do contrário, concatena a URL absoluta.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Constrói a URL final para arquivos de mídia/assets estáticos.
 * Mantém links absolutos (ex: Unsplash) inalterados e prefixa URLs locais com a URL do servidor se necessário.
 */
export function getMediaUrl(url: string | null | undefined, isLocal?: boolean): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (isLocal) {
    return url;
  }
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
}
