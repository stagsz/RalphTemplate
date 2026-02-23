/**
 * Template selector component with preview.
 *
 * Displays available report templates in a selectable list/grid format with
 * a preview panel showing detailed template information. Supports filtering
 * by format and integrates with the report request workflow.
 *
 * Features:
 * - Selectable template cards with name, description, and format badges
 * - Preview panel showing full template details when selected
 * - Format filtering (filters templates by supported formats)
 * - Empty state for when no templates match the filter
 */

import { useMemo } from 'react';
import type {
  ReportFormat,
  ReportTemplateWithCreator,
} from '@hazop/types';
import { REPORT_FORMAT_LABELS } from '@hazop/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the TemplateSelector component.
 */
export interface TemplateSelectorProps {
  /** Available templates to display */
  templates: ReportTemplateWithCreator[];

  /** Currently selected template ID */
  selectedTemplateId: string | null;

  /** Callback when a template is selected */
  onSelect: (templateId: string | null) => void;

  /** Optional: Filter templates by supported format */
  filterFormat?: ReportFormat | null;

  /** Optional: Disable interactions */
  disabled?: boolean;

  /** Optional: Additional CSS classes */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Format colors for format badges.
 */
const FORMAT_COLORS: Record<ReportFormat, string> = {
  pdf: 'bg-red-50 text-red-700 border-red-200',
  word: 'bg-blue-50 text-blue-700 border-blue-200',
  excel: 'bg-green-50 text-green-700 border-green-200',
  powerpoint: 'bg-orange-50 text-orange-700 border-orange-200',
};

/**
 * Format icons (abbreviations).
 */
const FORMAT_ICONS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  word: 'DOC',
  excel: 'XLS',
  powerpoint: 'PPT',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date for display.
 */
function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Format badge component.
 */
interface FormatBadgeProps {
  format: ReportFormat;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

function FormatBadge({ format, showLabel = false, size = 'sm' }: FormatBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded border ${sizeClasses} ${FORMAT_COLORS[format]}`}
    >
      {FORMAT_ICONS[format]}
      {showLabel && <span className="ml-0.5">{REPORT_FORMAT_LABELS[format]}</span>}
    </span>
  );
}

/**
 * Section header component for preview panel.
 */
interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
      {title}
    </h4>
  );
}

/**
 * Metadata row component for preview panel.
 */
interface MetadataRowProps {
  label: string;
  value: React.ReactNode;
}

function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}

/**
 * Template card component.
 */
interface TemplateCardProps {
  template: ReportTemplateWithCreator;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  highlightFormat?: ReportFormat | null;
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
  disabled = false,
  highlightFormat,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`
        w-full text-left p-3 rounded border transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-slate-900 leading-tight pr-2">
          {template.name}
        </h4>
        {isSelected && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
            ✓
          </span>
        )}
      </div>

      {template.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {template.supportedFormats.map((format) => (
          <FormatBadge
            key={format}
            format={format}
            size="sm"
          />
        ))}
      </div>
    </button>
  );
}

/**
 * Template preview panel component.
 */
interface TemplatePreviewPanelProps {
  template: ReportTemplateWithCreator;
  onDeselect: () => void;
}

function TemplatePreviewPanel({ template, onDeselect }: TemplatePreviewPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
          <button
            type="button"
            onClick={onDeselect}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 -m-1"
            title="Deselect template"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {template.description && (
          <p className="text-sm text-slate-600">{template.description}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Supported Formats */}
        <div>
          <SectionHeader title="Supported Formats" />
          <div className="flex flex-wrap gap-2">
            {template.supportedFormats.map((format) => (
              <FormatBadge key={format} format={format} showLabel size="md" />
            ))}
          </div>
        </div>

        {/* Template Details */}
        <div>
          <SectionHeader title="Template Details" />
          <div className="bg-slate-50 rounded p-3 divide-y divide-slate-100">
            <MetadataRow label="Created" value={formatDate(template.createdAt)} />
            <MetadataRow
              label="Created By"
              value={
                <span>
                  {template.createdByName}
                  <span className="text-slate-400 text-xs ml-1">
                    ({template.createdByEmail})
                  </span>
                </span>
              }
            />
            <MetadataRow
              label="Status"
              value={
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                    template.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              }
            />
          </div>
        </div>

        {/* Format Descriptions */}
        <div>
          <SectionHeader title="Output Options" />
          <div className="space-y-2 text-sm">
            {template.supportedFormats.map((format) => (
              <div key={format} className="flex items-start gap-2">
                <FormatBadge format={format} size="sm" />
                <span className="text-slate-600">
                  {format === 'pdf' && 'Formal documentation for regulatory review'}
                  {format === 'word' && 'Editable document for customization'}
                  {format === 'excel' && 'Data tables for analysis and processing'}
                  {format === 'powerpoint' && 'Presentation for stakeholder communication'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with selection confirmation */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-xs">
            ✓
          </span>
          <span className="font-medium">Template selected</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component.
 */
interface EmptyStateProps {
  filterFormat?: ReportFormat | null;
}

function EmptyState({ filterFormat }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h4 className="text-sm font-medium text-slate-700 mb-1">
        No templates available
      </h4>
      <p className="text-xs text-slate-500">
        {filterFormat
          ? `No templates support ${REPORT_FORMAT_LABELS[filterFormat]} format`
          : 'No report templates have been configured'
        }
      </p>
    </div>
  );
}

/**
 * No selection state component.
 */
function NoSelectionState() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded h-full flex items-center justify-center">
      <div className="text-center p-6">
        <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </div>
        <h4 className="text-sm font-medium text-slate-700 mb-1">
          Select a template
        </h4>
        <p className="text-xs text-slate-500">
          Choose a template from the list to see its details
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * TemplateSelector component.
 *
 * Provides a template selection interface with preview functionality.
 * Templates can be filtered by format and display detailed information
 * when selected.
 */
export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  filterFormat,
  disabled = false,
  className = '',
}: TemplateSelectorProps) {
  /**
   * Filter templates based on format.
   */
  const filteredTemplates = useMemo(() => {
    if (!filterFormat) return templates;
    return templates.filter((t) => t.supportedFormats.includes(filterFormat));
  }, [templates, filterFormat]);

  /**
   * Get the currently selected template.
   */
  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  /**
   * Handle template selection.
   */
  const handleSelect = (templateId: string) => {
    if (disabled) return;
    // Toggle selection if clicking the same template
    if (templateId === selectedTemplateId) {
      onSelect(null);
    } else {
      onSelect(templateId);
    }
  };

  /**
   * Handle deselection.
   */
  const handleDeselect = () => {
    if (disabled) return;
    onSelect(null);
  };

  // Empty state
  if (filteredTemplates.length === 0) {
    return (
      <div className={`bg-white border border-slate-200 rounded p-4 ${className}`}>
        <EmptyState filterFormat={filterFormat} />
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Template List */}
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Available Templates
            </h3>
            <span className="text-xs text-slate-500">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={template.id === selectedTemplateId}
                onSelect={() => handleSelect(template.id)}
                disabled={disabled}
                highlightFormat={filterFormat}
              />
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="min-h-[320px]">
          {selectedTemplate ? (
            <TemplatePreviewPanel
              template={selectedTemplate}
              onDeselect={handleDeselect}
            />
          ) : (
            <NoSelectionState />
          )}
        </div>
      </div>
    </div>
  );
}
