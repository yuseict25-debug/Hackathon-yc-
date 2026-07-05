const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Build proxied URL for a backend-generated object image by id/filename */
export function backendImageUrl(imageId: string): string {
  const id = imageId.replace(/^\/+/, "");
  if (!API_URL) return `/images/${id}`;
  return `${API_URL}/images/${id}`;
}

export function isBackendImageUrl(sprite: string): boolean {
  return (
    sprite.startsWith("/api/images/") ||
    sprite.startsWith("/images/") ||
    sprite.includes("/images/")
  );
}
