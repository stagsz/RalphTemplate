/**
 * Regulatory Standards Database Service.
 *
 * Provides an in-memory database of regulatory standards relevant to HazOps analysis.
 * This service contains comprehensive information about IEC 61511, ISO 31000, ISO 9001,
 * and other standards, including their clauses and HazOps relevance.
 *
 * The data is static and represents regulatory requirements that rarely change.
 * Future versions may store this in PostgreSQL for easier updates.
 *
 * Task: COMP-01
 */

import type {
  RegulatoryStandard,
  RegulatoryStandardId,
  RegulatoryClause,
  RegulatoryCategory,
  RegulatoryJurisdiction,
  HazopsRelevanceArea,
  ListRegulatoryStandardsQuery,
} from '@hazop/types';

// ============================================================================
// IEC 61511 - Functional Safety for Process Industries
// ============================================================================

/**
 * IEC 61511 clauses relevant to HazOps analysis.
 */
const IEC_61511_CLAUSES: RegulatoryClause[] = [
  {
    id: '8.1',
    title: 'Hazard and risk assessment - Objectives',
    description:
      'Hazard and risk assessment shall be carried out for the process and its associated BPCS ' +
      'to identify hazards and hazardous events, the sequence of events leading to the hazardous event, ' +
      'the process risks, and the requirements for risk reduction.',
    keywords: ['hazard', 'risk assessment', 'process risk', 'risk reduction'],
    mandatory: true,
    hazopsRelevance: ['hazard_identification', 'risk_assessment'],
  },
  {
    id: '8.1.1',
    title: 'General requirements for hazard and risk assessment',
    description:
      'A hazard and risk assessment technique shall be applied. HAZOP is cited as an appropriate ' +
      'technique for identifying hazards in process industries.',
    keywords: ['HAZOP', 'hazard identification', 'risk assessment technique'],
    mandatory: true,
    parentClauseId: '8.1',
    hazopsRelevance: ['hazard_identification', 'methodology'],
  },
  {
    id: '8.1.2',
    title: 'Required competencies for hazard and risk assessment',
    description:
      'Personnel carrying out the hazard and risk assessment shall have the necessary competencies. ' +
      'The team shall include expertise in process engineering, operations, safety, and instrumentation.',
    keywords: ['competency', 'team composition', 'qualifications'],
    mandatory: true,
    parentClauseId: '8.1',
    hazopsRelevance: ['team_composition'],
  },
  {
    id: '8.2',
    title: 'Hazard and risk assessment methods',
    description:
      'Qualitative or quantitative methods shall be used for hazard and risk assessment. ' +
      'The methods include HAZOP, FMEA, fault tree analysis, and other recognized techniques.',
    keywords: ['HAZOP', 'FMEA', 'fault tree', 'qualitative', 'quantitative'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'risk_assessment'],
  },
  {
    id: '9',
    title: 'SIS safety requirements specification',
    description:
      'The SIS safety requirements specification shall be derived from the hazard and risk assessment. ' +
      'This includes functional requirements, SIL requirements, and test requirements.',
    keywords: ['SIS', 'safety requirements', 'SIL', 'specification'],
    mandatory: true,
    hazopsRelevance: ['sil_determination', 'safeguards'],
  },
  {
    id: '9.2',
    title: 'Safety Integrity Level determination',
    description:
      'The SIL shall be determined using an appropriate method such as risk graph, risk matrix, ' +
      'or LOPA (Layers of Protection Analysis).',
    keywords: ['SIL', 'risk graph', 'risk matrix', 'LOPA'],
    mandatory: true,
    parentClauseId: '9',
    hazopsRelevance: ['sil_determination', 'lopa', 'risk_ranking'],
  },
  {
    id: '9.3',
    title: 'Safety requirements allocation',
    description:
      'Safety requirements shall be allocated to the SIS subsystems. The allocation shall consider ' +
      'hardware fault tolerance, systematic capability, and architectural constraints.',
    keywords: ['allocation', 'subsystems', 'fault tolerance', 'architecture'],
    mandatory: true,
    parentClauseId: '9',
    hazopsRelevance: ['safeguards', 'sil_determination'],
  },
  {
    id: '11',
    title: 'SIS design and engineering',
    description:
      'The SIS shall be designed to achieve the required SIL. Design shall consider ' +
      'hardware, software, application program, and human factors.',
    keywords: ['design', 'engineering', 'hardware', 'software'],
    mandatory: true,
    hazopsRelevance: ['safeguards'],
  },
  {
    id: '15',
    title: 'SIS operation and maintenance',
    description:
      'Procedures shall be in place for operation and maintenance of the SIS to maintain ' +
      'its functional safety throughout its lifetime.',
    keywords: ['operation', 'maintenance', 'procedures'],
    mandatory: true,
    hazopsRelevance: ['follow_up', 'safeguards'],
  },
  {
    id: '16',
    title: 'SIS modification',
    description:
      'Any modification to the SIS shall be subject to management of change procedures. ' +
      'The impact on functional safety shall be assessed.',
    keywords: ['modification', 'change management', 'MOC'],
    mandatory: true,
    hazopsRelevance: ['management_of_change'],
  },
  {
    id: '17',
    title: 'SIS decommissioning',
    description:
      'Decommissioning of SIS shall follow defined procedures to ensure safety is maintained.',
    keywords: ['decommissioning', 'removal'],
    mandatory: true,
    hazopsRelevance: ['follow_up'],
  },
  {
    id: 'Annex_A',
    title: 'LOPA (Layers of Protection Analysis)',
    description:
      'Informative annex describing LOPA methodology for SIL determination. Includes guidance on ' +
      'initiating events, IPLs, target mitigated event likelihood, and gap analysis.',
    keywords: ['LOPA', 'IPL', 'initiating event', 'target frequency'],
    mandatory: false,
    hazopsRelevance: ['lopa', 'sil_determination', 'risk_assessment'],
  },
];

/**
 * IEC 61511 standard definition.
 */
const IEC_61511: RegulatoryStandard = {
  id: 'IEC_61511',
  name: 'IEC 61511',
  title: 'Functional safety - Safety instrumented systems for the process industry sector',
  description:
    'International standard for safety instrumented systems (SIS) in the process industry. ' +
    'Covers the lifecycle of SIS from concept through decommissioning, including ' +
    'hazard and risk assessment, SIL determination, and verification.',
  category: 'functional_safety',
  jurisdiction: 'international',
  version: 'Ed. 2.1',
  year: 2017,
  issuingBody: 'International Electrotechnical Commission (IEC)',
  url: 'https://webstore.iec.ch/publication/61928',
  mandatory: true,
  relatedStandards: ['ISO_31000', 'OSHA_PSM'],
  relevantClauses: IEC_61511_CLAUSES,
};

// ============================================================================
// ISO 31000 - Risk Management Guidelines
// ============================================================================

/**
 * ISO 31000 clauses relevant to HazOps analysis.
 */
const ISO_31000_CLAUSES: RegulatoryClause[] = [
  {
    id: '4',
    title: 'Principles',
    description:
      'Risk management should be integrated, structured, comprehensive, customized, inclusive, ' +
      'dynamic, use best available information, consider human and cultural factors, and be ' +
      'subject to continual improvement.',
    keywords: ['principles', 'integrated', 'comprehensive', 'continual improvement'],
    mandatory: true,
    hazopsRelevance: ['methodology'],
  },
  {
    id: '5',
    title: 'Framework',
    description:
      'The purpose of the risk management framework is to assist the organization in integrating ' +
      'risk management into significant activities and functions.',
    keywords: ['framework', 'integration', 'organization'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'documentation'],
  },
  {
    id: '5.4',
    title: 'Integration',
    description:
      'Integrating risk management into an organization is a dynamic and iterative process, ' +
      'and should be customized to the needs and culture of the organization.',
    keywords: ['integration', 'dynamic', 'iterative'],
    mandatory: true,
    parentClauseId: '5',
    hazopsRelevance: ['methodology'],
  },
  {
    id: '5.5',
    title: 'Design',
    description:
      'When designing the framework for managing risk, the organization should examine and understand ' +
      'its external and internal context.',
    keywords: ['design', 'context', 'external', 'internal'],
    mandatory: true,
    parentClauseId: '5',
    hazopsRelevance: ['methodology'],
  },
  {
    id: '6',
    title: 'Process',
    description:
      'The risk management process involves communication and consultation, establishing context, ' +
      'risk assessment, risk treatment, monitoring and review, and recording and reporting.',
    keywords: ['process', 'risk assessment', 'risk treatment', 'monitoring'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'risk_assessment'],
  },
  {
    id: '6.3',
    title: 'Scope, context and criteria',
    description:
      'The organization should define the scope of its risk management activities, along with ' +
      'the external and internal context and the risk criteria.',
    keywords: ['scope', 'context', 'criteria'],
    mandatory: true,
    parentClauseId: '6',
    hazopsRelevance: ['methodology'],
  },
  {
    id: '6.4',
    title: 'Risk assessment',
    description:
      'Risk assessment is the overall process of risk identification, risk analysis and risk evaluation.',
    keywords: ['risk assessment', 'identification', 'analysis', 'evaluation'],
    mandatory: true,
    parentClauseId: '6',
    hazopsRelevance: ['risk_assessment', 'hazard_identification'],
  },
  {
    id: '6.4.2',
    title: 'Risk identification',
    description:
      'The purpose of risk identification is to find, recognize and describe risks that might help ' +
      'or prevent an organization achieving its objectives.',
    keywords: ['risk identification', 'objectives'],
    mandatory: true,
    parentClauseId: '6.4',
    hazopsRelevance: ['hazard_identification'],
  },
  {
    id: '6.4.3',
    title: 'Risk analysis',
    description:
      'The purpose of risk analysis is to comprehend the nature of risk and its characteristics ' +
      'including the level of risk. Risk analysis involves consideration of causes and sources of risk, ' +
      'consequences, and likelihood.',
    keywords: ['risk analysis', 'causes', 'consequences', 'likelihood'],
    mandatory: true,
    parentClauseId: '6.4',
    hazopsRelevance: ['risk_assessment', 'risk_ranking'],
  },
  {
    id: '6.4.4',
    title: 'Risk evaluation',
    description:
      'The purpose of risk evaluation is to support decisions. Risk evaluation involves comparing ' +
      'the results of the risk analysis with the established risk criteria.',
    keywords: ['risk evaluation', 'decisions', 'criteria'],
    mandatory: true,
    parentClauseId: '6.4',
    hazopsRelevance: ['risk_ranking'],
  },
  {
    id: '6.5',
    title: 'Risk treatment',
    description:
      'Risk treatment involves selecting and implementing options for addressing risk. ' +
      'Options include avoiding, taking or increasing risk, removing sources, changing likelihood ' +
      'or consequences, sharing risk, and retaining risk.',
    keywords: ['risk treatment', 'mitigation', 'options'],
    mandatory: true,
    parentClauseId: '6',
    hazopsRelevance: ['recommendations', 'safeguards'],
  },
  {
    id: '6.6',
    title: 'Monitoring and review',
    description:
      'Monitoring and review should take place in all stages of the process. Monitoring and review ' +
      'includes planning, gathering and analyzing information, recording results and providing feedback.',
    keywords: ['monitoring', 'review', 'feedback'],
    mandatory: true,
    parentClauseId: '6',
    hazopsRelevance: ['follow_up'],
  },
  {
    id: '6.7',
    title: 'Recording and reporting',
    description:
      'The risk management process and its outcomes should be documented and reported through ' +
      'appropriate mechanisms.',
    keywords: ['recording', 'reporting', 'documentation'],
    mandatory: true,
    parentClauseId: '6',
    hazopsRelevance: ['documentation'],
  },
];

/**
 * ISO 31000 standard definition.
 */
const ISO_31000: RegulatoryStandard = {
  id: 'ISO_31000',
  name: 'ISO 31000',
  title: 'Risk management - Guidelines',
  description:
    'International standard providing guidelines for managing risk faced by organizations. ' +
    'Establishes principles, framework, and process for risk management applicable to ' +
    'any type of risk regardless of cause or consequence.',
  category: 'risk_management',
  jurisdiction: 'international',
  version: '2018',
  year: 2018,
  issuingBody: 'International Organization for Standardization (ISO)',
  url: 'https://www.iso.org/standard/65694.html',
  mandatory: false,
  relatedStandards: ['IEC_61511', 'ISO_9001'],
  relevantClauses: ISO_31000_CLAUSES,
};

// ============================================================================
// ISO 9001 - Quality Management Systems
// ============================================================================

/**
 * ISO 9001 clauses relevant to HazOps analysis.
 */
const ISO_9001_CLAUSES: RegulatoryClause[] = [
  {
    id: '4.1',
    title: 'Understanding the organization and its context',
    description:
      'The organization shall determine external and internal issues that are relevant to its purpose ' +
      'and its strategic direction and that affect its ability to achieve the intended results.',
    keywords: ['context', 'issues', 'strategic direction'],
    mandatory: true,
    hazopsRelevance: ['methodology'],
  },
  {
    id: '4.4',
    title: 'Quality management system and its processes',
    description:
      'The organization shall establish, implement, maintain and continually improve a quality ' +
      'management system, including the processes needed and their interactions.',
    keywords: ['QMS', 'processes', 'continual improvement'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'documentation'],
  },
  {
    id: '6.1',
    title: 'Actions to address risks and opportunities',
    description:
      'When planning for the quality management system, the organization shall consider risks and ' +
      'opportunities that need to be addressed to ensure the QMS can achieve its intended results.',
    keywords: ['risks', 'opportunities', 'planning'],
    mandatory: true,
    hazopsRelevance: ['risk_assessment', 'hazard_identification'],
  },
  {
    id: '6.1.1',
    title: 'Risk-based thinking',
    description:
      'The organization shall plan actions to address risks and opportunities. The organization shall ' +
      'plan how to integrate and implement the actions into its QMS processes.',
    keywords: ['risk-based thinking', 'actions', 'implementation'],
    mandatory: true,
    parentClauseId: '6.1',
    hazopsRelevance: ['risk_assessment', 'recommendations'],
  },
  {
    id: '7.1.6',
    title: 'Organizational knowledge',
    description:
      'The organization shall determine the knowledge necessary for the operation of its processes ' +
      'and to achieve conformity of products and services.',
    keywords: ['knowledge', 'competence', 'lessons learned'],
    mandatory: true,
    hazopsRelevance: ['team_composition', 'documentation'],
  },
  {
    id: '7.2',
    title: 'Competence',
    description:
      'The organization shall determine the necessary competence of persons doing work under its control ' +
      'that affects the performance and effectiveness of the QMS.',
    keywords: ['competence', 'training', 'qualification'],
    mandatory: true,
    hazopsRelevance: ['team_composition'],
  },
  {
    id: '7.5',
    title: 'Documented information',
    description:
      'The organizations QMS shall include documented information required by ISO 9001 and ' +
      'determined by the organization as being necessary for the effectiveness of the QMS.',
    keywords: ['documentation', 'records', 'information'],
    mandatory: true,
    hazopsRelevance: ['documentation'],
  },
  {
    id: '8.1',
    title: 'Operational planning and control',
    description:
      'The organization shall plan, implement and control the processes needed to meet requirements ' +
      'for the provision of products and services.',
    keywords: ['operational planning', 'control', 'processes'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'safeguards'],
  },
  {
    id: '8.3',
    title: 'Design and development of products and services',
    description:
      'The organization shall establish, implement and maintain a design and development process ' +
      'that is appropriate to ensure the subsequent provision of products and services.',
    keywords: ['design', 'development', 'products', 'services'],
    mandatory: true,
    hazopsRelevance: ['methodology'],
  },
  {
    id: '8.3.3',
    title: 'Design and development inputs',
    description:
      'The organization shall determine the requirements essential for the specific types of products ' +
      'and services to be designed and developed, including statutory and regulatory requirements.',
    keywords: ['design inputs', 'requirements', 'regulatory'],
    mandatory: true,
    parentClauseId: '8.3',
    hazopsRelevance: ['hazard_identification'],
  },
  {
    id: '8.5.6',
    title: 'Control of changes',
    description:
      'The organization shall review and control changes for production or service provision to ensure ' +
      'continuing conformity with requirements.',
    keywords: ['change control', 'MOC', 'conformity'],
    mandatory: true,
    hazopsRelevance: ['management_of_change'],
  },
  {
    id: '9.1',
    title: 'Monitoring, measurement, analysis and evaluation',
    description:
      'The organization shall determine what needs to be monitored and measured, the methods for ' +
      'monitoring, measurement, analysis and evaluation.',
    keywords: ['monitoring', 'measurement', 'analysis', 'evaluation'],
    mandatory: true,
    hazopsRelevance: ['follow_up', 'risk_assessment'],
  },
  {
    id: '10.2',
    title: 'Nonconformity and corrective action',
    description:
      'When a nonconformity occurs, the organization shall react to the nonconformity, evaluate the ' +
      'need for action to eliminate the causes, implement any action needed, review effectiveness.',
    keywords: ['nonconformity', 'corrective action', 'root cause'],
    mandatory: true,
    hazopsRelevance: ['recommendations', 'follow_up'],
  },
  {
    id: '10.3',
    title: 'Continual improvement',
    description:
      'The organization shall continually improve the suitability, adequacy and effectiveness of the QMS.',
    keywords: ['continual improvement', 'effectiveness'],
    mandatory: true,
    hazopsRelevance: ['follow_up', 'methodology'],
  },
];

/**
 * ISO 9001 standard definition.
 */
const ISO_9001: RegulatoryStandard = {
  id: 'ISO_9001',
  name: 'ISO 9001',
  title: 'Quality management systems - Requirements',
  description:
    'International standard for quality management systems. Specifies requirements for ' +
    'organizations to demonstrate ability to consistently provide products/services ' +
    'meeting customer and regulatory requirements.',
  category: 'quality_management',
  jurisdiction: 'international',
  version: '2015',
  year: 2015,
  issuingBody: 'International Organization for Standardization (ISO)',
  url: 'https://www.iso.org/standard/62085.html',
  mandatory: false,
  relatedStandards: ['ISO_31000'],
  relevantClauses: ISO_9001_CLAUSES,
};

// ============================================================================
// ATEX/DSEAR - Explosive Atmospheres Directives
// ============================================================================

/**
 * ATEX/DSEAR clauses relevant to HazOps analysis.
 *
 * ATEX covers two EU directives:
 * - ATEX 2014/34/EU (Equipment Directive): Equipment for explosive atmospheres
 * - ATEX 1999/92/EC (Workplace Directive): Worker protection
 *
 * DSEAR (Dangerous Substances and Explosive Atmospheres Regulations 2002)
 * is the UK implementation of ATEX 1999/92/EC.
 *
 * These regulations are critical for HazOps in process industries handling
 * flammable gases, vapors, mists, or combustible dusts.
 */
const ATEX_DSEAR_CLAUSES: RegulatoryClause[] = [
  // DSEAR/ATEX 1999/92/EC - Risk Assessment Requirements
  {
    id: 'DSEAR-5',
    title: 'Risk assessment',
    description:
      'Where a dangerous substance is or may be present, the employer shall assess the risks arising ' +
      'from that substance. The assessment shall include consideration of the hazardous properties ' +
      'of the substance, circumstances of work including quantity, processes, and control measures.',
    keywords: ['risk assessment', 'dangerous substance', 'hazardous properties', 'control measures'],
    mandatory: true,
    hazopsRelevance: ['hazard_identification', 'risk_assessment'],
  },
  {
    id: 'DSEAR-5.1',
    title: 'Risk assessment - Hazardous properties',
    description:
      'The risk assessment shall consider the hazardous properties of the dangerous substance, ' +
      'including flammability, explosivity, and reactivity.',
    keywords: ['flammability', 'explosivity', 'reactivity', 'hazardous properties'],
    mandatory: true,
    parentClauseId: 'DSEAR-5',
    hazopsRelevance: ['hazard_identification'],
  },
  {
    id: 'DSEAR-5.2',
    title: 'Risk assessment - Work circumstances',
    description:
      'The risk assessment shall consider the circumstances of work, including work processes ' +
      'and activities, quantities of dangerous substances, and interaction between substances.',
    keywords: ['work processes', 'quantities', 'interaction', 'activities'],
    mandatory: true,
    parentClauseId: 'DSEAR-5',
    hazopsRelevance: ['hazard_identification', 'methodology'],
  },
  {
    id: 'DSEAR-5.3',
    title: 'Risk assessment - Ignition sources',
    description:
      'The risk assessment shall identify potential ignition sources, including electrical equipment, ' +
      'hot surfaces, static electricity, and mechanical sparks.',
    keywords: ['ignition sources', 'electrical', 'static electricity', 'hot surfaces', 'sparks'],
    mandatory: true,
    parentClauseId: 'DSEAR-5',
    hazopsRelevance: ['hazard_identification', 'risk_assessment'],
  },
  // Zone Classification
  {
    id: 'DSEAR-7',
    title: 'Hazardous area classification (zoning)',
    description:
      'The employer shall classify hazardous places into zones on the basis of the frequency and ' +
      'duration of explosive atmospheres. Zone 0/20 (continuous), Zone 1/21 (likely), Zone 2/22 (unlikely).',
    keywords: ['zone', 'classification', 'explosive atmosphere', 'Zone 0', 'Zone 1', 'Zone 2'],
    mandatory: true,
    hazopsRelevance: ['hazard_identification', 'risk_ranking'],
  },
  {
    id: 'DSEAR-7.1',
    title: 'Zone 0/20 - Continuous explosive atmosphere',
    description:
      'A place in which an explosive atmosphere is present continuously or for long periods or frequently. ' +
      'Zone 0 for gases/vapors, Zone 20 for dusts. Equipment must be Category 1 certified.',
    keywords: ['Zone 0', 'Zone 20', 'continuous', 'Category 1', 'permanent hazard'],
    mandatory: true,
    parentClauseId: 'DSEAR-7',
    hazopsRelevance: ['hazard_identification', 'safeguards'],
  },
  {
    id: 'DSEAR-7.2',
    title: 'Zone 1/21 - Likely explosive atmosphere',
    description:
      'A place in which an explosive atmosphere is likely to occur occasionally in normal operation. ' +
      'Zone 1 for gases/vapors, Zone 21 for dusts. Equipment must be Category 2 or higher certified.',
    keywords: ['Zone 1', 'Zone 21', 'occasionally', 'Category 2', 'likely hazard'],
    mandatory: true,
    parentClauseId: 'DSEAR-7',
    hazopsRelevance: ['hazard_identification', 'safeguards'],
  },
  {
    id: 'DSEAR-7.3',
    title: 'Zone 2/22 - Unlikely explosive atmosphere',
    description:
      'A place in which an explosive atmosphere is not likely to occur in normal operation but, ' +
      'if it does, will persist for a short period only. Zone 2 for gases/vapors, Zone 22 for dusts. ' +
      'Equipment must be Category 3 or higher certified.',
    keywords: ['Zone 2', 'Zone 22', 'unlikely', 'Category 3', 'abnormal operation'],
    mandatory: true,
    parentClauseId: 'DSEAR-7',
    hazopsRelevance: ['hazard_identification', 'safeguards'],
  },
  // Control Measures
  {
    id: 'DSEAR-6',
    title: 'Elimination and reduction of risks',
    description:
      'The employer shall ensure that risks are eliminated or reduced so far as is reasonably practicable. ' +
      'This includes substitution, engineering controls, control of sources of ignition, and mitigation.',
    keywords: ['elimination', 'reduction', 'substitution', 'engineering controls', 'mitigation'],
    mandatory: true,
    hazopsRelevance: ['safeguards', 'recommendations'],
  },
  {
    id: 'DSEAR-6.1',
    title: 'Prevention hierarchy - Substitution',
    description:
      'Where reasonably practicable, replace the dangerous substance with a substance or process ' +
      'which eliminates or reduces the risk.',
    keywords: ['substitution', 'replacement', 'eliminate', 'hierarchy of controls'],
    mandatory: true,
    parentClauseId: 'DSEAR-6',
    hazopsRelevance: ['recommendations', 'safeguards'],
  },
  {
    id: 'DSEAR-6.2',
    title: 'Prevention hierarchy - Reduce quantity',
    description:
      'Reduce to a minimum the quantity of dangerous substances to the minimum necessary for the work.',
    keywords: ['quantity', 'minimize', 'inventory reduction'],
    mandatory: true,
    parentClauseId: 'DSEAR-6',
    hazopsRelevance: ['recommendations', 'safeguards'],
  },
  {
    id: 'DSEAR-6.3',
    title: 'Prevention hierarchy - Avoid release',
    description:
      'Avoid the release of dangerous substances, or if release cannot be prevented, prevent the ' +
      'formation of explosive atmospheres.',
    keywords: ['avoid release', 'containment', 'prevention', 'explosive atmosphere formation'],
    mandatory: true,
    parentClauseId: 'DSEAR-6',
    hazopsRelevance: ['safeguards', 'recommendations'],
  },
  {
    id: 'DSEAR-6.4',
    title: 'Prevention hierarchy - Control ignition sources',
    description:
      'Control sources of ignition including static electricity discharges using appropriate equipment, ' +
      'bonding, grounding, and work procedures.',
    keywords: ['ignition control', 'static electricity', 'bonding', 'grounding', 'work procedures'],
    mandatory: true,
    parentClauseId: 'DSEAR-6',
    hazopsRelevance: ['safeguards'],
  },
  {
    id: 'DSEAR-6.5',
    title: 'Mitigation measures',
    description:
      'Where prevention is not possible, mitigate the detrimental effects of an explosion to ensure ' +
      'health and safety of employees. This includes explosion relief, suppression, and containment.',
    keywords: ['mitigation', 'explosion relief', 'suppression', 'containment', 'venting'],
    mandatory: true,
    parentClauseId: 'DSEAR-6',
    hazopsRelevance: ['safeguards', 'recommendations'],
  },
  // Equipment Requirements
  {
    id: 'DSEAR-8',
    title: 'Equipment for hazardous areas',
    description:
      'Equipment and protective systems in hazardous areas shall be selected on the basis of ATEX ' +
      'equipment groups and categories corresponding to the zone classification.',
    keywords: ['equipment selection', 'ATEX', 'categories', 'groups', 'Ex-rating'],
    mandatory: true,
    hazopsRelevance: ['safeguards'],
  },
  {
    id: 'ATEX-Annex-I',
    title: 'Essential health and safety requirements (EHSR)',
    description:
      'ATEX 2014/34/EU Annex II specifies Essential Health and Safety Requirements for equipment ' +
      'intended for use in explosive atmospheres, including ignition hazard assessment and protection.',
    keywords: ['EHSR', 'essential requirements', 'Annex II', 'ignition hazard'],
    mandatory: true,
    hazopsRelevance: ['safeguards', 'methodology'],
  },
  // Documentation
  {
    id: 'DSEAR-9',
    title: 'Explosion Protection Document',
    description:
      'The employer shall prepare an Explosion Protection Document (EPD) setting out the findings ' +
      'of the risk assessment, measures taken, classification of zones, and equipment requirements.',
    keywords: ['EPD', 'explosion protection document', 'documentation', 'findings'],
    mandatory: true,
    hazopsRelevance: ['documentation'],
  },
  {
    id: 'DSEAR-9.1',
    title: 'EPD content - Hazards identified',
    description:
      'The Explosion Protection Document shall describe the hazards that have been identified ' +
      'and include the risk assessment results.',
    keywords: ['hazards identified', 'risk assessment results', 'EPD content'],
    mandatory: true,
    parentClauseId: 'DSEAR-9',
    hazopsRelevance: ['documentation', 'hazard_identification'],
  },
  {
    id: 'DSEAR-9.2',
    title: 'EPD content - Protective measures',
    description:
      'The Explosion Protection Document shall describe the measures which have been taken or will be taken ' +
      'to comply with the regulations.',
    keywords: ['protective measures', 'compliance', 'EPD content'],
    mandatory: true,
    parentClauseId: 'DSEAR-9',
    hazopsRelevance: ['documentation', 'safeguards'],
  },
  {
    id: 'DSEAR-9.3',
    title: 'EPD content - Zone classification',
    description:
      'The Explosion Protection Document shall include the classification of hazardous places into zones.',
    keywords: ['zone classification', 'hazardous places', 'EPD content'],
    mandatory: true,
    parentClauseId: 'DSEAR-9',
    hazopsRelevance: ['documentation'],
  },
  // Coordination and Review
  {
    id: 'DSEAR-11',
    title: 'Co-ordination',
    description:
      'Where two or more employers share a workplace, each shall co-operate with the others to comply ' +
      'with the regulations and share relevant information about explosion risks.',
    keywords: ['co-ordination', 'shared workplace', 'information sharing'],
    mandatory: true,
    hazopsRelevance: ['team_composition', 'methodology'],
  },
  {
    id: 'DSEAR-5.4',
    title: 'Review of risk assessment',
    description:
      'The risk assessment shall be reviewed regularly and immediately if there is reason to suspect ' +
      'it is no longer valid or there has been a significant change.',
    keywords: ['review', 'reassessment', 'change', 'validity'],
    mandatory: true,
    parentClauseId: 'DSEAR-5',
    hazopsRelevance: ['follow_up', 'management_of_change'],
  },
];

/**
 * ATEX/DSEAR standard definition.
 */
const ATEX_DSEAR: RegulatoryStandard = {
  id: 'ATEX_DSEAR',
  name: 'ATEX/DSEAR',
  title: 'Equipment and protective systems for explosive atmospheres',
  description:
    'European directives covering equipment and protective systems for use in explosive ' +
    'atmospheres, and workplace protection. ATEX 2014/34/EU (Equipment Directive) covers ' +
    'equipment certification, ATEX 1999/92/EC (Workplace Directive) covers worker protection. ' +
    'DSEAR (Dangerous Substances and Explosive Atmospheres Regulations 2002) is the UK ' +
    'implementation of ATEX 1999/92/EC.',
  category: 'explosive_atmospheres',
  jurisdiction: 'european_union',
  version: 'ATEX 2014/34/EU, DSEAR 2002 (amended 2015)',
  year: 2014,
  issuingBody: 'European Commission / UK HSE',
  url: 'https://www.hse.gov.uk/fireandexplosion/dsear.htm',
  mandatory: true,
  relatedStandards: ['IEC_61511', 'SEVESO_III'],
  relevantClauses: ATEX_DSEAR_CLAUSES,
};

// ============================================================================
// PED - Pressure Equipment Directive
// ============================================================================

/**
 * PED (Pressure Equipment Directive 2014/68/EU) clauses relevant to HazOps analysis.
 *
 * The PED applies to the design, manufacture, and conformity assessment of
 * pressure equipment and assemblies with a maximum allowable pressure greater
 * than 0.5 bar. It is critical for HazOps in process industries involving
 * pressure vessels, piping, safety accessories, and pressure accessories.
 *
 * Key aspects covered:
 * - Classification of pressure equipment by category (I-IV)
 * - Essential Safety Requirements (ESR)
 * - Conformity assessment procedures
 * - Materials requirements
 * - Safety devices
 * - Documentation and CE marking
 */
const PED_CLAUSES: RegulatoryClause[] = [
  // Scope and Classification
  {
    id: 'PED-Art-1',
    title: 'Subject matter and scope',
    description:
      'The directive applies to the design, manufacture, and conformity assessment of pressure equipment ' +
      'and assemblies with a maximum allowable pressure (PS) greater than 0.5 bar. Includes vessels, piping, ' +
      'safety accessories, and pressure accessories.',
    keywords: ['scope', 'pressure equipment', 'maximum allowable pressure', 'PS', 'assemblies'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'hazard_identification'],
  },
  {
    id: 'PED-Art-4',
    title: 'Classification of pressure equipment',
    description:
      'Pressure equipment shall be classified into categories I, II, III, or IV according to ascending ' +
      'level of hazard. Classification is based on maximum allowable pressure, volume (for vessels) or ' +
      'nominal size (for piping), and group of fluids (Group 1: dangerous, Group 2: other).',
    keywords: ['classification', 'category', 'hazard level', 'Group 1', 'Group 2', 'fluid group'],
    mandatory: true,
    hazopsRelevance: ['risk_ranking', 'hazard_identification'],
  },
  {
    id: 'PED-Art-4.1',
    title: 'Fluid groups',
    description:
      'Fluids are divided into two groups. Group 1 comprises dangerous fluids: explosives, extremely flammable, ' +
      'highly flammable, flammable (under certain conditions), very toxic, toxic, and oxidizing. ' +
      'Group 2 comprises all other fluids not referred to in Group 1.',
    keywords: ['fluid group', 'dangerous fluids', 'flammable', 'toxic', 'oxidizing', 'Group 1', 'Group 2'],
    mandatory: true,
    parentClauseId: 'PED-Art-4',
    hazopsRelevance: ['hazard_identification', 'risk_ranking'],
  },
  {
    id: 'PED-Art-4.2',
    title: 'Category determination tables',
    description:
      'Annex II provides conformity assessment tables based on equipment type (vessels, piping), fluid group, ' +
      'and the product of PS × V (for vessels) or PS × DN (for piping). Higher categories require more ' +
      'stringent conformity assessment procedures.',
    keywords: ['Annex II', 'conformity assessment', 'PS×V', 'PS×DN', 'category tables'],
    mandatory: true,
    parentClauseId: 'PED-Art-4',
    hazopsRelevance: ['risk_ranking', 'methodology'],
  },
  // Essential Safety Requirements (Annex I)
  {
    id: 'PED-Annex-I',
    title: 'Essential Safety Requirements (ESR)',
    description:
      'Annex I sets out the essential safety requirements that must be met by pressure equipment and assemblies. ' +
      'Manufacturers must analyze hazards, design and construct to eliminate or reduce hazards, apply protective ' +
      'measures, and inform users of residual hazards.',
    keywords: ['ESR', 'essential safety requirements', 'Annex I', 'hazard analysis', 'protective measures'],
    mandatory: true,
    hazopsRelevance: ['hazard_identification', 'safeguards', 'risk_assessment'],
  },
  {
    id: 'PED-Annex-I-1',
    title: 'General - Hazard analysis',
    description:
      'The manufacturer shall carry out a suitable hazard analysis to identify all hazards applicable to the ' +
      'equipment due to pressure. The equipment shall then be designed and constructed taking into account ' +
      'the analysis.',
    keywords: ['hazard analysis', 'pressure hazards', 'design', 'construction'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['hazard_identification', 'risk_assessment'],
  },
  {
    id: 'PED-Annex-I-2.1',
    title: 'Design for adequate strength',
    description:
      'Pressure equipment shall be designed for loadings appropriate to intended use and reasonably foreseeable ' +
      'conditions. Factors include internal/external pressure, ambient and operational temperatures, static ' +
      'pressure and mass of contents, traffic, wind and earthquake loads, reaction forces, and fatigue.',
    keywords: ['design', 'strength', 'loadings', 'pressure', 'temperature', 'fatigue', 'earthquake'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['hazard_identification', 'safeguards'],
  },
  {
    id: 'PED-Annex-I-2.2',
    title: 'Design for safe handling and operation',
    description:
      'Provisions must be made for safe handling during manufacture, transport, and installation. Equipment shall ' +
      'have adequate vents and drains, allow access for inspection, and have means for safe operation throughout ' +
      'its life cycle.',
    keywords: ['safe handling', 'operation', 'vents', 'drains', 'inspection access', 'maintenance'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['safeguards', 'methodology'],
  },
  {
    id: 'PED-Annex-I-2.3',
    title: 'Means of examination',
    description:
      'Pressure equipment shall be designed so that all necessary examinations can be carried out to ensure ' +
      'safety. Internal inspections must be possible. Where appropriate, other means must be provided to ' +
      'ensure safe condition.',
    keywords: ['examination', 'inspection', 'internal inspection', 'condition monitoring'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['safeguards', 'follow_up'],
  },
  {
    id: 'PED-Annex-I-2.4',
    title: 'Means of draining and venting',
    description:
      'Adequate means shall be provided for draining and venting of pressure equipment where necessary to ' +
      'avoid harmful effects such as water hammer, vacuum collapse, corrosion, and uncontrolled chemical reactions.',
    keywords: ['draining', 'venting', 'water hammer', 'vacuum', 'corrosion', 'chemical reactions'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['safeguards', 'hazard_identification'],
  },
  {
    id: 'PED-Annex-I-2.5',
    title: 'Protection against exceeding allowable limits',
    description:
      'Where operating conditions could exceed allowable limits, pressure equipment shall be fitted with ' +
      'or provision made for protective devices, unless the equipment is protected by other protective ' +
      'devices within an assembly.',
    keywords: ['overpressure protection', 'allowable limits', 'protective devices', 'safety devices'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['safeguards', 'risk_assessment'],
  },
  // Safety Accessories
  {
    id: 'PED-Annex-I-2.10',
    title: 'Safety accessories',
    description:
      'Safety accessories shall be designed and constructed to be reliable and suitable for intended use. ' +
      'They must take account of maintenance and testing requirements where relevant.',
    keywords: ['safety accessories', 'reliability', 'maintenance', 'testing'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['safeguards', 'follow_up'],
  },
  {
    id: 'PED-Annex-I-2.11.1',
    title: 'Pressure limiting devices',
    description:
      'Pressure limiting devices shall be designed so that pressure will not permanently exceed the maximum ' +
      'allowable pressure (PS). However, a short duration pressure surge is permissible where appropriate, ' +
      'limited to 10% of PS.',
    keywords: ['pressure limiting', 'pressure relief', 'PS', 'surge', 'overpressure'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-2.10',
    hazopsRelevance: ['safeguards'],
  },
  {
    id: 'PED-Annex-I-2.11.2',
    title: 'Temperature monitoring devices',
    description:
      'Temperature monitoring devices must have adequate response time for safety, taking account of the ' +
      'design of the pressure equipment.',
    keywords: ['temperature monitoring', 'response time', 'safety instruments'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-2.10',
    hazopsRelevance: ['safeguards'],
  },
  // External Fire
  {
    id: 'PED-Annex-I-2.12',
    title: 'External fire',
    description:
      'Where necessary, pressure equipment shall be designed and, where appropriate, equipped with suitable ' +
      'accessories or provision made for them, to meet damage limitation requirements in the event of ' +
      'external fire, having particular regard to intended use.',
    keywords: ['external fire', 'fire protection', 'damage limitation', 'fire relief'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['safeguards', 'hazard_identification'],
  },
  // Materials
  {
    id: 'PED-Annex-I-4',
    title: 'Materials',
    description:
      'Materials used in the manufacture of pressure equipment shall be suitable for such application during ' +
      'the foreseeable life of the equipment. Materials must have appropriate properties, adequate chemical ' +
      'resistance, not be significantly affected by ageing, and be suitable for intended processing procedures.',
    keywords: ['materials', 'suitability', 'chemical resistance', 'ageing', 'processing'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['safeguards', 'hazard_identification'],
  },
  {
    id: 'PED-Annex-I-4.1',
    title: 'Material properties',
    description:
      'The material shall have properties appropriate to all reasonably foreseeable operating conditions and ' +
      'test conditions. It shall be sufficiently ductile and tough, chemically resistant to the fluid, and ' +
      'not significantly affected by ageing.',
    keywords: ['ductility', 'toughness', 'chemical resistance', 'operating conditions', 'material selection'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-4',
    hazopsRelevance: ['hazard_identification', 'safeguards'],
  },
  // Manufacture and Assembly
  {
    id: 'PED-Annex-I-3',
    title: 'Manufacturing',
    description:
      'The manufacturer shall ensure that the provisions made at the design stage are properly implemented ' +
      'and adequate manufacturing techniques and procedures are used. Includes welding, heat treatment, ' +
      'and traceability.',
    keywords: ['manufacturing', 'welding', 'heat treatment', 'traceability', 'quality control'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I',
    hazopsRelevance: ['methodology', 'safeguards'],
  },
  {
    id: 'PED-Annex-I-3.1.2',
    title: 'Permanent joints',
    description:
      'Permanent joints and adjacent zones shall be free from surface and internal defects detrimental to ' +
      'equipment safety. Welded joints shall be made by suitably qualified welders using approved procedures.',
    keywords: ['permanent joints', 'welding', 'defects', 'qualified welders', 'welding procedures'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-3',
    hazopsRelevance: ['safeguards', 'methodology'],
  },
  {
    id: 'PED-Annex-I-3.1.3',
    title: 'Non-destructive tests',
    description:
      'Non-destructive tests of permanent joints shall be carried out by suitably qualified personnel. ' +
      'For pressure equipment in categories III and IV, the personnel shall have been approved by a ' +
      'third-party organization.',
    keywords: ['NDT', 'non-destructive testing', 'qualification', 'third party', 'inspection'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-3',
    hazopsRelevance: ['methodology', 'follow_up'],
  },
  // Final Assessment and Testing
  {
    id: 'PED-Annex-I-3.2',
    title: 'Final assessment',
    description:
      'Pressure equipment shall undergo final assessment including examination of internal and external ' +
      'surfaces, review of documentation, and a proof test (normally hydrostatic) at a pressure ' +
      'corresponding to 1.25 to 1.43 times PS.',
    keywords: ['final assessment', 'proof test', 'hydrostatic test', 'visual examination'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-3',
    hazopsRelevance: ['methodology', 'follow_up'],
  },
  // Documentation
  {
    id: 'PED-Annex-I-3.3',
    title: 'Marking and labelling',
    description:
      'Pressure equipment shall bear CE marking and information including manufacturer identification, year ' +
      'of manufacture, equipment identification, essential maximum/minimum allowable limits, pressure (PS), ' +
      'temperature limits, volume/nominal size.',
    keywords: ['CE marking', 'labelling', 'identification', 'traceability', 'nameplate'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-3',
    hazopsRelevance: ['documentation'],
  },
  {
    id: 'PED-Annex-I-3.4',
    title: 'Operating instructions',
    description:
      'Pressure equipment shall be accompanied by instructions containing all necessary safety information ' +
      'for putting into service, use, maintenance, inspection, adjustment, and dismantling.',
    keywords: ['operating instructions', 'safety information', 'maintenance', 'user manual'],
    mandatory: true,
    parentClauseId: 'PED-Annex-I-3',
    hazopsRelevance: ['documentation', 'follow_up'],
  },
  // Technical Documentation
  {
    id: 'PED-Annex-III',
    title: 'Technical documentation',
    description:
      'The manufacturer shall draw up technical documentation enabling conformity assessment and including: ' +
      'general description, design and manufacturing drawings, calculations, descriptions of solutions adopted ' +
      'to meet ESR, test reports, and relevant elements of the quality assurance system.',
    keywords: ['technical documentation', 'design drawings', 'calculations', 'test reports', 'conformity'],
    mandatory: true,
    hazopsRelevance: ['documentation'],
  },
  // Conformity Assessment
  {
    id: 'PED-Art-14',
    title: 'Conformity assessment procedures',
    description:
      'Pressure equipment shall be subject to conformity assessment procedures per Annex III. Category I ' +
      'allows self-certification; Categories II-IV require increasing involvement of Notified Bodies ' +
      '(module combinations A2, B+D, B+F, G, H, H1).',
    keywords: ['conformity assessment', 'Notified Body', 'modules', 'certification', 'category'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'documentation'],
  },
  // Assemblies
  {
    id: 'PED-Art-2.6',
    title: 'Assemblies',
    description:
      'An assembly is several pieces of pressure equipment assembled by a manufacturer to constitute an ' +
      'integrated and functional whole. Assemblies must be designed so the various elements are suitably ' +
      'integrated and safe, with at least one item of equipment subject to PED.',
    keywords: ['assembly', 'integration', 'functional whole', 'system'],
    mandatory: true,
    hazopsRelevance: ['methodology', 'hazard_identification'],
  },
  // HazOps-specific Requirements
  {
    id: 'PED-HazOps-1',
    title: 'Pressure hazard identification in HazOps',
    description:
      'During HazOps analysis of pressure equipment, systematically consider: overpressure scenarios, ' +
      'vacuum conditions, thermal expansion, blocked outlets, loss of cooling, runaway reactions, ' +
      'hydraulic hammer, and external fire exposure.',
    keywords: ['HazOps', 'overpressure', 'vacuum', 'thermal expansion', 'blocked outlet', 'runaway reaction'],
    mandatory: false,
    hazopsRelevance: ['hazard_identification', 'risk_assessment'],
  },
  {
    id: 'PED-HazOps-2',
    title: 'Safeguards for pressure equipment',
    description:
      'Typical safeguards for pressure equipment hazards include: pressure relief valves (PRVs), ' +
      'rupture discs, pressure indicators, level indicators, temperature indicators, high-pressure ' +
      'interlocks, process control systems, and emergency shutdown systems.',
    keywords: ['PRV', 'rupture disc', 'pressure relief', 'interlock', 'safeguards', 'ESD'],
    mandatory: false,
    hazopsRelevance: ['safeguards', 'recommendations'],
  },
];

/**
 * PED standard definition.
 */
const PED: RegulatoryStandard = {
  id: 'PED',
  name: 'Pressure Equipment Directive (PED)',
  title: 'Pressure Equipment Directive 2014/68/EU',
  description:
    'European directive for pressure equipment and assemblies with maximum allowable ' +
    'pressure > 0.5 bar. Covers design, manufacture, and conformity assessment of ' +
    'pressure vessels, piping, safety accessories, and pressure accessories. ' +
    'Equipment is categorized I-IV based on hazard level, with conformity assessment ' +
    'procedures ranging from self-certification to full Notified Body involvement.',
  category: 'pressure_equipment',
  jurisdiction: 'european_union',
  version: '2014/68/EU',
  year: 2014,
  issuingBody: 'European Parliament and Council',
  url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32014L0068',
  mandatory: true,
  relatedStandards: ['IEC_61511', 'ATEX_DSEAR', 'SEVESO_III'],
  relevantClauses: PED_CLAUSES,
};

// ============================================================================
// Standards Database
// ============================================================================

/**
 * Complete database of all regulatory standards.
 */
const REGULATORY_STANDARDS_DATABASE: Map<RegulatoryStandardId, RegulatoryStandard> = new Map([
  ['IEC_61511', IEC_61511],
  ['ISO_31000', ISO_31000],
  ['ISO_9001', ISO_9001],
  ['ATEX_DSEAR', ATEX_DSEAR],
  ['PED', PED],
]);

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all regulatory standards.
 *
 * @returns Array of all regulatory standards
 */
export function getAllRegulatoryStandards(): RegulatoryStandard[] {
  return Array.from(REGULATORY_STANDARDS_DATABASE.values());
}

/**
 * Get a regulatory standard by ID.
 *
 * @param id - The standard ID
 * @returns The regulatory standard, or null if not found
 */
export function getRegulatoryStandardById(id: RegulatoryStandardId): RegulatoryStandard | null {
  return REGULATORY_STANDARDS_DATABASE.get(id) ?? null;
}

/**
 * Get regulatory standards filtered by query parameters.
 *
 * @param query - Filter parameters
 * @returns Array of matching standards
 */
export function getRegulatoryStandards(query: ListRegulatoryStandardsQuery = {}): RegulatoryStandard[] {
  let standards = getAllRegulatoryStandards();

  // Filter by category
  if (query.category) {
    standards = standards.filter((s) => s.category === query.category);
  }

  // Filter by jurisdiction
  if (query.jurisdiction) {
    standards = standards.filter((s) => s.jurisdiction === query.jurisdiction);
  }

  // Filter by mandatory status
  if (query.mandatory !== undefined) {
    standards = standards.filter((s) => s.mandatory === query.mandatory);
  }

  // Filter by relevance area
  if (query.relevanceArea) {
    standards = standards.filter((s) =>
      s.relevantClauses.some((clause) =>
        clause.hazopsRelevance.includes(query.relevanceArea as HazopsRelevanceArea)
      )
    );
  }

  return standards;
}

/**
 * Get all standard IDs in the database.
 *
 * @returns Array of standard IDs
 */
export function getAvailableStandardIds(): RegulatoryStandardId[] {
  return Array.from(REGULATORY_STANDARDS_DATABASE.keys());
}

/**
 * Check if a standard exists in the database.
 *
 * @param id - The standard ID to check
 * @returns True if the standard exists
 */
export function isStandardAvailable(id: RegulatoryStandardId): boolean {
  return REGULATORY_STANDARDS_DATABASE.has(id);
}

/**
 * Get clauses for a specific standard.
 *
 * @param standardId - The standard ID
 * @returns Array of clauses, or empty array if standard not found
 */
export function getStandardClauses(standardId: RegulatoryStandardId): RegulatoryClause[] {
  const standard = REGULATORY_STANDARDS_DATABASE.get(standardId);
  return standard?.relevantClauses ?? [];
}

/**
 * Get a specific clause by standard ID and clause ID.
 *
 * @param standardId - The standard ID
 * @param clauseId - The clause ID
 * @returns The clause, or null if not found
 */
export function getClauseById(
  standardId: RegulatoryStandardId,
  clauseId: string
): RegulatoryClause | null {
  const clauses = getStandardClauses(standardId);
  return clauses.find((c) => c.id === clauseId) ?? null;
}

/**
 * Get clauses relevant to a specific HazOps area.
 *
 * @param relevanceArea - The HazOps relevance area
 * @returns Array of tuples [standardId, clause] for all matching clauses
 */
export function getClausesByRelevanceArea(
  relevanceArea: HazopsRelevanceArea
): Array<{ standardId: RegulatoryStandardId; clause: RegulatoryClause }> {
  const results: Array<{ standardId: RegulatoryStandardId; clause: RegulatoryClause }> = [];

  for (const [standardId, standard] of REGULATORY_STANDARDS_DATABASE) {
    for (const clause of standard.relevantClauses) {
      if (clause.hazopsRelevance.includes(relevanceArea)) {
        results.push({ standardId, clause });
      }
    }
  }

  return results;
}

/**
 * Get mandatory clauses for a standard.
 *
 * @param standardId - The standard ID
 * @returns Array of mandatory clauses
 */
export function getMandatoryClauses(standardId: RegulatoryStandardId): RegulatoryClause[] {
  return getStandardClauses(standardId).filter((c) => c.mandatory);
}

/**
 * Search clauses by keyword.
 *
 * @param keyword - The keyword to search for (case-insensitive)
 * @returns Array of matching clauses with their standard IDs
 */
export function searchClauses(
  keyword: string
): Array<{ standardId: RegulatoryStandardId; clause: RegulatoryClause }> {
  const lowerKeyword = keyword.toLowerCase();
  const results: Array<{ standardId: RegulatoryStandardId; clause: RegulatoryClause }> = [];

  for (const [standardId, standard] of REGULATORY_STANDARDS_DATABASE) {
    for (const clause of standard.relevantClauses) {
      const matchesKeywords = clause.keywords.some((k) =>
        k.toLowerCase().includes(lowerKeyword)
      );
      const matchesTitle = clause.title.toLowerCase().includes(lowerKeyword);
      const matchesDescription = clause.description.toLowerCase().includes(lowerKeyword);

      if (matchesKeywords || matchesTitle || matchesDescription) {
        results.push({ standardId, clause });
      }
    }
  }

  return results;
}

/**
 * Get standards by category.
 *
 * @param category - The regulatory category
 * @returns Array of standards in that category
 */
export function getStandardsByCategory(category: RegulatoryCategory): RegulatoryStandard[] {
  return getAllRegulatoryStandards().filter((s) => s.category === category);
}

/**
 * Get standards by jurisdiction.
 *
 * @param jurisdiction - The regulatory jurisdiction
 * @returns Array of standards in that jurisdiction
 */
export function getStandardsByJurisdiction(
  jurisdiction: RegulatoryJurisdiction
): RegulatoryStandard[] {
  return getAllRegulatoryStandards().filter((s) => s.jurisdiction === jurisdiction);
}

/**
 * Get related standards for a given standard.
 *
 * @param standardId - The standard ID
 * @returns Array of related standards
 */
export function getRelatedStandards(standardId: RegulatoryStandardId): RegulatoryStandard[] {
  const standard = REGULATORY_STANDARDS_DATABASE.get(standardId);
  if (!standard) {
    return [];
  }

  return standard.relatedStandards
    .map((id) => REGULATORY_STANDARDS_DATABASE.get(id))
    .filter((s): s is RegulatoryStandard => s !== undefined);
}

/**
 * Get summary statistics for the standards database.
 *
 * @returns Object with database statistics
 */
export function getDatabaseStats(): {
  totalStandards: number;
  totalClauses: number;
  mandatoryStandards: number;
  standardsByCategory: Record<RegulatoryCategory, number>;
  standardsByJurisdiction: Record<RegulatoryJurisdiction, number>;
} {
  const standards = getAllRegulatoryStandards();
  const totalClauses = standards.reduce((sum, s) => sum + s.relevantClauses.length, 0);
  const mandatoryStandards = standards.filter((s) => s.mandatory).length;

  const standardsByCategory: Record<string, number> = {};
  const standardsByJurisdiction: Record<string, number> = {};

  for (const standard of standards) {
    standardsByCategory[standard.category] = (standardsByCategory[standard.category] ?? 0) + 1;
    standardsByJurisdiction[standard.jurisdiction] =
      (standardsByJurisdiction[standard.jurisdiction] ?? 0) + 1;
  }

  return {
    totalStandards: standards.length,
    totalClauses,
    mandatoryStandards,
    standardsByCategory: standardsByCategory as Record<RegulatoryCategory, number>,
    standardsByJurisdiction: standardsByJurisdiction as Record<RegulatoryJurisdiction, number>,
  };
}

/**
 * Get clauses organized by HazOps relevance area.
 *
 * @param standardId - The standard ID (optional, all standards if not provided)
 * @returns Map of relevance areas to clauses
 */
export function getClausesByRelevance(
  standardId?: RegulatoryStandardId
): Map<HazopsRelevanceArea, Array<{ standardId: RegulatoryStandardId; clause: RegulatoryClause }>> {
  const result = new Map<
    HazopsRelevanceArea,
    Array<{ standardId: RegulatoryStandardId; clause: RegulatoryClause }>
  >();

  const standards = standardId
    ? [REGULATORY_STANDARDS_DATABASE.get(standardId)].filter(
        (s): s is RegulatoryStandard => s !== undefined
      )
    : getAllRegulatoryStandards();

  for (const standard of standards) {
    for (const clause of standard.relevantClauses) {
      for (const area of clause.hazopsRelevance) {
        if (!result.has(area)) {
          result.set(area, []);
        }
        result.get(area)!.push({ standardId: standard.id, clause });
      }
    }
  }

  return result;
}
