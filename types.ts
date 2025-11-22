
export interface BrainConfig {
  obsDim: number;
  thoughtDim: number;
  startMemSlots: number;
  maxMemSlots: number;
  expansionThreshold: number;
}

export interface EmotionVector {
  valence: number;   // -1.0 (Negative) to 1.0 (Positive)
  arousal: number;   // -1.0 (Calm) to 1.0 (Excited)
  dominance: number; // -1.0 (Submissive) to 1.0 (Dominant)
}

export interface TrainingMetrics {
  step: number;
  totalLoss: number;
  lossAct: number;
  lossVal: number;
  lossEmo: number;
  lossWs: number;
}

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI' | 'SYSTEM';
  text: string;
  timestamp: number;
  variant?: 'default' | 'alert' | 'success';
}

export interface SimulationState {
  tick: number;
  memoryCapacity: number;
  currentPressure: number;
  pressureHistory: { tick: number; pressure: number }[];
  memorySlots: number[]; // Represents usage of each slot (0.0 to 1.0)
  thoughtVector: number[]; // Simplified representation
  emotionVector: EmotionVector; // Continuous VAD Emotion State
  workspaceVector: number[]; // Global Conscious Workspace (Latent)
  lastAction: string;
  logs: string[];
  chatHistory: ChatMessage[]; // Conversation history
  isExpanding: boolean;
  trainingMetrics?: TrainingMetrics; // New field for distillation data
}

export const DEFAULT_CONFIG: BrainConfig = {
  obsDim: 96,
  thoughtDim: 32,
  startMemSlots: 256,
  maxMemSlots: 2048,
  expansionThreshold: 0.85,
};
