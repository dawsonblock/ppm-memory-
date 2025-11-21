import { BrainConfig, SimulationState } from '../types';

const ACTIONS = [
  "IDLE", "MOVE_FORWARD", "TURN_LEFT", "TURN_RIGHT", 
  "ATTACK", "DEFEND", "INTERACT", "USE_ITEM", 
  "RELOAD", "JUMP", "CROUCH", "SCAN_AREA"
];

export const generateInitialState = (config: BrainConfig): SimulationState => {
  return {
    tick: 0,
    memoryCapacity: config.startMemSlots,
    currentPressure: 0.1,
    pressureHistory: Array.from({ length: 20 }, (_, i) => ({ tick: i, pressure: 0.1 })),
    memorySlots: Array(config.startMemSlots).fill(0).map(() => Math.random() * 0.2),
    thoughtVector: Array(8).fill(0).map(() => Math.random()), // Visualizing just 8 dims
    lastAction: "IDLE",
    logs: ["[SYSTEM] Brain initialized. Memory: " + config.startMemSlots + " slots."],
    isExpanding: false,
  };
};

export const processTick = (
  prevState: SimulationState, 
  config: BrainConfig, 
  forceFlood: boolean
): SimulationState => {
  const newTick = prevState.tick + 1;
  let newCapacity = prevState.memoryCapacity;
  let isExpanding = false;
  const newLogs = [...prevState.logs];

  // 1. Simulate Input & Pressure
  // If flood is active, spike pressure to 0.90-0.99, otherwise random fluctuation 0.3-0.6
  const basePressure = forceFlood ? 0.90 + Math.random() * 0.09 : 0.3 + Math.random() * 0.3;
  
  // Decay some slots, fill others
  const newSlots = prevState.memorySlots.map(usage => {
    // Decay
    let newUsage = usage * 0.99;
    // Random write event
    if (Math.random() > 0.8) {
      newUsage = Math.min(1.0, newUsage + 0.5);
    }
    return newUsage;
  });
  
  // If flooding, fill almost all slots
  if (forceFlood) {
    for(let i=0; i<newSlots.length; i++) {
      if (Math.random() > 0.1) newSlots[i] = 0.9 + Math.random() * 0.1;
    }
  }

  // Calculate actual pressure from slots
  const usedSlots = newSlots.filter(u => u > 0.01).length;
  const calculatedPressure = usedSlots / newCapacity;
  
  // Use the higher of the two for demo purposes (simulated vs calculated)
  const finalPressure = Math.max(basePressure, calculatedPressure);

  // 2. Expansion Check
  if (finalPressure > config.expansionThreshold && newCapacity < config.maxMemSlots) {
    newCapacity *= 2;
    isExpanding = true;
    newLogs.push(`[ALERT] Pressure ${(finalPressure * 100).toFixed(1)}% > Threshold. Expanding PMM...`);
    newLogs.push(`[SYSTEM] Hot-swap complete. New Capacity: ${newCapacity} slots.`);
    
    // Resize slots array
    const expansionSize = newCapacity - newSlots.length;
    const emptySlots = Array(expansionSize).fill(0);
    newSlots.push(...emptySlots);
  }

  // 3. Simulate Inference
  const newThought = prevState.thoughtVector.map(v => Math.tanh(v + (Math.random() - 0.5) * 0.5));
  const newAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

  // 4. Update History
  const newHistory = [...prevState.pressureHistory, { tick: newTick, pressure: finalPressure }];
  if (newHistory.length > 50) newHistory.shift();

  // Trim logs
  if (newLogs.length > 20) newLogs.shift();

  return {
    tick: newTick,
    memoryCapacity: newCapacity,
    currentPressure: finalPressure,
    pressureHistory: newHistory,
    memorySlots: newSlots,
    thoughtVector: newThought,
    lastAction: newAction,
    logs: newLogs,
    isExpanding,
  };
};