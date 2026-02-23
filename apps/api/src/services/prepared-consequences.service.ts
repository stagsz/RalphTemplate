/**
 * Prepared Consequences service.
 *
 * Provides configurable templates for consequences in HazOps analysis.
 * Consequences are organized by equipment type and guide word to help analysts
 * quickly select relevant consequences for deviations.
 *
 * Industry-standard consequence categories include:
 * - Safety consequences (personnel injury, fatality)
 * - Environmental consequences (releases, spills)
 * - Production consequences (loss of output, quality issues)
 * - Equipment damage consequences
 * - Regulatory consequences (violations, fines)
 * - Reputation consequences
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
// Consequence Templates by Category
// ============================================================================

/**
 * Safety consequences - potential harm to personnel
 */
const SAFETY_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Personnel injury (minor)',
    description: 'Minor injuries requiring first aid treatment only',
    guideWords: ['more', 'less', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Personnel injury (serious)',
    description: 'Serious injuries requiring medical treatment or hospitalization',
    guideWords: ['more', 'no', 'reverse', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Personnel fatality',
    description: 'Potential for one or more fatalities',
    guideWords: ['more', 'no', 'reverse', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Toxic exposure',
    description: 'Exposure to hazardous substances affecting health',
    guideWords: ['more', 'other_than', 'reverse'],
    isCommon: true,
  },
  {
    text: 'Asphyxiation hazard',
    description: 'Oxygen-deficient atmosphere creating suffocation risk',
    guideWords: ['no', 'less', 'other_than'],
  },
  {
    text: 'Thermal burn injury',
    description: 'Burns from contact with hot surfaces, fluids, or steam',
    equipmentTypes: ['heat_exchanger', 'reactor', 'pipe'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Chemical burn injury',
    description: 'Burns from contact with corrosive or reactive chemicals',
    guideWords: ['other_than', 'more', 'reverse'],
  },
  {
    text: 'Noise-induced hearing damage',
    description: 'Hearing damage from excessive noise exposure',
    equipmentTypes: ['pump', 'valve'],
    guideWords: ['more'],
  },
  {
    text: 'Ergonomic injury',
    description: 'Strain or injury from manual intervention required',
    guideWords: ['other_than'],
  },
];

/**
 * Fire and explosion consequences
 */
const FIRE_EXPLOSION_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Fire (localized)',
    description: 'Small fire contained to immediate area',
    guideWords: ['more', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Fire (escalating)',
    description: 'Fire with potential to spread to adjacent areas',
    guideWords: ['more', 'other_than', 'no'],
    isCommon: true,
  },
  {
    text: 'Explosion (confined)',
    description: 'Explosion within equipment or building',
    equipmentTypes: ['reactor', 'tank', 'heat_exchanger'],
    guideWords: ['more', 'no', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Explosion (unconfined vapor cloud)',
    description: 'Vapor cloud explosion with widespread damage potential',
    guideWords: ['more', 'no', 'other_than'],
    isCommon: true,
  },
  {
    text: 'BLEVE (Boiling Liquid Expanding Vapor Explosion)',
    description: 'Catastrophic failure of pressurized vessel containing liquid',
    equipmentTypes: ['tank', 'reactor'],
    guideWords: ['more'],
  },
  {
    text: 'Deflagration',
    description: 'Rapid combustion of flammable mixture',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Detonation',
    description: 'Supersonic combustion wave causing severe damage',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Dust explosion',
    description: 'Explosion from ignition of combustible dust cloud',
    guideWords: ['other_than'],
  },
];

/**
 * Environmental consequences
 */
const ENVIRONMENTAL_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Atmospheric release (minor)',
    description: 'Small release of gases or vapors to atmosphere',
    guideWords: ['more', 'reverse', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Atmospheric release (major)',
    description: 'Large release requiring emergency response',
    guideWords: ['more', 'no', 'reverse', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Liquid spill to ground',
    description: 'Release of liquids contaminating soil',
    equipmentTypes: ['tank', 'pipe', 'pump', 'valve'],
    guideWords: ['more', 'reverse', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Water contamination',
    description: 'Release affecting surface water or groundwater',
    guideWords: ['more', 'reverse', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Soil contamination',
    description: 'Long-term soil pollution requiring remediation',
    guideWords: ['more', 'reverse', 'other_than'],
  },
  {
    text: 'Off-site environmental impact',
    description: 'Environmental damage extending beyond facility boundary',
    guideWords: ['more', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Wildlife impact',
    description: 'Harm to local wildlife or ecosystems',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Air quality exceedance',
    description: 'Emissions exceeding regulatory limits',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Greenhouse gas release',
    description: 'Release of CO2, methane, or other greenhouse gases',
    guideWords: ['more', 'other_than'],
  },
];

/**
 * Equipment damage consequences
 */
const EQUIPMENT_DAMAGE_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Equipment damage (minor)',
    description: 'Damage requiring minor repairs or parts replacement',
    isCommon: true,
  },
  {
    text: 'Equipment damage (major)',
    description: 'Significant damage requiring major repairs or replacement',
    isCommon: true,
  },
  {
    text: 'Catastrophic equipment failure',
    description: 'Complete destruction of equipment',
    guideWords: ['more', 'no'],
    isCommon: true,
  },
  {
    text: 'Pump damage',
    description: 'Damage to pump internals, seals, or motor',
    equipmentTypes: ['pump'],
    guideWords: ['no', 'less', 'more', 'reverse'],
    isCommon: true,
  },
  {
    text: 'Valve damage',
    description: 'Damage to valve seats, stems, or actuators',
    equipmentTypes: ['valve'],
    guideWords: ['more', 'less'],
  },
  {
    text: 'Reactor vessel damage',
    description: 'Damage to reactor internals, lining, or shell',
    equipmentTypes: ['reactor'],
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Heat exchanger tube failure',
    description: 'Tube leak or rupture causing cross-contamination',
    equipmentTypes: ['heat_exchanger'],
    guideWords: ['more', 'less', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Tank structural failure',
    description: 'Tank wall, roof, or floor failure',
    equipmentTypes: ['tank'],
    guideWords: ['more', 'less'],
    isCommon: true,
  },
  {
    text: 'Pipe rupture',
    description: 'Catastrophic pipe failure with loss of containment',
    equipmentTypes: ['pipe'],
    guideWords: ['more', 'no', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Instrument damage',
    description: 'Damage to sensors, transmitters, or control devices',
    guideWords: ['more', 'less'],
  },
  {
    text: 'Electrical equipment damage',
    description: 'Damage to motors, switchgear, or control systems',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Insulation damage',
    description: 'Damage to thermal or acoustic insulation',
    guideWords: ['more', 'less'],
  },
];

/**
 * Production and operational consequences
 */
const PRODUCTION_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Production loss (partial)',
    description: 'Reduced production rate or capacity',
    isCommon: true,
  },
  {
    text: 'Production loss (complete)',
    description: 'Total shutdown of production',
    guideWords: ['no', 'more', 'less'],
    isCommon: true,
  },
  {
    text: 'Extended shutdown',
    description: 'Prolonged production outage for repairs',
    guideWords: ['no', 'more'],
    isCommon: true,
  },
  {
    text: 'Off-specification product',
    description: 'Product not meeting quality specifications',
    guideWords: ['more', 'less', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Product contamination',
    description: 'Foreign material or substance in product',
    guideWords: ['other_than', 'reverse'],
    isCommon: true,
  },
  {
    text: 'Batch loss',
    description: 'Loss of entire production batch',
    equipmentTypes: ['reactor', 'tank'],
    guideWords: ['more', 'less', 'other_than'],
  },
  {
    text: 'Raw material waste',
    description: 'Loss of feedstock or raw materials',
    guideWords: ['more', 'less', 'other_than'],
  },
  {
    text: 'Energy waste',
    description: 'Excessive energy consumption without productive output',
    guideWords: ['more'],
  },
  {
    text: 'Utility disruption',
    description: 'Loss of essential utilities affecting other units',
    guideWords: ['no', 'less'],
  },
  {
    text: 'Delayed startup',
    description: 'Inability to restart production as planned',
    guideWords: ['late', 'no'],
  },
  {
    text: 'Process upset propagation',
    description: 'Upset spreading to connected process units',
    guideWords: ['more', 'less', 'no'],
    isCommon: true,
  },
];

/**
 * Regulatory and legal consequences
 */
const REGULATORY_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Regulatory violation',
    description: 'Non-compliance with environmental, safety, or process regulations',
    guideWords: ['more', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Permit exceedance',
    description: 'Exceeding limits specified in operating permits',
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Reportable incident',
    description: 'Event requiring notification to regulatory authorities',
    guideWords: ['more', 'no', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Regulatory fine/penalty',
    description: 'Financial penalties from regulatory violations',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Operating license suspension',
    description: 'Temporary or permanent loss of operating authority',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Increased regulatory scrutiny',
    description: 'Enhanced oversight and inspection requirements',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Legal liability',
    description: 'Exposure to lawsuits or legal claims',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Criminal prosecution',
    description: 'Potential criminal charges against company or individuals',
    guideWords: ['more', 'other_than'],
  },
];

/**
 * Business and reputation consequences
 */
const BUSINESS_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Reputation damage',
    description: 'Negative public perception affecting company image',
    guideWords: ['more', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Customer impact',
    description: 'Inability to meet customer orders or commitments',
    guideWords: ['no', 'less', 'late'],
    isCommon: true,
  },
  {
    text: 'Supply chain disruption',
    description: 'Impact on downstream customers or processes',
    guideWords: ['no', 'less'],
  },
  {
    text: 'Community evacuation',
    description: 'Need to evacuate nearby residents or workers',
    guideWords: ['more', 'other_than'],
    isCommon: true,
  },
  {
    text: 'Community complaint',
    description: 'Complaints from neighbors regarding noise, odor, or releases',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Insurance claim',
    description: 'Need to file insurance claims for losses',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Increased insurance premiums',
    description: 'Higher insurance costs following incident',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Contract breach',
    description: 'Failure to meet contractual obligations',
    guideWords: ['no', 'less', 'late'],
  },
  {
    text: 'Market share loss',
    description: 'Loss of competitive position in market',
    guideWords: ['no', 'less', 'late'],
  },
];

/**
 * Process-specific consequences
 */
const PROCESS_CONSEQUENCES: PreparedAnswerTemplate[] = [
  {
    text: 'Runaway reaction',
    description: 'Uncontrolled exothermic reaction',
    equipmentTypes: ['reactor'],
    guideWords: ['more', 'other_than', 'early'],
    isCommon: true,
  },
  {
    text: 'Pressure buildup',
    description: 'Excessive pressure development in equipment',
    equipmentTypes: ['reactor', 'tank', 'pipe'],
    guideWords: ['more', 'no'],
    isCommon: true,
  },
  {
    text: 'Vacuum collapse',
    description: 'Structural failure due to vacuum conditions',
    equipmentTypes: ['tank', 'reactor'],
    guideWords: ['less', 'no'],
    isCommon: true,
  },
  {
    text: 'Overfill',
    description: 'Liquid level exceeding safe capacity',
    equipmentTypes: ['tank', 'reactor'],
    guideWords: ['more'],
    isCommon: true,
  },
  {
    text: 'Dry running',
    description: 'Equipment operating without required liquid',
    equipmentTypes: ['pump', 'heat_exchanger'],
    guideWords: ['no', 'less'],
    isCommon: true,
  },
  {
    text: 'Thermal shock',
    description: 'Rapid temperature change causing material stress',
    equipmentTypes: ['heat_exchanger', 'reactor', 'pipe'],
    guideWords: ['more', 'less'],
  },
  {
    text: 'Freezing',
    description: 'Contents solidifying due to low temperature',
    equipmentTypes: ['pipe', 'tank', 'heat_exchanger'],
    guideWords: ['less', 'no'],
  },
  {
    text: 'Boiling/vaporization',
    description: 'Unexpected phase change from liquid to vapor',
    guideWords: ['more', 'less'],
  },
  {
    text: 'Polymerization',
    description: 'Unwanted polymer formation blocking equipment',
    equipmentTypes: ['reactor', 'pipe'],
    guideWords: ['more', 'other_than', 'late'],
  },
  {
    text: 'Sedimentation/fouling',
    description: 'Buildup of solids affecting operation',
    guideWords: ['less', 'other_than'],
  },
  {
    text: 'Corrosion acceleration',
    description: 'Increased corrosion rate reducing equipment life',
    guideWords: ['more', 'other_than'],
  },
  {
    text: 'Erosion damage',
    description: 'Wear from high velocity or abrasive materials',
    equipmentTypes: ['pipe', 'valve', 'pump'],
    guideWords: ['more'],
  },
];

// ============================================================================
// Combined Consequence Templates
// ============================================================================

const ALL_CONSEQUENCE_TEMPLATES: PreparedAnswerTemplate[] = [
  ...SAFETY_CONSEQUENCES,
  ...FIRE_EXPLOSION_CONSEQUENCES,
  ...ENVIRONMENTAL_CONSEQUENCES,
  ...EQUIPMENT_DAMAGE_CONSEQUENCES,
  ...PRODUCTION_CONSEQUENCES,
  ...REGULATORY_CONSEQUENCES,
  ...BUSINESS_CONSEQUENCES,
  ...PROCESS_CONSEQUENCES,
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

function getAllConsequenceAnswers(): PreparedAnswer[] {
  if (!cachedAnswers) {
    cachedAnswers = templatesToPreparedAnswers(ALL_CONSEQUENCE_TEMPLATES);
  }
  return cachedAnswers;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all prepared consequences.
 *
 * @returns All prepared consequence answers
 */
export function getAllPreparedConsequences(): PreparedAnswersResponse {
  const answers = getAllConsequenceAnswers();

  return {
    category: 'consequence',
    answers: answers.sort((a, b) => a.sortOrder - b.sortOrder),
    count: answers.length,
  };
}

/**
 * Get prepared consequences filtered by context.
 *
 * @param query - Filter parameters
 * @returns Filtered prepared consequences
 */
export function getPreparedConsequencesFiltered(
  query: PreparedAnswersQuery
): PreparedAnswersFilteredResponse {
  let answers = getAllConsequenceAnswers();

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
    category: 'consequence',
    answers: answers.sort((a, b) => a.sortOrder - b.sortOrder),
    count: answers.length,
    equipmentType: query.equipmentType ?? null,
    guideWord: query.guideWord ?? null,
  };
}

/**
 * Get prepared consequences for a specific equipment type.
 *
 * @param equipmentType - The equipment type to filter by
 * @returns Prepared consequences applicable to the equipment type
 */
export function getPreparedConsequencesForEquipmentType(
  equipmentType: EquipmentType
): PreparedAnswersFilteredResponse {
  return getPreparedConsequencesFiltered({ equipmentType });
}

/**
 * Get prepared consequences for a specific guide word.
 *
 * @param guideWord - The guide word to filter by
 * @returns Prepared consequences applicable to the guide word
 */
export function getPreparedConsequencesForGuideWord(
  guideWord: GuideWord
): PreparedAnswersFilteredResponse {
  return getPreparedConsequencesFiltered({ guideWord });
}

/**
 * Get prepared consequences for a specific equipment type and guide word combination.
 *
 * @param equipmentType - The equipment type to filter by
 * @param guideWord - The guide word to filter by
 * @returns Prepared consequences applicable to both filters
 */
export function getPreparedConsequencesForContext(
  equipmentType: EquipmentType,
  guideWord: GuideWord
): PreparedAnswersFilteredResponse {
  return getPreparedConsequencesFiltered({ equipmentType, guideWord });
}

/**
 * Search prepared consequences by text.
 *
 * @param searchText - Text to search for in consequence text and description
 * @returns Matching prepared consequences
 */
export function searchPreparedConsequences(searchText: string): PreparedAnswersResponse {
  const result = getPreparedConsequencesFiltered({ search: searchText });
  return {
    category: result.category,
    answers: result.answers,
    count: result.count,
  };
}

/**
 * Get common/recommended prepared consequences.
 *
 * @returns Only common/recommended consequences
 */
export function getCommonPreparedConsequences(): PreparedAnswersResponse {
  const result = getPreparedConsequencesFiltered({ commonOnly: true });
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
 * Get a prepared consequence by ID.
 *
 * @param id - The prepared answer ID
 * @returns The prepared consequence, or null if not found
 */
export function getPreparedConsequenceById(id: string): PreparedAnswer | null {
  const answers = getAllConsequenceAnswers();
  return answers.find((a) => a.id === id) ?? null;
}

/**
 * Get statistics about prepared consequences.
 *
 * @returns Statistics including counts by equipment type and guide word
 */
export function getPreparedConsequenceStats(): {
  totalCount: number;
  commonCount: number;
  byEquipmentType: Record<EquipmentType, number>;
  byGuideWord: Record<GuideWord, number>;
  universalCount: number;
} {
  const answers = getAllConsequenceAnswers();

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
