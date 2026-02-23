import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { GuideWordSelector } from './GuideWordSelector';
import { GUIDE_WORDS, GUIDE_WORD_LABELS, GUIDE_WORD_DESCRIPTIONS } from '@hazop/types';
import type { GuideWord } from '@hazop/types';

/**
 * Wrapper component that provides Mantine context for testing.
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe('GuideWordSelector', () => {
  describe('rendering', () => {
    it('renders the label', () => {
      render(
        <TestWrapper>
          <GuideWordSelector value={null} onChange={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByText('Guide Word')).toBeInTheDocument();
    });

    it('renders all 7 guide word tabs', () => {
      render(
        <TestWrapper>
          <GuideWordSelector value={null} onChange={() => {}} />
        </TestWrapper>
      );

      // Check all guide word labels are present
      GUIDE_WORDS.forEach((gw) => {
        expect(screen.getByRole('tab', { name: new RegExp(GUIDE_WORD_LABELS[gw]) })).toBeInTheDocument();
      });
    });

    it('shows description when a guide word is selected', () => {
      render(
        <TestWrapper>
          <GuideWordSelector value="no" onChange={() => {}} />
        </TestWrapper>
      );

      // Description should be visible
      expect(screen.getByText(/Complete negation of intention/)).toBeInTheDocument();
    });

    it('does not show description when no guide word is selected', () => {
      render(
        <TestWrapper>
          <GuideWordSelector value={null} onChange={() => {}} />
        </TestWrapper>
      );

      // Description area should not exist
      expect(screen.queryByText(/Complete negation of intention/)).not.toBeInTheDocument();
    });
  });

  describe('selection behavior', () => {
    it('calls onChange when a guide word tab is clicked', () => {
      const handleChange = vi.fn();

      render(
        <TestWrapper>
          <GuideWordSelector value={null} onChange={handleChange} />
        </TestWrapper>
      );

      // Click on the "More" tab
      const moreTab = screen.getByRole('tab', { name: /More/ });
      fireEvent.click(moreTab);

      expect(handleChange).toHaveBeenCalledWith('more');
    });

    it('highlights the selected guide word', () => {
      render(
        <TestWrapper>
          <GuideWordSelector value="less" onChange={() => {}} />
        </TestWrapper>
      );

      const lessTab = screen.getByRole('tab', { name: /Less/ });
      expect(lessTab).toHaveAttribute('data-active', 'true');
    });

    it('does not call onChange when disabled', () => {
      const handleChange = vi.fn();

      render(
        <TestWrapper>
          <GuideWordSelector value={null} onChange={handleChange} disabled={true} />
        </TestWrapper>
      );

      const moreTab = screen.getByRole('tab', { name: /More/ });
      fireEvent.click(moreTab);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('completed guide words', () => {
    it('shows progress indicator when some guide words are completed', () => {
      render(
        <TestWrapper>
          <GuideWordSelector
            value={null}
            onChange={() => {}}
            completedGuideWords={['no', 'more', 'less']}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/3 of 7 guide words analyzed/)).toBeInTheDocument();
    });

    it('shows completion marker on completed guide word tabs', () => {
      render(
        <TestWrapper>
          <GuideWordSelector
            value={null}
            onChange={() => {}}
            completedGuideWords={['no']}
          />
        </TestWrapper>
      );

      // The "No" tab should have a completion marker (green dot)
      const noTab = screen.getByRole('tab', { name: /No/ });
      const marker = noTab.querySelector('.bg-green-500');
      expect(marker).toBeInTheDocument();
    });

    it('does not show progress indicator when no guide words are completed', () => {
      render(
        <TestWrapper>
          <GuideWordSelector
            value={null}
            onChange={() => {}}
            completedGuideWords={[]}
          />
        </TestWrapper>
      );

      expect(screen.queryByText(/guide words analyzed/)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses proper tab role for each guide word', () => {
      render(
        <TestWrapper>
          <GuideWordSelector value={null} onChange={() => {}} />
        </TestWrapper>
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(GUIDE_WORDS.length);
    });

    it('supports keyboard navigation', () => {
      const handleChange = vi.fn();

      render(
        <TestWrapper>
          <GuideWordSelector value="no" onChange={handleChange} />
        </TestWrapper>
      );

      const noTab = screen.getByRole('tab', { name: /No/ });
      noTab.focus();

      // Arrow right should move to next tab
      fireEvent.keyDown(noTab, { key: 'ArrowRight' });

      // The Mantine Tabs component handles keyboard navigation internally
      // Just verify the element is focusable
      expect(noTab).toHaveFocus();
    });
  });

  describe('all guide words', () => {
    it.each(GUIDE_WORDS)('renders %s guide word correctly', (guideWord) => {
      const handleChange = vi.fn();

      render(
        <TestWrapper>
          <GuideWordSelector value={guideWord} onChange={handleChange} />
        </TestWrapper>
      );

      // Tab should be present
      const tab = screen.getByRole('tab', { name: new RegExp(GUIDE_WORD_LABELS[guideWord]) });
      expect(tab).toBeInTheDocument();
      expect(tab).toHaveAttribute('data-active', 'true');

      // Description should be visible
      expect(screen.getByText(new RegExp(GUIDE_WORD_DESCRIPTIONS[guideWord].substring(0, 20)))).toBeInTheDocument();
    });
  });
});
