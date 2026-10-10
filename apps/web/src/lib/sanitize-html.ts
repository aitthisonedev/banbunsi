/** Lightweight HTML sanitizer for CMS body display (defense in depth). */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  let out = html;
  out = out.replace(/<(script|style|iframe|object|embed|link|meta)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  out = out.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
  out = out.replace(/<\/?(html|body|head)[^>]*>/gi, "");
  return out;
}
