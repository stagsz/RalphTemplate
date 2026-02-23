import { useCallback } from 'react';
import { Tabs, Tooltip } from '@mantine/core';
import type { GuideWord } from '@hazop/types';
import { GUIDE_WORDS, GUIDE_WORD_LABELS, GUIDE_WORD_DESCRIPTIONS } from '@hazop/types';

/**
 * Props for the GuideWordSelector component.
 */
export interface GuideWordSelectorProps {
  /** Currently selected guide word (null if none selected) */
  value: GuideWord | null;

  /** Callback when a guide word is selected */
  onChange: (guideWord: GuideWord | null) => void;

  /** Whether the selector is disabled */
  disabled?: boolean;

  /** Guide words that have already been analyzed for the current node */
  completedGuideWords?: GuideWord[];
}

/**
 * Guide word selector component for HazOps analysis workflow.
 *
 * Uses a tab-based interface for quick navigation between the 7 standard
 * HazOps guide words. Each tab shows the guide word label with a tooltip
 * containing its description. Completed guide words are indicated with
 * a visual marker.
 *
 * Tab Navigation:
 * - NO: Complete negation of intention
 * - MORE: Quantitative increase
 * - LESS: Quantitative decrease
 * - REVERSE: Opposite of intention
 * - EARLY: Timing-related early occurrence
 * - LATE: Timing-related late occurrence
 * - OTHER THAN: Qualitative deviation
 */
export function GuideWordSelector({
  value,
  onChange,
  disabled = false,
  completedGuideWords = [],
}: GuideWordSelectorProps) {
  /**
   * Handle tab change.
   */
  const handleTabChange = useCallback(
    (newValue: string | null) => {
      if (disabled) return;
      onChange(newValue as GuideWord | null);
    },
    [disabled, onChange]
  );

  /**
   * Check if a guide word has been completed.
   */
  const isCompleted = useCallback(
    (guideWord: GuideWord): boolean => {
      return completedGuideWords.includes(guideWord);
    },
    [completedGuideWords]
  );

  return (
    <div className="guide-word-selector">
      <label className="block text-sm font-medium text-slate-700 mb-2">Guide Word</label>

      <Tabs
        value={value}
        onChange={handleTabChange}
        variant="outline"
        styles={{
          root: {
            '--tabs-list-border-width': '0px',
          },
          list: {
            flexWrap: 'wrap',
            gap: '4px',
            border: 'none',
          },
          tab: {
            fontWeight: 500,
            fontSize: '13px',
            padding: '8px 12px',
            color: '#64748b',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            transition: 'all 0.15s ease',
            '&:hover:not([data-active])': {
              backgroundColor: '#f8fafc',
              color: '#334155',
              borderColor: '#cbd5e1',
            },
            '&[data-active]': {
              color: '#1e40af',
              backgroundColor: '#eff6ff',
              borderColor: '#3b82f6',
              fontWeight: 600,
            },
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed',
            },
          },
        }}
      >
        <Tabs.List>
          {GUIDE_WORDS.map((guideWord) => (
            <Tooltip
              key={guideWord}
              label={GUIDE_WORD_DESCRIPTIONS[guideWord]}
              position="bottom"
              withArrow
              multiline
              w={250}
              styles={{
                tooltip: {
                  fontSize: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                },
              }}
            >
              <Tabs.Tab
                value={guideWord}
                disabled={disabled}
                rightSection={
                  isCompleted(guideWord) ? (
                    <span
                      className="w-2 h-2 rounded-full bg-green-500 ml-1"
                      title="Analysis entry exists"
                    />
                  ) : null
                }
              >
                {GUIDE_WORD_LABELS[guideWord]}
              </Tabs.Tab>
            </Tooltip>
          ))}
        </Tabs.List>
      </Tabs>

      {/* Description display when a guide word is selected */}
      {value && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              {GUIDE_WORD_LABELS[value]}:
            </span>{' '}
            {GUIDE_WORD_DESCRIPTIONS[value]}
          </p>
        </div>
      )}

      {/* Progress indicator */}
      {completedGuideWords.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>
            {completedGuideWords.length} of {GUIDE_WORDS.length} guide words analyzed
          </span>
        </div>
      )}
    </div>
  );
}
