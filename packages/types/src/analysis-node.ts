/**
 * Analysis Node type definitions for HazOp Assistant.
 *
 * Analysis nodes represent equipment or components on a P&ID that are
 * subject to HazOps analysis. Each node is associated with a P&ID document
 * and has a position (coordinates) for visual overlay on the diagram.
 */

/**
 * Equipment types for analysis nodes.
 *
 * - pump: Fluid moving equipment
 * - valve: Flow control devices
 * - reactor: Chemical reaction vessels
 * - heat_exchanger: Heat transfer equipment
 * - pipe: Process piping
 * - tank: Storage vessels
 * - other: Miscellaneous equipment
 */
export type EquipmentType =
  | 'pump'
  | 'valve'
  | 'reactor'
  | 'heat_exchanger'
  | 'pipe'
  | 'tank'
  | 'other';

/**
 * All available equipment types as a constant array.
 * Useful for validation, dropdowns, and iteration.
 */
export const EQUIPMENT_TYPES: readonly EquipmentType[] = [
  'pump',
  'valve',
  'reactor',
  'heat_exchanger',
  'pipe',
  'tank',
  'other',
] as const;

/**
 * Human-readable labels for equipment types.
 */
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  pump: 'Pump',
  valve: 'Valve',
  reactor: 'Reactor',
  heat_exchanger: 'Heat Exchanger',
  pipe: 'Pipe',
  tank: 'Tank',
  other: 'Other',
};

/**
 * Analysis node entity representing a point of analysis on a P&ID.
 */
export interface AnalysisNode {
  /** Unique identifier (UUID) */
  id: string;

  /** ID of the P&ID document this node belongs to */
  documentId: string;

  /** User-defined node identifier (e.g., "P-101", "V-200") */
  nodeId: string;

  /** Description of the node/equipment */
  description: string;

  /** Type of equipment */
  equipmentType: EquipmentType;

  /** X coordinate on the P&ID (percentage of document width, 0-100) */
  x: number;

  /** Y coordinate on the P&ID (percentage of document height, 0-100) */
  y: number;

  /** ID of the user who created this node */
  createdById: string;

  /** Timestamp when the node was created */
  createdAt: Date;

  /** Timestamp when the node was last updated */
  updatedAt: Date;
}

/**
 * Analysis node with creator information (for display purposes).
 */
export interface AnalysisNodeWithCreator extends AnalysisNode {
  /** Name of the user who created the node */
  createdByName: string;

  /** Email of the user who created the node */
  createdByEmail: string;
}

/**
 * Analysis node with analysis count (for list views).
 */
export interface AnalysisNodeWithAnalysisCount extends AnalysisNode {
  /** Number of HazOps analysis entries for this node */
  analysisCount: number;

  /** Whether all guide words have been analyzed for this node */
  analysisComplete: boolean;
}

/**
 * Payload for creating a new analysis node.
 */
export interface CreateAnalysisNodePayload {
  /** ID of the P&ID document to add the node to */
  documentId: string;

  /** User-defined node identifier (e.g., "P-101", "V-200") */
  nodeId: string;

  /** Description of the node/equipment */
  description: string;

  /** Type of equipment */
  equipmentType: EquipmentType;

  /** X coordinate on the P&ID (percentage of document width, 0-100) */
  x: number;

  /** Y coordinate on the P&ID (percentage of document height, 0-100) */
  y: number;
}

/**
 * Payload for updating an existing analysis node.
 * All fields are optional - only provided fields are updated.
 */
export interface UpdateAnalysisNodePayload {
  /** User-defined node identifier (e.g., "P-101", "V-200") */
  nodeId?: string;

  /** Description of the node/equipment */
  description?: string;

  /** Type of equipment */
  equipmentType?: EquipmentType;

  /** X coordinate on the P&ID (percentage of document width, 0-100) */
  x?: number;

  /** Y coordinate on the P&ID (percentage of document height, 0-100) */
  y?: number;
}
