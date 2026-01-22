/**
 * Compression utilities using native browser CompressionStream/DecompressionStream APIs
 *
 * These functions compress/decompress data using gzip for efficient cloud storage.
 * Requires modern browsers with Compression Streams API support.
 */

/**
 * Compress a string to gzipped Uint8Array
 *
 * @param data - String data to compress
 * @returns Compressed data as Uint8Array
 */
export async function compressData(data: string): Promise<Uint8Array> {
  // Convert string to stream
  const blob = new Blob([data], { type: 'application/json' })
  const stream = blob.stream()

  // Compress using gzip
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))

  // Read compressed data
  const compressedBlob = await new Response(compressedStream).blob()
  const arrayBuffer = await compressedBlob.arrayBuffer()

  return new Uint8Array(arrayBuffer)
}

/**
 * Decompress gzipped Uint8Array to string
 *
 * @param compressedData - Compressed data as Uint8Array
 * @returns Decompressed string
 */
export async function decompressData(
  compressedData: Uint8Array
): Promise<string> {
  // Convert Uint8Array to stream
  const buffer =
    compressedData.buffer instanceof ArrayBuffer
      ? compressedData.buffer
      : new ArrayBuffer(0)
  const blob = new Blob([buffer])
  const stream = blob.stream()

  // Decompress using gzip
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'))

  // Read decompressed data
  const decompressedBlob = await new Response(decompressedStream).blob()
  return await decompressedBlob.text()
}
