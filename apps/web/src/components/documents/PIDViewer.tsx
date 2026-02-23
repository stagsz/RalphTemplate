import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Loader, Alert } from '@mantine/core';
import { documentsService } from '../../services/documents.service';
import type { PIDDocumentWithUploader, ApiError } from '@hazop/types';

/**
 * Zoom level constraints.
 */
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

/**
 * Props for the PIDViewer component.
 */
interface PIDViewerProps {
  /** The document to display */
  document: PIDDocumentWithUploader;
  /** Optional CSS class name */
  className?: string;
  /** Height of the viewer in pixels (default: 600) */
  height?: number;
}

/**
 * P&ID Viewer component with zoom and pan functionality.
 *
 * Features:
 * - Zoom in/out with buttons or mouse wheel
 * - Pan by clicking and dragging
 * - Fit to screen option
 * - Support for PDF (first page), PNG, and JPG formats
 * - Keyboard controls (+ to zoom in, - to zoom out, 0 to reset)
 *
 * Note: For PDF documents, only the first page is displayed as an image
 * using browser PDF rendering is not reliable across browsers. For full
 * PDF viewing, consider a dedicated PDF viewer component in the future.
 */
export function PIDViewer({
  document,
  className = '',
  height = 600,
}: PIDViewerProps) {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Image dimensions
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  /**
   * Fetch the document download URL.
   */
  useEffect(() => {
    let isMounted = true;

    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);

      // For PDF documents, we'll attempt to load them as images
      // Note: PDFs need server-side rendering or pdf.js for full support
      const isPdf = document.mimeType === 'application/pdf';

      if (isPdf) {
        // PDF viewing requires special handling
        // For now, we'll show a placeholder message
        // In future, integrate pdf.js or server-side thumbnail generation
        setError({
          code: 'PDF_NOT_SUPPORTED',
          message: 'PDF preview is not yet available. Please download the document to view it.',
        });
        setIsLoading(false);
        return;
      }

      const result = await documentsService.getDownloadUrl(document.id);

      if (!isMounted) return;

      if (result.success && result.data) {
        setImageUrl(result.data.url);
      } else {
        setError(result.error || { code: 'UNKNOWN', message: 'Failed to load document' });
      }

      setIsLoading(false);
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [document.id, document.mimeType]);

  /**
   * Handle image load to get natural dimensions.
   */
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setNaturalWidth(imageRef.current.naturalWidth);
      setNaturalHeight(imageRef.current.naturalHeight);

      // Calculate initial zoom to fit the image in the container
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const imageWidth = imageRef.current.naturalWidth;
        const imageHeight = imageRef.current.naturalHeight;

        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        const initialZoom = Math.min(scaleX, scaleY, 1);

        setZoom(initialZoom);
        setPosition({ x: 0, y: 0 });
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Handle image load error.
   */
  const handleImageError = useCallback(() => {
    setError({ code: 'LOAD_ERROR', message: 'Failed to load the image. The file may be corrupted or inaccessible.' });
    setIsLoading(false);
  }, []);

  /**
   * Zoom in by one step.
   */
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  /**
   * Zoom out by one step.
   */
  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  /**
   * Fit image to the container.
   */
  const handleFitToScreen = useCallback(() => {
    if (containerRef.current && naturalWidth && naturalHeight) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const scaleX = containerWidth / naturalWidth;
      const scaleY = containerHeight / naturalHeight;
      const fitZoom = Math.min(scaleX, scaleY);

      setZoom(fitZoom);
      setPosition({ x: 0, y: 0 });
    }
  }, [naturalWidth, naturalHeight]);

  /**
   * Reset zoom to 100%.
   */
  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  /**
   * Handle mouse wheel zoom.
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setZoom((prev) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(prev + delta, MAX_ZOOM));
      return newZoom;
    });
  }, []);

  /**
   * Handle mouse down for panning.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  }, [position]);

  /**
   * Handle mouse move for panning.
   */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  /**
   * Handle mouse up to stop panning.
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle mouse leave to stop panning.
   */
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle keyboard shortcuts.
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        handleZoomIn();
        break;
      case '-':
        e.preventDefault();
        handleZoomOut();
        break;
      case '0':
        e.preventDefault();
        handleResetZoom();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        handleFitToScreen();
        break;
    }
  }, [handleZoomIn, handleZoomOut, handleResetZoom, handleFitToScreen]);

  /**
   * Get zoom percentage for display.
   */
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-t">
        <div className="flex items-center gap-2">
          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM || isLoading || !!error}
            title="Zoom out (-)"
            styles={{
              root: { borderRadius: '4px' },
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                clipRule="evenodd"
              />
            </svg>
          </Button>

          <span className="text-sm text-slate-600 min-w-[50px] text-center font-mono">
            {zoomPercentage}%
          </span>

          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM || isLoading || !!error}
            title="Zoom in (+)"
            styles={{
              root: { borderRadius: '4px' },
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </Button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleFitToScreen}
            disabled={isLoading || !!error || !naturalWidth}
            title="Fit to screen (F)"
            styles={{
              root: { borderRadius: '4px' },
            }}
          >
            Fit
          </Button>

          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleResetZoom}
            disabled={isLoading || !!error}
            title="Reset zoom (0)"
            styles={{
              root: { borderRadius: '4px' },
            }}
          >
            100%
          </Button>
        </div>

        <div className="text-xs text-slate-500">
          {document.filename}
          {naturalWidth > 0 && naturalHeight > 0 && (
            <span className="ml-2">
              ({naturalWidth} × {naturalHeight} px)
            </span>
          )}
        </div>
      </div>

      {/* Viewer area */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden bg-slate-100 border border-t-0 border-slate-200 rounded-b ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ height }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label={`P&ID viewer for ${document.filename}. Use +/- to zoom, drag to pan.`}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <Loader size="md" color="blue" />
              <p className="mt-2 text-sm text-slate-500">Loading document...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <Alert
              color={error.code === 'PDF_NOT_SUPPORTED' ? 'blue' : 'red'}
              variant="light"
              title={error.code === 'PDF_NOT_SUPPORTED' ? 'PDF Preview' : 'Error'}
              styles={{
                root: { borderRadius: '4px', maxWidth: '400px' },
              }}
            >
              {error.message}
            </Alert>
          </div>
        )}

        {/* Image */}
        {imageUrl && !error && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: '100%',
              height: '100%',
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={document.filename}
              className="select-none"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          </div>
        )}

        {/* Help hint */}
        {!isLoading && !error && imageUrl && (
          <div className="absolute bottom-3 left-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
            Scroll to zoom • Drag to pan • Press F to fit
          </div>
        )}
      </div>
    </div>
  );
}
