/**
 * Check if a URL is a valid HTTP/HTTPS image URL
 * @param url URL string to validate
 * @returns True if URL is valid and uses HTTP/HTTPS protocol
 */
export function isValidImageUrl(url: string): boolean {
  try {
    if (!url || !url.trim()) return false
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
