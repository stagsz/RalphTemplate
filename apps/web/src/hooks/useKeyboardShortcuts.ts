/**
 * useKeyboardShortcuts hook for centralized keyboard shortcut management.
 *
 * Provides a composable system for registering and handling keyboard shortcuts
 * in the HazOp analysis workspace. Features:
 * - Global and scoped shortcut registration
 * - Modifier key support (Ctrl, Shift, Alt)
 * - Automatic cleanup on unmount
 * - Conflict detection with form inputs
 * - Accessibility-friendly (doesn't interfere with browser defaults)
 *
 * @module hooks/useKeyboardShortcuts
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Modifier keys for keyboard shortcuts.
 */
export interface KeyboardModifiers {
  /** Ctrl key (Cmd on macOS) */
  ctrl?: boolean;
  /** Shift key */
  shift?: boolean;
  /** Alt key (Option on macOS) */
  alt?: boolean;
  /** Meta key (Windows/Cmd key) */
  meta?: boolean;
}

/**
 * Keyboard shortcut definition.
 */
export interface KeyboardShortcut {
  /** The key to listen for (e.g., 'Enter', 's', '1') */
  key: string;
  /** Modifier keys required */
  modifiers?: KeyboardModifiers;
  /** Callback to execute when triggered */
  handler: (event: KeyboardEvent) => void;
  /** Human-readable description for help display */
  description: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
  /** Optional: only active when this condition is true */
  enabled?: boolean;
}

/**
 * Shortcut registration with a unique ID for cleanup.
 */
interface RegisteredShortcut extends KeyboardShortcut {
  id: string;
}

/**
 * Global shortcut registry for the help dialog.
 */
const globalShortcutRegistry: Map<string, { description: string; key: string; modifiers?: KeyboardModifiers }> = new Map();

/**
 * Format a shortcut for display (e.g., "Ctrl+S", "Shift+1").
 */
export function formatShortcut(key: string, modifiers?: KeyboardModifiers): string {
  const parts: string[] = [];

  // Use Cmd on macOS, Ctrl elsewhere (for display purposes)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  if (modifiers?.ctrl || modifiers?.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (modifiers?.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (modifiers?.shift) {
    parts.push('Shift');
  }

  // Format special keys for display
  const displayKey = key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key;
  parts.push(displayKey);

  return parts.join('+');
}

/**
 * Get all registered shortcuts for the help dialog.
 */
export function getRegisteredShortcuts(): Array<{ id: string; description: string; shortcut: string }> {
  return Array.from(globalShortcutRegistry.entries()).map(([id, { description, key, modifiers }]) => ({
    id,
    description,
    shortcut: formatShortcut(key, modifiers),
  }));
}

/**
 * Check if the event target is an interactive element where we shouldn't
 * intercept keyboard events.
 */
function isInteractiveElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isEditable = target.isContentEditable;
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

  // Allow shortcuts in inputs if Ctrl/Cmd is pressed (for Ctrl+S style shortcuts)
  return isEditable || isInput;
}

/**
 * Check if a keyboard event matches a shortcut definition.
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check key (case-insensitive for letter keys)
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  if (eventKey !== shortcutKey) return false;

  // Check modifiers
  const mods = shortcut.modifiers || {};

  // Support both Ctrl and Cmd (for cross-platform compatibility)
  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const wantsCtrlOrMeta = mods.ctrl || mods.meta;

  if (wantsCtrlOrMeta && !ctrlOrMeta) return false;
  if (!wantsCtrlOrMeta && ctrlOrMeta) return false;

  if (mods.shift && !event.shiftKey) return false;
  if (!mods.shift && event.shiftKey) return false;

  if (mods.alt && !event.altKey) return false;
  if (!mods.alt && event.altKey) return false;

  return true;
}

/**
 * Generate a unique ID for a shortcut based on its key and modifiers.
 */
function getShortcutId(key: string, modifiers?: KeyboardModifiers): string {
  const parts = [];
  if (modifiers?.ctrl) parts.push('ctrl');
  if (modifiers?.meta) parts.push('meta');
  if (modifiers?.shift) parts.push('shift');
  if (modifiers?.alt) parts.push('alt');
  parts.push(key.toLowerCase());
  return parts.join('+');
}

/**
 * Options for the useKeyboardShortcuts hook.
 */
export interface UseKeyboardShortcutsOptions {
  /** Array of keyboard shortcuts to register */
  shortcuts: KeyboardShortcut[];
  /** Whether shortcuts are active (default: true) */
  enabled?: boolean;
  /** Register shortcuts globally (for help dialog) */
  registerGlobally?: boolean;
  /** Allow shortcuts in input fields when modifier keys are pressed */
  allowInInputs?: boolean;
}

/**
 * Hook for managing keyboard shortcuts.
 *
 * @param options - Shortcut configuration options
 * @returns Object containing shortcut utilities
 *
 * @example
 * ```tsx
 * const { isShortcutActive } = useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 's',
 *       modifiers: { ctrl: true },
 *       handler: () => saveEntry(),
 *       description: 'Save entry',
 *       preventDefault: true,
 *     },
 *     {
 *       key: '1',
 *       handler: () => selectGuideWord('no'),
 *       description: 'Select NO guide word',
 *     },
 *   ],
 * });
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  registerGlobally = true,
  allowInInputs = true,
}: UseKeyboardShortcutsOptions): {
  /** Check if a specific shortcut is active */
  isShortcutActive: (key: string, modifiers?: KeyboardModifiers) => boolean;
} {
  // Store shortcuts with IDs
  const registeredShortcuts = useRef<RegisteredShortcut[]>([]);

  // Memoize shortcuts to avoid unnecessary re-registration
  const shortcutsMemo = useMemo(() => shortcuts, [JSON.stringify(shortcuts.map(s => ({ key: s.key, modifiers: s.modifiers, enabled: s.enabled })))]);

  // Update registered shortcuts
  useEffect(() => {
    registeredShortcuts.current = shortcutsMemo.map((shortcut) => ({
      ...shortcut,
      id: getShortcutId(shortcut.key, shortcut.modifiers),
    }));

    // Register globally for help dialog
    if (registerGlobally) {
      for (const shortcut of registeredShortcuts.current) {
        globalShortcutRegistry.set(shortcut.id, {
          description: shortcut.description,
          key: shortcut.key,
          modifiers: shortcut.modifiers,
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (registerGlobally) {
        for (const shortcut of registeredShortcuts.current) {
          globalShortcutRegistry.delete(shortcut.id);
        }
      }
    };
  }, [shortcutsMemo, registerGlobally]);

  // Event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if we should skip due to active input
      const isInInput = isInteractiveElement(event.target);

      for (const shortcut of registeredShortcuts.current) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Skip if in input and no modifier keys (allow Ctrl+S style in inputs)
        if (isInInput && !allowInInputs) continue;
        if (isInInput && !shortcut.modifiers?.ctrl && !shortcut.modifiers?.meta && !shortcut.modifiers?.alt) continue;

        if (matchesShortcut(event, shortcut)) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }
          shortcut.handler(event);
          return;
        }
      }
    },
    [enabled, allowInInputs]
  );

  // Attach event listener
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Utility to check if a shortcut is active
  const isShortcutActive = useCallback(
    (key: string, modifiers?: KeyboardModifiers): boolean => {
      const id = getShortcutId(key, modifiers);
      return registeredShortcuts.current.some((s) => s.id === id && s.enabled !== false);
    },
    []
  );

  return { isShortcutActive };
}

/**
 * Pre-defined shortcuts for the analysis workspace.
 * These can be imported and customized as needed.
 */
export const ANALYSIS_SHORTCUTS = {
  // Guide word navigation (1-7 keys)
  GUIDE_WORD_NO: { key: '1', description: 'Select NO guide word' },
  GUIDE_WORD_MORE: { key: '2', description: 'Select MORE guide word' },
  GUIDE_WORD_LESS: { key: '3', description: 'Select LESS guide word' },
  GUIDE_WORD_REVERSE: { key: '4', description: 'Select REVERSE guide word' },
  GUIDE_WORD_EARLY: { key: '5', description: 'Select EARLY guide word' },
  GUIDE_WORD_LATE: { key: '6', description: 'Select LATE guide word' },
  GUIDE_WORD_OTHER: { key: '7', description: 'Select OTHER THAN guide word' },

  // Entry actions
  SAVE_ENTRY: { key: 's', modifiers: { ctrl: true }, description: 'Save current entry' },
  NEW_ENTRY: { key: 'n', modifiers: { ctrl: true }, description: 'Start new entry' },
  DELETE_ENTRY: { key: 'Delete', modifiers: { ctrl: true }, description: 'Delete current entry' },

  // Navigation
  TOGGLE_VIEW: { key: 't', modifiers: { ctrl: true }, description: 'Toggle Entry/Summary view' },
  CLEAR_SELECTION: { key: 'Escape', description: 'Clear node selection' },
  SHOW_HELP: { key: '?', modifiers: { shift: true }, description: 'Show keyboard shortcuts' },

  // Node navigation
  NEXT_NODE: { key: 'ArrowDown', modifiers: { alt: true }, description: 'Select next node' },
  PREV_NODE: { key: 'ArrowUp', modifiers: { alt: true }, description: 'Select previous node' },
} as const;

export type AnalysisShortcutKey = keyof typeof ANALYSIS_SHORTCUTS;
