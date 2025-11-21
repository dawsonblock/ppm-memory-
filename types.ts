export interface BrainConfig {
  obsDim: number;
  thoughtDim: number;
  startMemSlots: number;
  maxMemSlots: number;
  expansionThreshold: number;
}

export interface SimulationState {
  tick: number;
  memoryCapacity: number;
  currentPressure: number;
  pressureHistory: { tick: number; pressure: number }[];
  memorySlots: number[]; // Represents usage of each slot (0.0 to 1.0)
  thoughtVector: number[]; // Simplified representation
  lastAction: string;
  logs: string[];
  isExpanding: boolean;
}

export const DEFAULT_CONFIG: BrainConfig = {
  obsDim: 96,
  thoughtDim: 32,
  startMemSlots: 256,
  maxMemSlots: 2048,
  expansionThreshold: 0.85,
};