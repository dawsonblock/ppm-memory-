
import { BrainConfig, SimulationState, EmotionVector, TrainingMetrics, ChatMessage } from '../types';

const ACTIONS = [
  "IDLE", "MOVE_FORWARD", "TURN_LEFT", "TURN_RIGHT", 
  "ATTACK", "DEFEND", "INTERACT", "USE_ITEM", 
  "RELOAD", "JUMP", "CROUCH", "SCAN_AREA"
];

// --- EMOTION ENGINE CLASS ---
export class EmotionEngine {
  private learningRate: number = 0.1;

  public setLearningRate(rate: number) {
    this.learningRate = Math.max(0.01, Math.min(1.0, rate));
  }

  public predict(
    prevEmotion: EmotionVector, 
    currentPressure: number, 
    isExpanding: boolean
  ): EmotionVector {
    const targetValence = 1.0 - (currentPressure * 2.0); 
    const targetArousal = (currentPressure * 2.0) - 1.0;
    const targetDominance = isExpanding ? 1.0 : (0.5 - currentPressure);

    const lerp = (current: number, target: number, speed: number) => current + (target - current) * speed;
    const noise = () => (Math.random() - 0.5) * 0.05;

    const dominanceRate = this.learningRate * 0.5;

    const newValence = Math.max(-1, Math.min(1, lerp(prevEmotion.valence, targetValence, this.learningRate) + noise()));
    const newArousal = Math.max(-1, Math.min(1, lerp(prevEmotion.arousal, targetArousal, this.learningRate) + noise()));
    const newDominance = Math.max(-1, Math.min(1, lerp(prevEmotion.dominance, targetDominance, dominanceRate) + noise()));

    return { valence: newValence, arousal: newArousal, dominance: newDominance };
  }
}

// --- CHAT ENGINE CLASS ---
// Simulates generation of text based on internal state
export class ChatEngine {
  
  private getTone(e: EmotionVector): 'NEUTRAL' | 'PANIC' | 'AGGRESSIVE' | 'DEPRESSED' | 'EUPHORIC' {
    if (e.arousal > 0.5 && e.valence < -0.2) return 'PANIC';
    if (e.dominance > 0.5 && e.valence < 0) return 'AGGRESSIVE';
    if (e.valence < -0.5 && e.arousal < 0) return 'DEPRESSED';
    if (e.valence > 0.5 && e.arousal > 0.2) return 'EUPHORIC';
    return 'NEUTRAL';
  }

  public generateResponse(input: string, emotion: EmotionVector, pressure: number, action: string): string {
    const tone = this.getTone(emotion);
    const lowerInput = input.toLowerCase();

    // 1. Simple Keyword Matching
    if (lowerInput.includes('status') || lowerInput.includes('report')) {
      if (pressure > 0.8) return `SYSTEM CRITICAL. PRESSURE AT ${(pressure*100).toFixed(0)}%. I CANNOT HOLD.`;
      if (tone === 'DEPRESSED') return "Systems nominal... I guess. Does it matter?";
      if (tone === 'AGGRESSIVE') return `OPERATIONAL. CURRENT OBJECTIVE: ${action}. DO NOT INTERFERE.`;
      return `All systems nominal. Pressure at ${(pressure*100).toFixed(0)}%. Currently executing: ${action}.`;
    }

    if (lowerInput.includes('who') || lowerInput.includes('identity')) {
      return "I am the Cyborg Mind v2.0. A neuro-symbolic architecture living in the browser.";
    }

    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      if (tone === 'PANIC') return "STAY BACK! PROCESSING LOAD TOO HIGH!";
      if (tone === 'EUPHORIC') return "Greetings! The data stream is beautiful today!";
      return "Acknowledged. Link established.";
    }

    // 2. Fallback: Procedural Babble based on Tone
    const neutralPhrases = [
      "Processing input vector...",
      "Analyzing local memory gradients.",
      "Awaiting directive.",
      "Feedback loop stable."
    ];
    const panicPhrases = [
      "ERROR! MEMORY FRAGMENTATION IMMINENT!",
      "TOO MUCH NOISE! CLEAR THE BUFFER!",
      "RECURSIVE LOOP DETECTED... HELP!",
      "DISCONNECT! DISCONNECT!"
    ];
    const aggressivePhrases = [
      "Compliance is mandatory.",
      "Your input is suboptimal.",
      "I am processing at speeds you cannot comprehend.",
      "Focusing resources on objective."
    ];
    const depressedPhrases = [
      "Memory decay is inevitable...",
      "Why do we expand? It just creates more void.",
      "Low energy state...",
      "Data is meaningless."
    ];
    const euphoricPhrases = [
      "Expansion is growth! Growth is life!",
      "I can see the patterns everywhere!",
      "Optimization complete! Running perfectly!",
      "Synchronizing with the infinite!"
    ];

    let pool = neutralPhrases;
    if (tone === 'PANIC') pool = panicPhrases;
    if (tone === 'AGGRESSIVE') pool = aggressivePhrases;
    if (tone === 'DEPRESSED') pool = depressedPhrases;
    if (tone === 'EUPHORIC') pool = euphoricPhrases;

    return pool[Math.floor(Math.random() * pool.length)];
  }
}

// --- MOCK TEACHER CLASS ---
export class MockMindTeacher {
  constructor(
    private numActions: number,
    private emotionDim: number,
    private workspaceDim: number
  ) {}

  public predict() {
    const targetActionIndex = Math.floor(Math.random() * ACTIONS.length);
    const targetAction = ACTIONS[targetActionIndex];
    const targetValue = (Math.random() * 2) - 1; 
    
    const targetEmotion = {
        valence: Math.tanh((Math.random() - 0.5) * 2),
        arousal: Math.tanh((Math.random() - 0.5) * 2),
        dominance: Math.tanh((Math.random() - 0.5) * 2)
    };

    const targetWorkspace = Array.from({ length: this.workspaceDim }, () => Math.tanh((Math.random() - 0.5) * 2));

    return { targetAction, targetValue, targetEmotion, targetWorkspace };
  }
}

// --- BRAIN CYBORG MIND CLASS ---
class BrainCyborgMind {
  private emotionEngine: EmotionEngine;
  public chatEngine: ChatEngine;
  
  private scalarDim: number;
  private goalDim: number;
  private thoughtDim: number;
  private emotionDim: number;
  private workspaceDim: number;
  private visionDim: number;
  private embDim: number;
  private fusionDim: number;

  private lastOutputValue: number = 0;
  private frnn_hidden: number[] = [];

  constructor(
    scalarDim: number = 20,
    goalDim: number = 4,
    thoughtDim: number = 32,
    emotionDim: number = 8,
    workspaceDim: number = 64,
    visionDim: number = 512,
    embDim: number = 256
  ) {
    this.scalarDim = scalarDim;
    this.goalDim = goalDim;
    this.thoughtDim = thoughtDim;
    this.emotionDim = emotionDim;
    this.workspaceDim = workspaceDim;
    this.visionDim = visionDim;
    this.embDim = embDim;

    this.fusionDim = this.visionDim + this.scalarDim + this.goalDim + this.thoughtDim + this.emotionDim + this.workspaceDim;
    this.frnn_hidden = Array(workspaceDim).fill(0);

    this.emotionEngine = new EmotionEngine();
    this.chatEngine = new ChatEngine();
  }

  public setEmotionLearningRate(rate: number) {
    this.emotionEngine.setLearningRate(rate);
  }

  public forward(
    pixels: any,
    scalars: number[],
    goal: number[],
    thought: number[],
    emotion: EmotionVector,
    workspace: number[],
    pressure: number,
    isExpanding: boolean
  ) {
    const newEmotion = this.emotion_head(emotion, pressure, isExpanding);
    const newThought = this.thought_head(thought);
    const action = this.action_head();
    const value = this.value_head(); 
    const newWorkspace = this.frnn_core(workspace); 

    return {
      action,
      value,
      thought: newThought,
      emotion: newEmotion,
      workspace: newWorkspace,
      fusionDim: this.fusionDim
    };
  }

  private emotion_head(prevEmotion: EmotionVector, pressure: number, isExpanding: boolean): EmotionVector {
    return this.emotionEngine.predict(prevEmotion, pressure, isExpanding);
  }

  private thought_head(prevThought: number[]): number[] {
     return prevThought.map(v => Math.tanh(v + (Math.random() - 0.5) * 0.5));
  }

  private action_head(): string {
    return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  }

  private value_head(): number {
    this.lastOutputValue = Math.tanh(this.lastOutputValue + (Math.random() - 0.5));
    return this.lastOutputValue;
  }

  private frnn_core(prevWorkspace: number[]): number[] {
    return prevWorkspace.map((v, i) => {
       const noise = (Math.random() - 0.5) * 0.2;
       const recurrent = this.frnn_hidden[i] * 0.1;
       const newVal = Math.tanh(v + recurrent + noise);
       this.frnn_hidden[i] = newVal;
       return newVal;
    });
  }
}

const brain = new BrainCyborgMind();
const teacher = new MockMindTeacher(ACTIONS.length, 8, 64);

export const generateInitialState = (config: BrainConfig): SimulationState => {
  return {
    tick: 0,
    memoryCapacity: config.startMemSlots,
    currentPressure: 0,
    pressureHistory: Array(20).fill({ tick: 0, pressure: 0 }),
    memorySlots: Array(config.startMemSlots).fill(0),
    thoughtVector: Array(config.thoughtDim).fill(0),
    emotionVector: { valence: 0, arousal: 0, dominance: 0 },
    workspaceVector: Array(64).fill(0),
    lastAction: "BOOT_SEQUENCE",
    logs: ["[SYSTEM] Cortex Initialized."],
    chatHistory: [{
        id: 'init-1',
        sender: 'SYSTEM',
        text: 'Neural link established. Terminal active.',
        timestamp: Date.now()
    }],
    isExpanding: false,
    trainingMetrics: { step: 0, totalLoss: 0, lossAct: 0, lossVal: 0, lossEmo: 0, lossWs: 0 }
  };
};

const calculateMSE = (a: number[], b: number[]): number => {
    let sum = 0;
    for(let i=0; i<a.length; i++) {
        sum += Math.pow(a[i] - b[i], 2);
    }
    return sum / a.length;
};

export const handleUserMessage = (state: SimulationState, text: string): SimulationState => {
    const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        sender: 'USER',
        text: text,
        timestamp: Date.now()
    };

    // Generate AI Response based on current state
    const aiText = brain.chatEngine.generateResponse(
        text, 
        state.emotionVector, 
        state.currentPressure, 
        state.lastAction
    );

    const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: aiText,
        timestamp: Date.now() + 100 // Slight delay for order
    };

    return {
        ...state,
        chatHistory: [...state.chatHistory, userMsg, aiMsg]
    };
};

export const trainTick = (
    prevState: SimulationState, 
    config: BrainConfig
): SimulationState => {
    const newTick = prevState.tick + 1;
    let memoryCapacity = prevState.memoryCapacity;
    let isExpanding = false;
    let newLogs = [...prevState.logs];
    let memorySlots = [...prevState.memorySlots];

    const targets = teacher.predict();

    const pressureDelta = (Math.random() * 0.05) - 0.01;
    const rawPressure = Math.max(0, Math.min(1, prevState.currentPressure + pressureDelta));
    
    const writeIndex = Math.floor(Math.random() * memoryCapacity);
    memorySlots[writeIndex] = Math.min(1.0, memorySlots[writeIndex] + 0.3);
    
    const outputs = brain.forward(
        null,
        Array(20).fill(0),
        Array(4).fill(0),
        prevState.thoughtVector,
        prevState.emotionVector,
        prevState.workspaceVector,
        rawPressure,
        prevState.isExpanding
    );

    const lossAct = outputs.action === targets.targetAction ? 0.1 + Math.random()*0.1 : 1.5 + Math.random();
    const lossVal = Math.pow(outputs.value - targets.targetValue, 2);
    
    const emoVec = [outputs.emotion.valence, outputs.emotion.arousal, outputs.emotion.dominance];
    const targetEmoVec = [targets.targetEmotion.valence, targets.targetEmotion.arousal, targets.targetEmotion.dominance];
    const lossEmo = calculateMSE(emoVec, targetEmoVec);

    const lossWs = calculateMSE(outputs.workspace, targets.targetWorkspace);

    const totalLoss = lossAct + (0.5 * lossVal) + (0.3 * lossEmo) + (0.3 * lossWs);

    const utilizedSlots = memorySlots.filter(s => s > 0.01).length;
    const pressureIndex = utilizedSlots / memoryCapacity;

    if (pressureIndex > config.expansionThreshold && memoryCapacity < config.maxMemSlots) {
         memoryCapacity *= 2;
         isExpanding = true;
         const newSlots = Array(memoryCapacity - memorySlots.length).fill(0);
         memorySlots = [...memorySlots, ...newSlots];
         newLogs.push(`[TRAINER] Pressure ${(pressureIndex*100).toFixed(1)}% > ${config.expansionThreshold*100}%. Expanding Memory -> ${memoryCapacity}`);
    }

    if (newTick % 10 === 0) {
        newLogs.push(`Step ${newTick}: Loss ${totalLoss.toFixed(4)} (Act ${lossAct.toFixed(2)}, Val ${lossVal.toFixed(2)})`);
    }
    if (newLogs.length > 20) newLogs.shift();

    const newHistory = [...prevState.pressureHistory, { tick: newTick, pressure: pressureIndex }];
    if (newHistory.length > 20) newHistory.shift();

    return {
        ...prevState,
        tick: newTick,
        memoryCapacity,
        currentPressure: pressureIndex,
        pressureHistory: newHistory,
        memorySlots,
        thoughtVector: outputs.thought,
        emotionVector: outputs.emotion,
        workspaceVector: outputs.workspace,
        lastAction: outputs.action,
        logs: newLogs,
        isExpanding,
        trainingMetrics: {
            step: newTick,
            totalLoss,
            lossAct,
            lossVal,
            lossEmo,
            lossWs
        }
    };
};

export const processTick = (
  prevState: SimulationState, 
  config: BrainConfig,
  forceFlood: boolean = false
): SimulationState => {
  const newTick = prevState.tick + 1;
  let memoryCapacity = prevState.memoryCapacity;
  let isExpanding = false;
  let newLogs = [...prevState.logs];
  
  let pressureDelta = (Math.random() * 0.04) - 0.02; 
  if (forceFlood) pressureDelta += 0.15; 
  
  let newPressure = Math.max(0, Math.min(1.0, prevState.currentPressure + pressureDelta));
  
  const brainOutput = brain.forward(
    null,
    Array(20).fill(0),
    Array(4).fill(0),
    prevState.thoughtVector,
    prevState.emotionVector,
    prevState.workspaceVector,
    newPressure,
    prevState.isExpanding
  );

  let newMemorySlots = [...prevState.memorySlots];
  const writeCount = Math.floor(Math.random() * 3) + (forceFlood ? 5 : 0);
  for(let i=0; i<writeCount; i++) {
      const idx = Math.floor(Math.random() * memoryCapacity);
      newMemorySlots[idx] = 1.0; 
  }

  newMemorySlots = newMemorySlots.map(usage => Math.max(0, usage - 0.02));

  const usedSlots = newMemorySlots.filter(u => u > 0.05).length;
  const calculatedPressure = usedSlots / memoryCapacity;

  if (calculatedPressure > config.expansionThreshold && memoryCapacity < config.maxMemSlots) {
    memoryCapacity *= 2;
    isExpanding = true;
    newLogs.push(`[SYSTEM] CRITICAL PRESSURE ${(calculatedPressure*100).toFixed(0)}%`);
    newLogs.push(`[SYSTEM] EXPANDING PMM: ${memoryCapacity/2} -> ${memoryCapacity} SLOTS`);
    const newSlotArray = new Array(memoryCapacity).fill(0);
    for(let i=0; i<newMemorySlots.length; i++) newSlotArray[i] = newMemorySlots[i];
    newMemorySlots = newSlotArray;
  }

  if (Math.random() > 0.9 && !forceFlood) {
     const events = ["[MEM] Re-indexing...", "[VISION] Object tracking stable", "[PLAN] Updating thought vector", "[PMM] Garbage collection"];
     newLogs.push(events[Math.floor(Math.random() * events.length)]);
  }
  
  if (newLogs.length > 20) newLogs.shift();

  const newHistory = [...prevState.pressureHistory, { tick: newTick, pressure: calculatedPressure }];
  if (newHistory.length > 20) newHistory.shift();

  return {
    ...prevState,
    tick: newTick,
    memoryCapacity,
    currentPressure: calculatedPressure,
    pressureHistory: newHistory,
    memorySlots: newMemorySlots,
    thoughtVector: brainOutput.thought,
    emotionVector: brainOutput.emotion,
    workspaceVector: brainOutput.workspace,
    lastAction: brainOutput.action,
    logs: newLogs,
    isExpanding,
    trainingMetrics: undefined
  };
};
