/**
 * Prepared Recommendations service.
 *
 * Provides configurable templates for recommendations in HazOps analysis.
 * Recommendations are organized by equipment type and guide word to help analysts
 * quickly select relevant action items to reduce risk from identified hazards.
 *
 * Industry-standard recommendation categories include:
 * - Design modifications
 * - Instrumentation and control upgrades
 * - Safety system improvements
 * - Procedural enhancements
 * - Maintenance and inspection
 * - Training and competency
 * - Documentation updates
 * - Management of Change (MOC)
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  GuideWord,
  EquipmentType,
  PreparedAnswer,
  PreparedAnswerTemplate,
  PreparedAnswersResponse,
  PreparedAnswersFilteredResponse,
  PreparedAnswersQuery,
} from '@hazop/types';
import { EQUIPMENT_TYPES, GUIDE_WORDS } from '@hazop/types';

// ============================================================================
// Recommendation Templates by Category
// ============================================================================

/**
 * Design modification recommendations
 */
const DESIGN_MODIFICATION_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Install additional redundant equipment',
    description: 'Add backup/spare equipment to improve reliability and reduce single points of failure',
    isCommon: true,
  },
  {
    text: 'Increase equipment design pressure rating',
    description: 'Upgrade equipment to higher pressure class to provide greater margin of safety',
    equipmentTypes: ['reactor', 'tank', 'heat_exchanger', 'pipe'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Install larger relief capacity',
    description: 'Upgrade pressure relief devices to handle worst-case overpressure scenarios',
    equipmentTypes: ['reactor', 'tank', 'heat_exchanger'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Add secondary containment',
    description: 'Install bunding, dikes, or double-walled construction to contain leaks and spills',
    equipmentTypes: ['tank', 'pipe'],
    guideWords: ['other_than'],
    isCommon: true,
  },
  {
    text: 'Upgrade materials of construction',
    description: 'Replace with corrosion-resistant or higher-grade materials for improved durability',
    guideWords: ['other_than'],
  },
  {
    text: 'Install dedicated pump for critical service',
    description: 'Add separate pump to ensure availability for safety-critical applications',
    equipmentTypes: ['pump'],
    guideWords: ['no', 'less'],
  },
  {
    text: 'Add isolation capability',
    description: 'Install additional isolation valves to enable sectioning for maintenance or emergencies',
    equipmentTypes: ['valve', 'pipe'],
  },
  {
    text: 'Increase pipe size to reduce pressure drop',
    description: 'Upsize piping to improve flow capacity and reduce operating pressure',
    equipmentTypes: ['pipe'],
    guideWords: ['less'],
  },
  {
    text: 'Install flame/detonation arrestor',
    description: 'Add flame arrestor to prevent flame propagation in vent or process lines',
    equipmentTypes: ['tank', 'pipe'],
    guideWords: ['other_than'],
  },
  {
    text: 'Relocate equipment to safer area',
    description: 'Move equipment away from high-risk areas or congested locations',
    guideWords: ['other_than'],
  },
  {
    text: 'Install heat tracing system',
    description: 'Add electrical or steam heat tracing to prevent freezing or maintain viscosity',
    equipmentTypes: ['pipe', 'tank'],
    guideWords: ['less'],
  },
  {
    text: 'Add thermal insulation',
    description: 'Install insulation to maintain temperature and protect personnel from burns',
    equipmentTypes: ['pipe', 'reactor', 'heat_exchanger'],
    guideWords: ['more', 'less'],
  },
];

/**
 * Instrumentation and control upgrade recommendations
 */
const INSTRUMENTATION_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Install independent high-level switch (LSHH)',
    description: 'Add separate high-level protection independent from control system level measurement',
    equipmentTypes: ['tank', 'reactor'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Install independent low-level switch (LSLL)',
    description: 'Add separate low-level protection to prevent pump damage or loss of suction',
    equipmentTypes: ['tank', 'pump'],
    guideWords: ['no', 'less'],
    isCommon: true,
  },
  {
    text: 'Add independent high-pressure switch (PSHH)',
    description: 'Install separate pressure protection to trigger shutdown on overpressure',
    equipmentTypes: ['reactor', 'tank', 'heat_exchanger'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Install independent high-temperature switch (TSHH)',
    description: 'Add separate temperature protection for critical high-temperature conditions',
    equipmentTypes: ['reactor', 'heat_exchanger'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Add flow transmitter with alarm',
    description: 'Install flow measurement with high/low alarms to detect abnormal conditions',
    equipmentTypes: ['pump', 'pipe'],
    guideWords: ['more', 'less', 'no'],
    isCommon: true,
  },
  {
    text: 'Install gas detection system',
    description: 'Add combustible or toxic gas detectors with alarm and/or shutdown capability',
    guideWords: ['other_than'],
    isCommon: true,
  },
  {
    text: 'Upgrade control system reliability (SIL rating)',
    description: 'Improve safety integrity level of instrumented protective function',
    isCommon: true,
  },
  {
    text: 'Add redundant sensors (voting logic)',
    description: 'Install multiple sensors with 2oo3 or similar voting to reduce spurious trips',
  },
  {
    text: 'Install online analyzer',
    description: 'Add continuous composition analysis to detect off-spec conditions',
    equipmentTypes: ['reactor', 'tank'],
    guideWords: ['other_than'],
  },
  {
    text: 'Add vibration monitoring with trip',
    description: 'Install vibration sensors with automatic shutdown on high vibration',
    equipmentTypes: ['pump'],
    guideWords: ['other_than'],
  },
  {
    text: 'Install fire detection system',
    description: 'Add heat, smoke, or flame detection with automatic alarm and deluge activation',
    guideWords: ['other_than'],
  },
  {
    text: 'Upgrade DCS/BPCS control strategy',
    description: 'Improve control logic to better handle upsets and abnormal conditions',
    guideWords: ['more', 'less'],
  },
];

/**
 * Safety system improvement recommendations
 */
const SAFETY_SYSTEM_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Install Safety Instrumented System (SIS)',
    description: 'Add dedicated SIS to provide independent layer of protection',
    isCommon: true,
  },
  {
    text: 'Add emergency shutdown valve (ESV/SDV)',
    description: 'Install fail-safe shutdown valve for rapid isolation during emergencies',
    guideWords: ['more', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Install emergency depressuring system',
    description: 'Add capability to rapidly depressure equipment to safe level',
    equipmentTypes: ['reactor', 'tank'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Upgrade relief device capacity',
    description: 'Install larger PSV or add additional relief devices to handle worst-case scenarios',
    equipmentTypes: ['reactor', 'tank', 'heat_exchanger'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Add check valve to prevent backflow',
    description: 'Install non-return valve to prevent reverse flow conditions',
    equipmentTypes: ['pipe', 'pump'],
    guideWords: ['reverse'],
    isCommon: true,
  },
  {
    text: 'Install emergency quench/dump system',
    description: 'Add capability to rapidly terminate runaway reaction',
    equipmentTypes: ['reactor'],
    guideWords: ['more', 'early'],
    isCommon: true,
  },
  {
    text: 'Add deluge/water spray system',
    description: 'Install fixed fire suppression for equipment cooling and fire control',
    guideWords: ['other_than'],
  },
  {
    text: 'Install foam fire suppression',
    description: 'Add foam system for flammable liquid fire protection',
    equipmentTypes: ['tank'],
    guideWords: ['other_than'],
  },
  {
    text: 'Add restriction orifice',
    description: 'Install flow-limiting device to cap maximum release rate',
    equipmentTypes: ['pipe'],
    guideWords: ['more'],
  },
  {
    text: 'Install excess flow valve',
    description: 'Add automatic shutoff valve that closes on high flow indicating line rupture',
    equipmentTypes: ['pipe'],
    guideWords: ['more'],
  },
  {
    text: 'Upgrade interlock system',
    description: 'Improve or add interlocks to prevent hazardous operations',
  },
  {
    text: 'Install vacuum protection',
    description: 'Add vacuum relief valve or nitrogen blanketing to prevent tank collapse',
    equipmentTypes: ['tank'],
    guideWords: ['less'],
  },
];

/**
 * Procedural enhancement recommendations
 */
const PROCEDURAL_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Develop/update Standard Operating Procedure (SOP)',
    description: 'Create or revise written procedures to address identified hazard',
    isCommon: true,
  },
  {
    text: 'Add procedure step for manual verification',
    description: 'Include operator verification step to confirm safe conditions',
    isCommon: true,
  },
  {
    text: 'Implement pre-startup safety checklist',
    description: 'Require formal checklist completion before startup or restart',
    guideWords: ['early', 'other_than'],
  },
  {
    text: 'Establish lock-out/tag-out procedure',
    description: 'Create formal energy isolation procedure for maintenance activities',
  },
  {
    text: 'Add alarm response procedure',
    description: 'Document required operator actions for critical alarms',
    isCommon: true,
  },
  {
    text: 'Develop emergency response procedure',
    description: 'Create or update emergency procedures specific to identified scenario',
    isCommon: true,
  },
  {
    text: 'Implement permit-to-work for high-risk activities',
    description: 'Require formal authorization and controls for non-routine work',
  },
  {
    text: 'Add batch sheet verification step',
    description: 'Require documented confirmation of material quantities and sequences',
    equipmentTypes: ['reactor'],
    guideWords: ['other_than'],
  },
  {
    text: 'Implement independent verification (IV)',
    description: 'Require second person to verify critical actions',
    guideWords: ['other_than'],
  },
  {
    text: 'Establish shift handover procedure',
    description: 'Formalize communication of process status at shift changes',
    guideWords: ['late', 'other_than'],
  },
  {
    text: 'Create abnormal situation procedure',
    description: 'Document response procedures for upset conditions',
    guideWords: ['more', 'less', 'no'],
  },
];

/**
 * Maintenance and inspection recommendations
 */
const MAINTENANCE_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Add equipment to preventive maintenance program',
    description: 'Include in scheduled maintenance to prevent failures',
    isCommon: true,
  },
  {
    text: 'Increase inspection frequency',
    description: 'Conduct more frequent inspections to detect degradation earlier',
    isCommon: true,
  },
  {
    text: 'Add to corrosion monitoring program',
    description: 'Include equipment in thickness monitoring and corrosion tracking',
    guideWords: ['other_than'],
  },
  {
    text: 'Implement condition-based monitoring',
    description: 'Add predictive maintenance based on equipment condition indicators',
  },
  {
    text: 'Conduct mechanical integrity assessment',
    description: 'Perform engineering review of equipment fitness for service',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Add PSV testing to maintenance program',
    description: 'Include pressure safety valves in regular testing schedule',
    equipmentTypes: ['reactor', 'tank'],
    guideWords: ['more'],
  },
  {
    text: 'Perform process safety valve sizing review',
    description: 'Verify relief device capacity against current process conditions',
    equipmentTypes: ['reactor', 'tank', 'heat_exchanger'],
    guideWords: ['more'],
  },
  {
    text: 'Conduct instrument calibration review',
    description: 'Verify calibration procedures and frequencies for critical instruments',
  },
  {
    text: 'Add valve to actuator testing program',
    description: 'Include safety-critical valves in regular stroke testing',
    equipmentTypes: ['valve'],
  },
  {
    text: 'Implement RBI (Risk-Based Inspection)',
    description: 'Apply risk-based methodology to optimize inspection planning',
  },
];

/**
 * Training and competency recommendations
 */
const TRAINING_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Provide operator training on identified hazard',
    description: 'Train operators to recognize and respond to the specific hazard scenario',
    isCommon: true,
  },
  {
    text: 'Conduct emergency response drill',
    description: 'Practice emergency procedures through simulation exercises',
    isCommon: true,
  },
  {
    text: 'Add to operator certification requirements',
    description: 'Include topic in formal operator qualification and testing',
  },
  {
    text: 'Provide refresher training',
    description: 'Schedule periodic retraining on critical procedures and hazards',
  },
  {
    text: 'Implement competency assessment',
    description: 'Test operator knowledge and skills for critical tasks',
  },
  {
    text: 'Develop simulator-based training',
    description: 'Create process simulator scenarios to practice upset response',
    guideWords: ['more', 'less', 'no'],
  },
  {
    text: 'Share lessons learned from incident',
    description: 'Communicate findings to all relevant personnel',
    isCommon: true,
  },
  {
    text: 'Include in new employee orientation',
    description: 'Add hazard awareness to onboarding training program',
  },
];

/**
 * Documentation and management of change recommendations
 */
const DOCUMENTATION_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Update P&ID to reflect changes',
    description: 'Revise process and instrumentation diagrams to show modifications',
    isCommon: true,
  },
  {
    text: 'Update process hazard analysis (PHA)',
    description: 'Revise HazOp or other PHA to reflect new information',
    isCommon: true,
  },
  {
    text: 'Update operating envelope documentation',
    description: 'Revise safe operating limits documentation',
    guideWords: ['more', 'less'],
  },
  {
    text: 'Add to safeguards documentation',
    description: 'Document new safeguards in appropriate registers',
  },
  {
    text: 'Update safety case/safety report',
    description: 'Revise formal safety documentation for regulatory compliance',
  },
  {
    text: 'Initiate Management of Change (MOC)',
    description: 'Follow formal change management process for modifications',
    isCommon: true,
  },
  {
    text: 'Update equipment datasheet',
    description: 'Revise equipment specifications to reflect changes',
  },
  {
    text: 'Update cause and effect matrix',
    description: 'Revise logic documentation for protective systems',
  },
  {
    text: 'Create/update LOPA documentation',
    description: 'Document layers of protection analysis for the scenario',
  },
  {
    text: 'Add to process safety information (PSI)',
    description: 'Update process safety documentation with new information',
    isCommon: true,
  },
];

/**
 * Equipment-specific recommendations
 */
const EQUIPMENT_SPECIFIC_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  // Pump recommendations
  {
    text: 'Install minimum flow bypass',
    description: 'Add recirculation line to protect pump from deadheading',
    equipmentTypes: ['pump'],
    guideWords: ['no', 'less'],
    isCommon: true,
  },
  {
    text: 'Add pump dry-run protection',
    description: 'Install low suction pressure or level trip to prevent seal damage',
    equipmentTypes: ['pump'],
    guideWords: ['no'],
    isCommon: true,
  },
  {
    text: 'Install standby/spare pump',
    description: 'Add redundant pump to ensure critical service availability',
    equipmentTypes: ['pump'],
    guideWords: ['no'],
    isCommon: true,
  },
  {
    text: 'Upgrade pump seal system',
    description: 'Install improved mechanical seal or seal support system',
    equipmentTypes: ['pump'],
    guideWords: ['other_than'],
  },

  // Reactor recommendations
  {
    text: 'Install emergency cooling system',
    description: 'Add backup cooling capability for runaway reaction scenarios',
    equipmentTypes: ['reactor'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Add agitator interlock',
    description: 'Install interlock to prevent operation without proper mixing',
    equipmentTypes: ['reactor'],
    guideWords: ['other_than'],
  },
  {
    text: 'Install reaction inhibitor injection',
    description: 'Add capability to rapidly terminate runaway reaction',
    equipmentTypes: ['reactor'],
    guideWords: ['more', 'early'],
  },
  {
    text: 'Add batch sequencing automation',
    description: 'Automate critical addition sequences to prevent human error',
    equipmentTypes: ['reactor'],
    guideWords: ['early', 'late', 'other_than'],
  },

  // Heat exchanger recommendations
  {
    text: 'Install tube rupture detection',
    description: 'Add monitoring to detect tube failure between shell and tube sides',
    equipmentTypes: ['heat_exchanger'],
    guideWords: ['other_than'],
  },
  {
    text: 'Add high shell pressure trip',
    description: 'Install shutdown on high shell-side pressure indicating tube leak',
    equipmentTypes: ['heat_exchanger'],
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Install bypass around heat exchanger',
    description: 'Add bypass capability to allow operation during maintenance',
    equipmentTypes: ['heat_exchanger'],
  },

  // Tank recommendations
  {
    text: 'Install tank overflow protection',
    description: 'Add overflow line to safe location to prevent spills',
    equipmentTypes: ['tank'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Add tank venting capacity',
    description: 'Install or upgrade tank venting to handle worst-case scenarios',
    equipmentTypes: ['tank'],
    guideWords: ['more', 'less'],
  },
  {
    text: 'Install nitrogen blanketing system',
    description: 'Add inert gas blanketing to prevent flammable atmosphere',
    equipmentTypes: ['tank', 'reactor'],
    guideWords: ['other_than'],
  },
  {
    text: 'Add tank gauging system',
    description: 'Install independent level measurement for inventory management',
    equipmentTypes: ['tank'],
    guideWords: ['more', 'less'],
  },

  // Valve recommendations
  {
    text: 'Install double block and bleed',
    description: 'Add double isolation with bleed for positive isolation',
    equipmentTypes: ['valve', 'pipe'],
    guideWords: ['other_than'],
  },
  {
    text: 'Replace with fail-safe valve',
    description: 'Install valve with fail-safe position on loss of signal/air',
    equipmentTypes: ['valve'],
    guideWords: ['no', 'more', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Add position indicator/limit switch',
    description: 'Install confirmation of valve position in control room',
    equipmentTypes: ['valve'],
  },
  {
    text: 'Lock valve in safe position',
    description: 'Physically lock valve open or closed to prevent inadvertent operation',
    equipmentTypes: ['valve'],
  },

  // Pipe recommendations
  {
    text: 'Install leak detection on pipeline',
    description: 'Add monitoring to detect leaks in critical piping',
    equipmentTypes: ['pipe'],
    guideWords: ['other_than'],
  },
  {
    text: 'Upgrade pipe material/schedule',
    description: 'Replace with higher-grade material or thicker wall pipe',
    equipmentTypes: ['pipe'],
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Add pipe supports or restraints',
    description: 'Install additional supports to prevent vibration damage',
    equipmentTypes: ['pipe'],
    guideWords: ['other_than'],
  },
];

/**
 * Study and review recommendations
 */
const STUDY_REVIEW_RECOMMENDATIONS: PreparedAnswerTemplate[] = [
  {
    text: 'Conduct further HazOp study',
    description: 'Perform additional detailed analysis of the specific scenario',
  },
  {
    text: 'Perform quantitative risk assessment (QRA)',
    description: 'Conduct detailed probabilistic analysis of risk level',
    isCommon: true,
  },
  {
    text: 'Conduct LOPA study',
    description: 'Perform Layers of Protection Analysis to determine SIL requirements',
    isCommon: true,
  },
  {
    text: 'Review with process licensor',
    description: 'Consult technology provider on safe operating practices',
    guideWords: ['other_than'],
  },
  {
    text: 'Conduct consequence modeling',
    description: 'Perform dispersion, fire, or explosion modeling',
  },
  {
    text: 'Review historical incident data',
    description: 'Research similar incidents in industry databases',
  },
  {
    text: 'Conduct root cause analysis',
    description: 'Investigate underlying causes of identified hazard',
  },
  {
    text: 'Request engineering study',
    description: 'Commission detailed engineering review of design options',
    isCommon: true,
  },
  {
    text: 'Conduct alarm rationalization study',
    description: 'Review alarm settings and priorities for the area',
  },
  {
    text: 'Perform SIL verification study',
    description: 'Verify safety integrity level of protective function',
  },
];

// ============================================================================
// Combined Recommendation Templates
// ============================================================================

const ALL_RECOMMENDATION_TEMPLATES: PreparedAnswerTemplate[] = [
  ...DESIGN_MODIFICATION_RECOMMENDATIONS,
  ...INSTRUMENTATION_RECOMMENDATIONS,
  ...SAFETY_SYSTEM_RECOMMENDATIONS,
  ...PROCEDURAL_RECOMMENDATIONS,
  ...MAINTENANCE_RECOMMENDATIONS,
  ...TRAINING_RECOMMENDATIONS,
  ...DOCUMENTATION_RECOMMENDATIONS,
  ...EQUIPMENT_SPECIFIC_RECOMMENDATIONS,
  ...STUDY_REVIEW_RECOMMENDATIONS,
];

// ============================================================================
// Generated Prepared Answers
// ============================================================================

/**
 * Convert templates to prepared answers with generated IDs.
 */
function templatesToPreparedAnswers(templates: PreparedAnswerTemplate[]): PreparedAnswer[] {
  return templates.map((template, index) => ({
    id: uuidv4(),
    text: template.text,
    description: template.description,
    applicableEquipmentTypes: template.equipmentTypes ?? [],
    applicableGuideWords: template.guideWords ?? [],
    isCommon: template.isCommon ?? false,
    sortOrder: template.isCommon ? index : index + 1000, // Common answers first
  }));
}

// Pre-generated answers for consistent IDs within a session
let cachedAnswers: PreparedAnswer[] | null = null;

function getAllRecommendationAnswers(): PreparedAnswer[] {
  if (!cachedAnswers) {
    cachedAnswers = templatesToPreparedAnswers(ALL_RECOMMENDATION_TEMPLATES);
  }
  return cachedAnswers;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all prepared recommendations.
 *
 * @returns All prepared recommendation answers
 */
export function getAllPreparedRecommendations(): PreparedAnswersResponse {
  const answers = getAllRecommendationAnswers();

  return {
    category: 'recommendation',
    answers: answers.sort((a, b) => a.sortOrder - b.sortOrder),
    count: answers.length,
  };
}

/**
 * Get prepared recommendations filtered by context.
 *
 * @param query - Filter parameters
 * @returns Filtered prepared recommendations
 */
export function getPreparedRecommendationsFiltered(
  query: PreparedAnswersQuery
): PreparedAnswersFilteredResponse {
  let answers = getAllRecommendationAnswers();

  // Filter by equipment type
  if (query.equipmentType) {
    const equipmentType = query.equipmentType;
    answers = answers.filter(
      (a) =>
        a.applicableEquipmentTypes.length === 0 ||
        a.applicableEquipmentTypes.includes(equipmentType)
    );
  }

  // Filter by guide word
  if (query.guideWord) {
    const guideWord = query.guideWord;
    answers = answers.filter(
      (a) =>
        a.applicableGuideWords.length === 0 ||
        a.applicableGuideWords.includes(guideWord)
    );
  }

  // Filter by common only
  if (query.commonOnly) {
    answers = answers.filter((a) => a.isCommon);
  }

  // Filter by search text
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    answers = answers.filter(
      (a) =>
        a.text.toLowerCase().includes(searchLower) ||
        (a.description && a.description.toLowerCase().includes(searchLower))
    );
  }

  return {
    category: 'recommendation',
    answers: answers.sort((a, b) => a.sortOrder - b.sortOrder),
    count: answers.length,
    equipmentType: query.equipmentType ?? null,
    guideWord: query.guideWord ?? null,
  };
}

/**
 * Get prepared recommendations for a specific equipment type.
 *
 * @param equipmentType - The equipment type to filter by
 * @returns Prepared recommendations applicable to the equipment type
 */
export function getPreparedRecommendationsForEquipmentType(
  equipmentType: EquipmentType
): PreparedAnswersFilteredResponse {
  return getPreparedRecommendationsFiltered({ equipmentType });
}

/**
 * Get prepared recommendations for a specific guide word.
 *
 * @param guideWord - The guide word to filter by
 * @returns Prepared recommendations applicable to the guide word
 */
export function getPreparedRecommendationsForGuideWord(
  guideWord: GuideWord
): PreparedAnswersFilteredResponse {
  return getPreparedRecommendationsFiltered({ guideWord });
}

/**
 * Get prepared recommendations for a specific equipment type and guide word combination.
 *
 * @param equipmentType - The equipment type to filter by
 * @param guideWord - The guide word to filter by
 * @returns Prepared recommendations applicable to both filters
 */
export function getPreparedRecommendationsForContext(
  equipmentType: EquipmentType,
  guideWord: GuideWord
): PreparedAnswersFilteredResponse {
  return getPreparedRecommendationsFiltered({ equipmentType, guideWord });
}

/**
 * Search prepared recommendations by text.
 *
 * @param searchText - Text to search for in recommendation text and description
 * @returns Matching prepared recommendations
 */
export function searchPreparedRecommendations(searchText: string): PreparedAnswersResponse {
  const result = getPreparedRecommendationsFiltered({ search: searchText });
  return {
    category: result.category,
    answers: result.answers,
    count: result.count,
  };
}

/**
 * Get common/recommended prepared recommendations.
 *
 * @returns Only common/recommended recommendations
 */
export function getCommonPreparedRecommendations(): PreparedAnswersResponse {
  const result = getPreparedRecommendationsFiltered({ commonOnly: true });
  return {
    category: result.category,
    answers: result.answers,
    count: result.count,
  };
}

/**
 * Validate if a string is a valid equipment type.
 *
 * @param value - The value to validate
 * @returns True if valid equipment type
 */
export function isValidEquipmentType(value: string): value is EquipmentType {
  return (EQUIPMENT_TYPES as readonly string[]).includes(value);
}

/**
 * Validate if a string is a valid guide word.
 *
 * @param value - The value to validate
 * @returns True if valid guide word
 */
export function isValidGuideWord(value: string): value is GuideWord {
  return (GUIDE_WORDS as readonly string[]).includes(value);
}

/**
 * Get a prepared recommendation by ID.
 *
 * @param id - The prepared answer ID
 * @returns The prepared recommendation, or null if not found
 */
export function getPreparedRecommendationById(id: string): PreparedAnswer | null {
  const answers = getAllRecommendationAnswers();
  return answers.find((a) => a.id === id) ?? null;
}

/**
 * Get statistics about prepared recommendations.
 *
 * @returns Statistics including counts by equipment type and guide word
 */
export function getPreparedRecommendationStats(): {
  totalCount: number;
  commonCount: number;
  byEquipmentType: Record<EquipmentType, number>;
  byGuideWord: Record<GuideWord, number>;
  universalCount: number;
} {
  const answers = getAllRecommendationAnswers();

  const byEquipmentType = {} as Record<EquipmentType, number>;
  const byGuideWord = {} as Record<GuideWord, number>;

  for (const eqType of EQUIPMENT_TYPES) {
    byEquipmentType[eqType] = answers.filter(
      (a) =>
        a.applicableEquipmentTypes.length === 0 ||
        a.applicableEquipmentTypes.includes(eqType)
    ).length;
  }

  for (const gw of GUIDE_WORDS) {
    byGuideWord[gw] = answers.filter(
      (a) =>
        a.applicableGuideWords.length === 0 ||
        a.applicableGuideWords.includes(gw)
    ).length;
  }

  return {
    totalCount: answers.length,
    commonCount: answers.filter((a) => a.isCommon).length,
    byEquipmentType,
    byGuideWord,
    universalCount: answers.filter(
      (a) =>
        a.applicableEquipmentTypes.length === 0 &&
        a.applicableGuideWords.length === 0
    ).length,
  };
}
