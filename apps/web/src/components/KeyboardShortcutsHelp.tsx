/**
 * Keyboard shortcuts help dialog component.
 *
 * Displays available keyboard shortcuts in a modal dialog for user reference.
 * Can be triggered with Shift+? from anywhere in the analysis workspace.
 *
 * @module components/KeyboardShortcutsHelp
 */

import { Modal } from '@mantine/core';

/**
 * Shortcut category for grouping in the help dialog.
 */
interface ShortcutCategory {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

/**
 * Props for the KeyboardShortcutsHelp component.
 */
export interface KeyboardShortcutsHelpProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Detect if running on macOS for key display.
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Format modifier key for current platform.
 */
function formatModifier(modifier: 'Ctrl' | 'Alt' | 'Shift'): string {
  if (modifier === 'Ctrl') return isMac ? '⌘' : 'Ctrl';
  if (modifier === 'Alt') return isMac ? '⌥' : 'Alt';
  return modifier;
}

/**
 * Keyboard shortcuts organized by category.
 */
const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Guide Word Selection',
    shortcuts: [
      { keys: '1', description: 'Select NO guide word' },
      { keys: '2', description: 'Select MORE guide word' },
      { keys: '3', description: 'Select LESS guide word' },
      { keys: '4', description: 'Select REVERSE guide word' },
      { keys: '5', description: 'Select EARLY guide word' },
      { keys: '6', description: 'Select LATE guide word' },
      { keys: '7', description: 'Select OTHER THAN guide word' },
    ],
  },
  {
    title: 'Entry Actions',
    shortcuts: [
      { keys: `${formatModifier('Ctrl')}+Enter`, description: 'Submit entry (in deviation form)' },
      { keys: `${formatModifier('Ctrl')}+N`, description: 'Start new entry' },
      { keys: 'Escape', description: 'Clear selection / Cancel' },
    ],
  },
  {
    title: 'View Navigation',
    shortcuts: [
      { keys: `${formatModifier('Ctrl')}+T`, description: 'Toggle Entry/Summary view' },
      { keys: `${formatModifier('Alt')}+↑`, description: 'Select previous node' },
      { keys: `${formatModifier('Alt')}+↓`, description: 'Select next node' },
      { keys: '?', description: 'Show this help dialog' },
    ],
  },
  {
    title: 'P&ID Viewer',
    shortcuts: [
      { keys: '+ or =', description: 'Zoom in' },
      { keys: '-', description: 'Zoom out' },
      { keys: '0', description: 'Reset zoom to 100%' },
      { keys: 'F', description: 'Fit to screen' },
    ],
  },
];

/**
 * Keyboard shortcuts help dialog.
 *
 * Displays all available keyboard shortcuts organized by category.
 * Uses a clean, professional design matching the HazOp Assistant style.
 */
export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
      centered
      styles={{
        header: {
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 16px',
        },
        title: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#0f172a',
        },
        body: {
          padding: '0',
        },
        content: {
          borderRadius: '6px',
        },
      }}
    >
      <div className="divide-y divide-slate-200">
        {SHORTCUT_CATEGORIES.map((category) => (
          <div key={category.title} className="px-4 py-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {category.title}
            </h3>
            <div className="space-y-1.5">
              {category.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600">{shortcut.description}</span>
                  <kbd className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono text-slate-700">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500">
          Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">Esc</kbd> to close
        </p>
      </div>
    </Modal>
  );
}
