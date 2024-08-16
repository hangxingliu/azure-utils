export function getURI(uri: string, params?: Record<string, string | string[] | number | undefined>) {
  let qs = '';
  if (params) {
    const qsItems: string[] = [];
    for (let [key, value] of Object.entries(params)) {
      if (typeof value === 'undefined') continue;
      if (Array.isArray(value)) value = value.join(',');
      qsItems.push(`${key}=${encodeURIComponent(value)}`);
    }
    qs = qsItems.join('&');
  }
  if (!qs) return uri;
  return `${uri}?${qs}`;
}
