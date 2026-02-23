/**
 * Unit tests for P&ID metadata extraction service.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Readable } from 'stream';

// Mock sharp module
const mockSharpMetadata = jest.fn<
  () => Promise<{
    width?: number;
    height?: number;
    format?: string;
    space?: string;
    channels?: number;
    depth?: string;
    density?: number;
    hasAlpha?: boolean;
  }>
>();

const mockSharp = jest.fn(() => ({
  metadata: mockSharpMetadata,
}));

jest.unstable_mockModule('sharp', () => ({
  default: mockSharp,
}));

// Mock pdf-lib module
const mockGetPages = jest.fn<() => Array<{ getSize: () => { width: number; height: number } }>>();
const mockGetTitle = jest.fn<() => string | undefined>();
const mockGetAuthor = jest.fn<() => string | undefined>();
const mockGetSubject = jest.fn<() => string | undefined>();
const mockGetCreator = jest.fn<() => string | undefined>();
const mockGetProducer = jest.fn<() => string | undefined>();
const mockGetCreationDate = jest.fn<() => Date | undefined>();
const mockGetModificationDate = jest.fn<() => Date | undefined>();

const mockPDFDocumentLoad = jest.fn<
  () => Promise<{
    getPages: typeof mockGetPages;
    getTitle: typeof mockGetTitle;
    getAuthor: typeof mockGetAuthor;
    getSubject: typeof mockGetSubject;
    getCreator: typeof mockGetCreator;
    getProducer: typeof mockGetProducer;
    getCreationDate: typeof mockGetCreationDate;
    getModificationDate: typeof mockGetModificationDate;
  }>
>();

jest.unstable_mockModule('pdf-lib', () => ({
  PDFDocument: {
    load: mockPDFDocumentLoad,
  },
}));

// Import the module under test after mocking
const { extractPIDMetadata, extractPIDMetadataFromBuffer } = await import('./pid-metadata.service.js');

describe('P&ID Metadata Extraction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractPIDMetadataFromBuffer', () => {
    describe('Image files (PNG, JPEG)', () => {
      it('should extract dimensions from PNG image', async () => {
        const buffer = Buffer.from('fake png data');

        mockSharpMetadata.mockResolvedValue({
          width: 1920,
          height: 1080,
          format: 'png',
          space: 'srgb',
          channels: 4,
          depth: 'uchar',
          hasAlpha: true,
        });

        const result = await extractPIDMetadataFromBuffer(buffer, 'image/png');

        expect(mockSharp).toHaveBeenCalledWith(buffer);
        expect(result.width).toBe(1920);
        expect(result.height).toBe(1080);
        expect(result.mimeType).toBe('image/png');
        expect(result.fileSize).toBe(buffer.length);
        expect(result.additionalInfo).toEqual(
          expect.objectContaining({
            format: 'png',
            hasAlpha: true,
          })
        );
      });

      it('should extract dimensions from JPEG image', async () => {
        const buffer = Buffer.from('fake jpeg data');

        mockSharpMetadata.mockResolvedValue({
          width: 3840,
          height: 2160,
          format: 'jpeg',
          space: 'srgb',
          channels: 3,
          hasAlpha: false,
        });

        const result = await extractPIDMetadataFromBuffer(buffer, 'image/jpeg');

        expect(result.width).toBe(3840);
        expect(result.height).toBe(2160);
        expect(result.mimeType).toBe('image/jpeg');
      });

      it('should handle images with missing dimensions', async () => {
        mockSharpMetadata.mockResolvedValue({
          format: 'png',
        });

        const result = await extractPIDMetadataFromBuffer(
          Buffer.from('data'),
          'image/png'
        );

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
      });
    });

    describe('PDF files', () => {
      it('should extract dimensions from first page of PDF', async () => {
        const buffer = Buffer.from('fake pdf data');

        mockGetPages.mockReturnValue([
          { getSize: () => ({ width: 612, height: 792 }) }, // Letter size
          { getSize: () => ({ width: 595, height: 842 }) }, // A4 size
        ]);
        mockGetTitle.mockReturnValue('Test P&ID');
        mockGetAuthor.mockReturnValue('Engineer');
        mockGetSubject.mockReturnValue(undefined);
        mockGetCreator.mockReturnValue('AutoCAD');
        mockGetProducer.mockReturnValue('Adobe PDF Library');
        mockGetCreationDate.mockReturnValue(new Date('2024-01-15'));
        mockGetModificationDate.mockReturnValue(new Date('2024-02-01'));

        mockPDFDocumentLoad.mockResolvedValue({
          getPages: mockGetPages,
          getTitle: mockGetTitle,
          getAuthor: mockGetAuthor,
          getSubject: mockGetSubject,
          getCreator: mockGetCreator,
          getProducer: mockGetProducer,
          getCreationDate: mockGetCreationDate,
          getModificationDate: mockGetModificationDate,
        });

        const result = await extractPIDMetadataFromBuffer(buffer, 'application/pdf');

        expect(mockPDFDocumentLoad).toHaveBeenCalledWith(buffer, {
          ignoreEncryption: true,
        });
        expect(result.width).toBe(612); // First page width
        expect(result.height).toBe(792); // First page height
        expect(result.mimeType).toBe('application/pdf');
        expect(result.additionalInfo).toEqual(
          expect.objectContaining({
            pageCount: 2,
            title: 'Test P&ID',
            author: 'Engineer',
            creator: 'AutoCAD',
          })
        );
      });

      it('should handle empty PDF with no pages', async () => {
        mockGetPages.mockReturnValue([]);
        mockGetTitle.mockReturnValue(undefined);
        mockGetAuthor.mockReturnValue(undefined);
        mockGetSubject.mockReturnValue(undefined);
        mockGetCreator.mockReturnValue(undefined);
        mockGetProducer.mockReturnValue(undefined);
        mockGetCreationDate.mockReturnValue(undefined);
        mockGetModificationDate.mockReturnValue(undefined);

        mockPDFDocumentLoad.mockResolvedValue({
          getPages: mockGetPages,
          getTitle: mockGetTitle,
          getAuthor: mockGetAuthor,
          getSubject: mockGetSubject,
          getCreator: mockGetCreator,
          getProducer: mockGetProducer,
          getCreationDate: mockGetCreationDate,
          getModificationDate: mockGetModificationDate,
        });

        const result = await extractPIDMetadataFromBuffer(
          Buffer.from('data'),
          'application/pdf'
        );

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
        expect(result.additionalInfo?.pageCount).toBe(0);
      });
    });

    describe('DWG files', () => {
      it('should return basic info for DWG files (dimensions not extractable)', async () => {
        const buffer = Buffer.from('AC1032fake dwg data');

        const result = await extractPIDMetadataFromBuffer(buffer, 'application/acad');

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
        expect(result.mimeType).toBe('application/acad');
        expect(result.fileSize).toBe(buffer.length);
        expect(result.additionalInfo).toEqual(
          expect.objectContaining({
            format: 'dwg',
            versionHeader: 'AC1032',
          })
        );
      });

      it('should handle various DWG MIME types', async () => {
        const dwgMimeTypes = [
          'application/x-acad',
          'application/dwg',
          'image/vnd.dwg',
          'application/octet-stream',
        ];

        for (const mimeType of dwgMimeTypes) {
          const result = await extractPIDMetadataFromBuffer(
            Buffer.from('AC1015data'),
            mimeType
          );

          expect(result.width).toBeNull();
          expect(result.height).toBeNull();
          expect(result.additionalInfo?.format).toBe('dwg');
        }
      });
    });

    describe('Unknown file types', () => {
      it('should return basic info for unsupported types', async () => {
        const buffer = Buffer.from('some binary data');

        const result = await extractPIDMetadataFromBuffer(
          buffer,
          'application/unknown'
        );

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
        expect(result.mimeType).toBe('application/unknown');
        expect(result.fileSize).toBe(buffer.length);
        expect(result.additionalInfo?.note).toBe(
          'Unsupported file type for dimension extraction'
        );
      });
    });
  });

  describe('extractPIDMetadata', () => {
    it('should read stream and extract metadata', async () => {
      const testData = Buffer.from('fake image data');
      const stream = Readable.from([testData]);

      mockSharpMetadata.mockResolvedValue({
        width: 800,
        height: 600,
        format: 'png',
      });

      const result = await extractPIDMetadata(stream, 'image/png');

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.fileSize).toBe(testData.length);
    });

    it('should handle stream with multiple chunks', async () => {
      const chunk1 = Buffer.from('chunk1');
      const chunk2 = Buffer.from('chunk2');
      const chunk3 = Buffer.from('chunk3');

      const stream = new Readable({
        read() {
          this.push(chunk1);
          this.push(chunk2);
          this.push(chunk3);
          this.push(null);
        },
      });

      mockSharpMetadata.mockResolvedValue({
        width: 100,
        height: 100,
        format: 'jpeg',
      });

      const result = await extractPIDMetadata(stream, 'image/jpeg');

      expect(result.fileSize).toBe(
        chunk1.length + chunk2.length + chunk3.length
      );
    });

    it('should handle stream errors', async () => {
      const errorStream = new Readable({
        read() {
          this.destroy(new Error('Stream read error'));
        },
      });

      await expect(
        extractPIDMetadata(errorStream, 'image/png')
      ).rejects.toThrow('Stream read error');
    });
  });
});
