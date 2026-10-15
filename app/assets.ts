// Prefix for static files when the site is served from a sub-path (GitHub Pages).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${basePath}${path}`;
