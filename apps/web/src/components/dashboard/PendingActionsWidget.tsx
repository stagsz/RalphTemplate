import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ANALYSIS_STATUS_LABELS } from '@hazop/types';
import { projectsService, type ProjectListItem } from '../../services/projects.service';
import { analysesService, type AnalysisListItem } from '../../services/analyses.service';

/**
 * Extended analysis item with project info for pending actions display.
 */
interface PendingAnalysis extends AnalysisListItem {
  /** Project ID this analysis belongs to */
  projectId: string;
  /** Project name for display */
  projectName: string;
}

/**
 * Pending Actions Widget for the dashboard.
 *
 * Displays analyses that are in 'in_review' status and need lead analyst approval.
 * Each item shows:
 * - Analysis name
 * - Project name
 * - Submitted date
 * - Entry count
 *
 * Design follows regulatory document aesthetic:
 * - Clean white background with subtle borders
 * - Clear typographic hierarchy
 * - Amber accent for review status
 * - Loading skeleton states
 * - Empty state messaging
 */
export function PendingActionsWidget() {
  const [pendingAnalyses, setPendingAnalyses] = useState<PendingAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch analyses in review status from all user projects.
   * Strategy: fetch all projects, then get in_review analyses from each.
   */
  const fetchPendingAnalyses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First fetch all user's projects
      const projectsResult = await projectsService.listProjects(
        {}, // no filters
        { sortBy: 'updated_at', sortOrder: 'desc' },
        { page: 1, limit: 100 }
      );

      if (!projectsResult.success || !projectsResult.data) {
        setError('Failed to load projects');
        setIsLoading(false);
        return;
      }

      const projects = projectsResult.data.data;

      if (projects.length === 0) {
        setPendingAnalyses([]);
        setIsLoading(false);
        return;
      }

      // Fetch in_review analyses from each project (in parallel)
      const analysesPromises = projects.map(async (project: ProjectListItem) => {
        const result = await analysesService.listAnalyses(
          project.id,
          { status: 'in_review' }, // Filter to only in_review status
          { sortBy: 'submitted_at', sortOrder: 'asc' }, // Oldest first (longest waiting)
          { page: 1, limit: 10 }
        );

        if (result.success && result.data) {
          return result.data.data.map((analysis) => ({
            ...analysis,
            projectId: project.id,
            projectName: project.name,
          }));
        }
        return [];
      });

      const allAnalyses = await Promise.all(analysesPromises);

      // Flatten and sort by submitted_at ascending (oldest first, needs attention)
      const flattenedAnalyses = allAnalyses
        .flat()
        .sort((a, b) => {
          // Sort by submittedAt, with null values at the end
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
          return dateA - dateB;
        })
        .slice(0, 5); // Show only top 5 pending

      setPendingAnalyses(flattenedAnalyses);
    } catch (err) {
      setError('Failed to load pending analyses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingAnalyses();
  }, [fetchPendingAnalyses]);

  /**
   * Format relative time for display.
   * Shows "Just now", "X minutes ago", "X hours ago", or date.
   */
  const formatRelativeTime = (date: Date | string | null): string => {
    if (!date) return 'Not submitted';

    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return then.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  /**
   * Loading skeleton state.
   */
  if (isLoading) {
    return (
      <section className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Pending Actions
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /**
   * Error state.
   */
  if (error) {
    return (
      <section className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Pending Actions
          </h3>
        </div>
        <div className="p-4">
          <div className="text-center py-4 text-red-600">
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={fetchPendingAnalyses}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  /**
   * Empty state when no pending analyses exist.
   */
  if (pendingAnalyses.length === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Pending Actions
          </h3>
        </div>
        <div className="p-4">
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No pending actions.</p>
            <p className="text-xs text-slate-400 mt-1">
              Items requiring your attention will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /**
   * Main content with pending analysis list.
   */
  return (
    <section className="bg-white border border-slate-200 rounded">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Pending Actions
        </h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
          {pendingAnalyses.length} pending
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {pendingAnalyses.map((analysis) => (
          <Link
            key={analysis.id}
            to={`/projects/${analysis.projectId}/analyses/${analysis.id}`}
            className="block px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {analysis.name}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    {ANALYSIS_STATUS_LABELS['in_review']}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {analysis.projectName}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-slate-500">
                  Submitted {formatRelativeTime(analysis.submittedAt)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {analysis.entryCount} {analysis.entryCount === 1 ? 'entry' : 'entries'}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500">
          These analyses are awaiting review and approval.
        </p>
      </div>
    </section>
  );
}
