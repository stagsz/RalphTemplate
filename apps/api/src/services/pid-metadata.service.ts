/**
 * P&ID Metadata Extraction Service.
 *
 * Extracts metadata from P&ID documents including:
 * - Image dimensions (width, height) for PNG, JPEG
 * - Page dimensions for PDF documents
 * - Basic file info for DWG (dimensions not extractable without specialized tools)
 */

import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { Readable } from 'stream';

/**
 * Extracted metadata from a P&ID document.
 */
export interface PIDMetadata {
  /** Document width in pixels (or points for PDF) */
  width: number | null;
  /** Document height in pixels (or points for PDF) */
  height: number | null;
  /** MIME type detected from content */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Additional info (e.g., page count for PDFs) */
  additionalInfo?: Record<string, unknown>;
}

/**
 * Convert a readable stream to a Buffer.
 * Used to load file content for processing.
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Extract metadata from an image file (PNG, JPEG).
 * Uses sharp for efficient image processing.
 *
 * @param buffer - The image file content
 * @returns Extracted metadata with dimensions
 */
async function extractImageMetadata(buffer: Buffer): Promise<PIDMetadata> {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    mimeType: `image/${metadata.format}`,
    fileSize: buffer.length,
    additionalInfo: {
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
    },
  };
}

/**
 * Extract metadata from a PDF file.
 * Uses pdf-lib to parse PDF structure and extract page dimensions.
 *
 * For multi-page PDFs, returns dimensions of the first page.
 *
 * @param buffer - The PDF file content
 * @returns Extracted metadata with dimensions
 */
async function extractPDFMetadata(buffer: Buffer): Promise<PIDMetadata> {
  const pdfDoc = await PDFDocument.load(buffer, {
    ignoreEncryption: true, // Attempt to load encrypted PDFs
  });

  const pages = pdfDoc.getPages();
  const pageCount = pages.length;

  // Get dimensions of the first page (most P&IDs are single-page)
  let width: number | null = null;
  let height: number | null = null;

  if (pageCount > 0) {
    const firstPage = pages[0];
    const pageSize = firstPage.getSize();
    // PDF points are 1/72 inch, we keep them as-is
    width = Math.round(pageSize.width);
    height = Math.round(pageSize.height);
  }

  return {
    width,
    height,
    mimeType: 'application/pdf',
    fileSize: buffer.length,
    additionalInfo: {
      pageCount,
      title: pdfDoc.getTitle() ?? undefined,
      author: pdfDoc.getAuthor() ?? undefined,
      subject: pdfDoc.getSubject() ?? undefined,
      creator: pdfDoc.getCreator() ?? undefined,
      producer: pdfDoc.getProducer() ?? undefined,
      creationDate: pdfDoc.getCreationDate()?.toISOString() ?? undefined,
      modificationDate: pdfDoc.getModificationDate()?.toISOString() ?? undefined,
    },
  };
}

/**
 * Extract metadata from a DWG file.
 *
 * Note: DWG is a proprietary Autodesk format. Without specialized libraries
 * (like libredwg or ODA SDK), we cannot extract dimensions.
 * This function returns null dimensions with file size info.
 *
 * @param buffer - The DWG file content
 * @param mimeType - The original MIME type
 * @returns Basic metadata (dimensions will be null)
 */
function extractDWGMetadata(buffer: Buffer, mimeType: string): PIDMetadata {
  // DWG files start with "AC" followed by version (e.g., "AC1032" for AutoCAD 2018)
  const versionString =
    buffer.length >= 6 ? buffer.subarray(0, 6).toString('ascii') : 'unknown';

  return {
    width: null, // Cannot extract without specialized library
    height: null,
    mimeType,
    fileSize: buffer.length,
    additionalInfo: {
      format: 'dwg',
      versionHeader: versionString,
      note: 'DWG dimensions require AutoCAD or specialized library',
    },
  };
}

/**
 * List of image MIME types that can be processed by sharp.
 */
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

/**
 * List of PDF MIME types.
 */
const PDF_MIME_TYPES = ['application/pdf'];

/**
 * List of DWG MIME types (various vendor-specific types).
 */
const DWG_MIME_TYPES = [
  'application/acad',
  'application/x-acad',
  'application/dwg',
  'image/vnd.dwg',
  'application/octet-stream', // Fallback for DWG files
];

/**
 * Determine the file type from MIME type and potentially buffer content.
 */
function getFileType(
  mimeType: string
): 'image' | 'pdf' | 'dwg' | 'unknown' {
  if (IMAGE_MIME_TYPES.includes(mimeType)) {
    return 'image';
  }
  if (PDF_MIME_TYPES.includes(mimeType)) {
    return 'pdf';
  }
  if (DWG_MIME_TYPES.includes(mimeType)) {
    return 'dwg';
  }
  return 'unknown';
}

/**
 * Extract metadata from a P&ID document.
 *
 * Supports:
 * - PNG, JPEG images (full dimension extraction via sharp)
 * - PDF documents (first page dimensions via pdf-lib)
 * - DWG files (basic info only, dimensions require specialized tools)
 *
 * @param stream - Readable stream of the document content
 * @param mimeType - The document's MIME type
 * @returns Extracted metadata
 * @throws Error if extraction fails
 */
export async function extractPIDMetadata(
  stream: Readable,
  mimeType: string
): Promise<PIDMetadata> {
  const buffer = await streamToBuffer(stream);
  const fileType = getFileType(mimeType);

  switch (fileType) {
    case 'image':
      return extractImageMetadata(buffer);
    case 'pdf':
      return extractPDFMetadata(buffer);
    case 'dwg':
      return extractDWGMetadata(buffer, mimeType);
    default:
      // Return basic info for unknown types
      return {
        width: null,
        height: null,
        mimeType,
        fileSize: buffer.length,
        additionalInfo: {
          note: 'Unsupported file type for dimension extraction',
        },
      };
  }
}

/**
 * Extract metadata from a buffer directly.
 * Convenience function when file content is already in memory.
 *
 * @param buffer - The document content as a Buffer
 * @param mimeType - The document's MIME type
 * @returns Extracted metadata
 * @throws Error if extraction fails
 */
export async function extractPIDMetadataFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<PIDMetadata> {
  const fileType = getFileType(mimeType);

  switch (fileType) {
    case 'image':
      return extractImageMetadata(buffer);
    case 'pdf':
      return extractPDFMetadata(buffer);
    case 'dwg':
      return extractDWGMetadata(buffer, mimeType);
    default:
      return {
        width: null,
        height: null,
        mimeType,
        fileSize: buffer.length,
        additionalInfo: {
          note: 'Unsupported file type for dimension extraction',
        },
      };
  }
}
