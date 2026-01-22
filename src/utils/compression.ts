/**
 * Compression utilities using native browser CompressionStream/DecompressionStream APIs
 *
 * These functions compress/decompress data using gzip for efficient cloud storage.
 * Requires modern browsers with Compression Streams API support.
 */

/**
 * Compress a string to gzipped Blob
 *
 * @param data - String data to compress
 * @returns Compressed data as Blob
 */
export async function compressData(data: string): Promise<Blob> {
  // Convert string to Blob and create stream
  const blob = new Blob([data], { type: 'application/json' })
  const stream = blob.stream()

  // Compress using gzip
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))

  // Return compressed Blob directly
  return new Response(compressedStream).blob()
}

/**
 * Decompress gzipped data stream to string
 *
 * @param compressedStream - Compressed data as ReadableStream
 * @returns Decompressed string
 */
export async function decompressData(
  compressedStream: ReadableStream
): Promise<string> {
  // Decompress using gzip and read as text
  const decompressedStream = compressedStream.pipeThrough(
    new DecompressionStream('gzip')
  )
  return await new Response(decompressedStream).text()
}
