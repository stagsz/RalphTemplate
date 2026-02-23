/**
 * Compliance type definitions for HazOp Assistant.
 *
 * This module defines types for regulatory compliance validation, including:
 * - Regulatory standards (IEC 61511, ISO 31000, ISO 9001, etc.)
 * - Compliance requirements and clauses
 * - Compliance checks and validation results
 *
 * Reference Standards:
 * - IEC 61511: Functional safety - Safety instrumented systems for the process industry sector
 * - ISO 31000: Risk management - Guidelines
 * - ISO 9001: Quality management systems - Requirements
 * - ATEX/DSEAR: Equipment for explosive atmospheres directives
 * - PED: Pressure Equipment Directive (2014/68/EU)
 * - OSHA PSM: Process Safety Management (29 CFR 1910.119)
 * - EPA RMP: Risk Management Program (40 CFR Part 68)
 * - SEVESO III: Major-accident hazards directive (2012/18/EU)
 */

// ============================================================================
// Regulatory Standard Identifiers
// ============================================================================

/**
 * Identifier for regulatory standards supported by the HazOp Assistant.
 *
 * Each standard has specific requirements that must be verified during
 * HazOps analysis and LOPA assessment.
 */
export type RegulatoryStandardId =
  | 'IEC_61511'
  | 'ISO_31000'
  | 'ISO_9001'
  | 'ATEX_DSEAR'
  | 'PED'
  | 'OSHA_PSM'
  | 'EPA_RMP'
  | 'SEVESO_III';

/**
 * All regulatory standard IDs as a constant array.
 */
export const REGULATORY_STANDARD_IDS: readonly RegulatoryStandardId[] = [
  'IEC_61511',
  'ISO_31000',
  'ISO_9001',
  'ATEX_DSEAR',
  'PED',
  'OSHA_PSM',
  'EPA_RMP',
  'SEVESO_III',
] as const;

/**
 * Human-readable names for regulatory standards.
 */
export const REGULATORY_STANDARD_NAMES: Record<RegulatoryStandardId, string> = {
  IEC_61511: 'IEC 61511',
  ISO_31000: 'ISO 31000',
  ISO_9001: 'ISO 9001',
  ATEX_DSEAR: 'ATEX/DSEAR',
  PED: 'Pressure Equipment Directive (PED)',
  OSHA_PSM: 'OSHA Process Safety Management',
  EPA_RMP: 'EPA Risk Management Program',
  SEVESO_III: 'SEVESO III Directive',
};

/**
 * Full titles for regulatory standards.
 */
export const REGULATORY_STANDARD_TITLES: Record<RegulatoryStandardId, string> = {
  IEC_61511: 'Functional safety - Safety instrumented systems for the process industry sector',
  ISO_31000: 'Risk management - Guidelines',
  ISO_9001: 'Quality management systems - Requirements',
  ATEX_DSEAR: 'Equipment and protective systems intended for use in potentially explosive atmospheres',
  PED: 'Pressure Equipment Directive 2014/68/EU',
  OSHA_PSM: 'Process Safety Management of Highly Hazardous Chemicals (29 CFR 1910.119)',
  EPA_RMP: 'Chemical Accident Prevention Provisions (40 CFR Part 68)',
  SEVESO_III: 'Control of major-accident hazards involving dangerous substances (2012/18/EU)',
};

/**
 * Descriptions for each regulatory standard.
 */
export const REGULATORY_STANDARD_DESCRIPTIONS: Record<RegulatoryStandardId, string> = {
  IEC_61511:
    'International standard for safety instrumented systems (SIS) in the process industry. ' +
    'Covers the lifecycle of SIS from concept through decommissioning, including ' +
    'hazard and risk assessment, SIL determination, and verification.',
  ISO_31000:
    'International standard providing guidelines for managing risk faced by organizations. ' +
    'Establishes principles, framework, and process for risk management applicable to ' +
    'any type of risk regardless of cause or consequence.',
  ISO_9001:
    'International standard for quality management systems. Specifies requirements for ' +
    'organizations to demonstrate ability to consistently provide products/services ' +
    'meeting customer and regulatory requirements.',
  ATEX_DSEAR:
    'European directives covering equipment and protective systems for use in explosive ' +
    'atmospheres, and workplace protection. ATEX 2014/34/EU covers equipment, DSEAR ' +
    'implements workplace requirements in UK.',
  PED:
    'European directive for pressure equipment and assemblies with maximum allowable ' +
    'pressure > 0.5 bar. Covers design, manufacture, and conformity assessment of ' +
    'pressure vessels, piping, safety accessories.',
  OSHA_PSM:
    'US federal standard for preventing or minimizing consequences of catastrophic releases ' +
    'of highly hazardous chemicals. Requires Process Hazard Analysis (PHA), Operating ' +
    'Procedures, Training, Management of Change.',
  EPA_RMP:
    'US federal regulation requiring facilities using extremely hazardous substances to ' +
    'develop Risk Management Plans. Covers hazard assessment, prevention program, and ' +
    'emergency response.',
  SEVESO_III:
    'EU directive aimed at prevention and control of major accidents involving dangerous ' +
    'substances. Requires safety reports, emergency plans, and land-use planning for ' +
    'establishments storing hazardous materials.',
};

// ============================================================================
// Regulatory Standard Categories
// ============================================================================

/**
 * Category of regulatory standard.
 */
export type RegulatoryCategory =
  | 'functional_safety'
  | 'risk_management'
  | 'quality_management'
  | 'explosive_atmospheres'
  | 'pressure_equipment'
  | 'process_safety'
  | 'environmental'
  | 'major_hazards';

/**
 * All regulatory categories as a constant array.
 */
export const REGULATORY_CATEGORIES: readonly RegulatoryCategory[] = [
  'functional_safety',
  'risk_management',
  'quality_management',
  'explosive_atmospheres',
  'pressure_equipment',
  'process_safety',
  'environmental',
  'major_hazards',
] as const;

/**
 * Human-readable labels for regulatory categories.
 */
export const REGULATORY_CATEGORY_LABELS: Record<RegulatoryCategory, string> = {
  functional_safety: 'Functional Safety',
  risk_management: 'Risk Management',
  quality_management: 'Quality Management',
  explosive_atmospheres: 'Explosive Atmospheres',
  pressure_equipment: 'Pressure Equipment',
  process_safety: 'Process Safety',
  environmental: 'Environmental',
  major_hazards: 'Major Hazards',
};

/**
 * Mapping of standards to their primary category.
 */
export const REGULATORY_STANDARD_CATEGORIES: Record<RegulatoryStandardId, RegulatoryCategory> = {
  IEC_61511: 'functional_safety',
  ISO_31000: 'risk_management',
  ISO_9001: 'quality_management',
  ATEX_DSEAR: 'explosive_atmospheres',
  PED: 'pressure_equipment',
  OSHA_PSM: 'process_safety',
  EPA_RMP: 'environmental',
  SEVESO_III: 'major_hazards',
};

// ============================================================================
// Regulatory Standard Jurisdiction
// ============================================================================

/**
 * Geographic jurisdiction where the standard applies.
 */
export type RegulatoryJurisdiction =
  | 'international'
  | 'european_union'
  | 'united_states'
  | 'united_kingdom';

/**
 * All jurisdictions as a constant array.
 */
export const REGULATORY_JURISDICTIONS: readonly RegulatoryJurisdiction[] = [
  'international',
  'european_union',
  'united_states',
  'united_kingdom',
] as const;

/**
 * Human-readable labels for jurisdictions.
 */
export const REGULATORY_JURISDICTION_LABELS: Record<RegulatoryJurisdiction, string> = {
  international: 'International',
  european_union: 'European Union',
  united_states: 'United States',
  united_kingdom: 'United Kingdom',
};

/**
 * Mapping of standards to their jurisdiction.
 */
export const REGULATORY_STANDARD_JURISDICTIONS: Record<RegulatoryStandardId, RegulatoryJurisdiction> = {
  IEC_61511: 'international',
  ISO_31000: 'international',
  ISO_9001: 'international',
  ATEX_DSEAR: 'european_union',
  PED: 'european_union',
  OSHA_PSM: 'united_states',
  EPA_RMP: 'united_states',
  SEVESO_III: 'european_union',
};

// ============================================================================
// Regulatory Standard Definition
// ============================================================================

/**
 * Complete definition of a regulatory standard.
 */
export interface RegulatoryStandard {
  /** Unique identifier for the standard */
  id: RegulatoryStandardId;

  /** Short name (e.g., "IEC 61511") */
  name: string;

  /** Full official title */
  title: string;

  /** Description of the standard's purpose and scope */
  description: string;

  /** Primary category */
  category: RegulatoryCategory;

  /** Geographic jurisdiction */
  jurisdiction: RegulatoryJurisdiction;

  /** Current version/edition */
  version: string;

  /** Year of publication/last revision */
  year: number;

  /** Issuing organization */
  issuingBody: string;

  /** URL to official documentation (if publicly available) */
  url?: string;

  /** Whether this standard is mandatory for HazOps analysis */
  mandatory: boolean;

  /** Related standards that may also apply */
  relatedStandards: RegulatoryStandardId[];

  /** Clauses/sections that relate to HazOps methodology */
  relevantClauses: RegulatoryClause[];
}

// ============================================================================
// Regulatory Clause Definition
// ============================================================================

/**
 * A specific clause or section within a regulatory standard.
 */
export interface RegulatoryClause {
  /** Clause identifier (e.g., "8.1.2", "Clause 6") */
  id: string;

  /** Clause title */
  title: string;

  /** Description of the clause requirements */
  description: string;

  /** Keywords for searching/matching */
  keywords: string[];

  /** Whether this clause is mandatory vs. recommended */
  mandatory: boolean;

  /** Parent clause ID if this is a sub-clause */
  parentClauseId?: string;

  /** What aspect of HazOps this clause relates to */
  hazopsRelevance: HazopsRelevanceArea[];
}

/**
 * Area of HazOps methodology that a regulatory clause may relate to.
 */
export type HazopsRelevanceArea =
  | 'hazard_identification'
  | 'risk_assessment'
  | 'risk_ranking'
  | 'safeguards'
  | 'recommendations'
  | 'lopa'
  | 'sil_determination'
  | 'documentation'
  | 'team_composition'
  | 'methodology'
  | 'follow_up'
  | 'management_of_change';

/**
 * All HazOps relevance areas as a constant array.
 */
export const HAZOPS_RELEVANCE_AREAS: readonly HazopsRelevanceArea[] = [
  'hazard_identification',
  'risk_assessment',
  'risk_ranking',
  'safeguards',
  'recommendations',
  'lopa',
  'sil_determination',
  'documentation',
  'team_composition',
  'methodology',
  'follow_up',
  'management_of_change',
] as const;

/**
 * Human-readable labels for HazOps relevance areas.
 */
export const HAZOPS_RELEVANCE_AREA_LABELS: Record<HazopsRelevanceArea, string> = {
  hazard_identification: 'Hazard Identification',
  risk_assessment: 'Risk Assessment',
  risk_ranking: 'Risk Ranking',
  safeguards: 'Safeguards',
  recommendations: 'Recommendations',
  lopa: 'LOPA (Layers of Protection Analysis)',
  sil_determination: 'SIL Determination',
  documentation: 'Documentation',
  team_composition: 'Team Composition',
  methodology: 'Methodology',
  follow_up: 'Follow-up Actions',
  management_of_change: 'Management of Change',
};

// ============================================================================
// Compliance Check Types
// ============================================================================

/**
 * Status of a compliance check.
 */
export type ComplianceStatus =
  | 'compliant'
  | 'partially_compliant'
  | 'non_compliant'
  | 'not_applicable'
  | 'not_assessed';

/**
 * All compliance statuses as a constant array.
 */
export const COMPLIANCE_STATUSES: readonly ComplianceStatus[] = [
  'compliant',
  'partially_compliant',
  'non_compliant',
  'not_applicable',
  'not_assessed',
] as const;

/**
 * Human-readable labels for compliance statuses.
 */
export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  compliant: 'Compliant',
  partially_compliant: 'Partially Compliant',
  non_compliant: 'Non-Compliant',
  not_applicable: 'Not Applicable',
  not_assessed: 'Not Assessed',
};

/**
 * Colors for compliance status display.
 */
export const COMPLIANCE_STATUS_COLORS: Record<ComplianceStatus, string> = {
  compliant: '#22c55e', // Green
  partially_compliant: '#f59e0b', // Amber
  non_compliant: '#ef4444', // Red
  not_applicable: '#6b7280', // Gray
  not_assessed: '#9ca3af', // Light gray
};

/**
 * Result of a single compliance check.
 */
export interface ComplianceCheckResult {
  /** ID of the clause being checked */
  clauseId: string;

  /** ID of the standard the clause belongs to */
  standardId: RegulatoryStandardId;

  /** Compliance status */
  status: ComplianceStatus;

  /** Evidence/justification for the status */
  evidence: string;

  /** Gaps identified (for partially compliant or non-compliant) */
  gaps: string[];

  /** Recommendations for achieving compliance */
  recommendations: string[];

  /** ID of user who performed the check */
  assessedById?: string;

  /** Timestamp of assessment */
  assessedAt?: Date;
}

/**
 * Summary of compliance for a single standard.
 */
export interface StandardComplianceSummary {
  /** Standard ID */
  standardId: RegulatoryStandardId;

  /** Standard name */
  standardName: string;

  /** Total clauses assessed */
  totalClauses: number;

  /** Number of compliant clauses */
  compliantCount: number;

  /** Number of partially compliant clauses */
  partiallyCompliantCount: number;

  /** Number of non-compliant clauses */
  nonCompliantCount: number;

  /** Number of not applicable clauses */
  notApplicableCount: number;

  /** Number of not assessed clauses */
  notAssessedCount: number;

  /** Overall compliance percentage (compliant + partially compliant) */
  compliancePercentage: number;

  /** Overall status based on clause assessment */
  overallStatus: ComplianceStatus;
}

/**
 * Complete compliance report for a project or analysis.
 */
export interface ComplianceReport {
  /** Unique ID of the report */
  id: string;

  /** ID of the project being assessed */
  projectId: string;

  /** ID of the analysis being assessed (optional) */
  analysisId?: string;

  /** Standards included in this assessment */
  standardsAssessed: RegulatoryStandardId[];

  /** Summaries for each standard */
  standardSummaries: StandardComplianceSummary[];

  /** All individual check results */
  checkResults: ComplianceCheckResult[];

  /** Overall compliance status across all standards */
  overallStatus: ComplianceStatus;

  /** Overall compliance percentage */
  overallCompliancePercentage: number;

  /** High-priority gaps requiring immediate attention */
  criticalGaps: ComplianceGap[];

  /** Generated timestamp */
  generatedAt: Date;

  /** User who generated the report */
  generatedById: string;
}

/**
 * A compliance gap identified during assessment.
 */
export interface ComplianceGap {
  /** ID of the gap */
  id: string;

  /** Standard ID */
  standardId: RegulatoryStandardId;

  /** Clause ID */
  clauseId: string;

  /** Description of the gap */
  description: string;

  /** Severity of the gap */
  severity: 'critical' | 'major' | 'minor';

  /** Recommended remediation actions */
  remediation: string[];
}

// ============================================================================
// Compliance Validation Types
// ============================================================================

/**
 * Input for compliance validation.
 */
export interface ComplianceValidationInput {
  /** Project ID to validate */
  projectId: string;

  /** Specific analysis ID (optional, validates all if not provided) */
  analysisId?: string;

  /** Standards to validate against */
  standards: RegulatoryStandardId[];

  /** Whether to include recommendations in results */
  includeRecommendations: boolean;
}

/**
 * Result of compliance validation.
 */
export interface ComplianceValidationResult {
  /** Whether validation was successful */
  success: boolean;

  /** Overall compliance status */
  overallStatus: ComplianceStatus;

  /** Summary by standard */
  summaries: StandardComplianceSummary[];

  /** Any errors encountered during validation */
  errors: string[];
}

// ============================================================================
// API Payload Types
// ============================================================================

/**
 * Query parameters for listing regulatory standards.
 */
export interface ListRegulatoryStandardsQuery {
  /** Filter by category */
  category?: RegulatoryCategory;

  /** Filter by jurisdiction */
  jurisdiction?: RegulatoryJurisdiction;

  /** Filter by mandatory status */
  mandatory?: boolean;

  /** Filter by HazOps relevance area */
  relevanceArea?: HazopsRelevanceArea;
}

/**
 * Query parameters for compliance status endpoint.
 */
export interface ComplianceStatusQuery {
  /** Project ID */
  projectId: string;

  /** Analysis ID (optional) */
  analysisId?: string;

  /** Standards to check */
  standards?: RegulatoryStandardId[];
}

/**
 * Response for compliance status endpoint.
 */
export interface ComplianceStatusResponse {
  /** Project ID */
  projectId: string;

  /** Analysis ID if provided */
  analysisId?: string;

  /** Standards that were checked */
  standardsChecked: RegulatoryStandardId[];

  /** Overall status */
  overallStatus: ComplianceStatus;

  /** Overall percentage */
  overallPercentage: number;

  /** Summary per standard */
  summaries: StandardComplianceSummary[];

  /** Timestamp of check */
  checkedAt: Date;
}
