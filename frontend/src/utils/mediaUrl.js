const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const serverOrigin = apiUrl.replace(/\/api\/?$/, '');

export function getMediaUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${serverOrigin}${url.startsWith('/') ? url : `/${url}`}`;
}
