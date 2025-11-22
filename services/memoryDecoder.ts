
// Simulates decoding a raw memory slot into neuro-symbolic concepts
// In a real system, this would run the vector through a decoder network

export interface DecodedMemory {
  type: 'SENSORY' | 'SPATIAL' | 'ENTITY' | 'INTENT';
  concepts: string[];
  vector: number[]; // Simulated raw vector data
  confidence: number;
  age: number; // Ticks since creation
}

const MEMORY_TYPES = ['SENSORY', 'SPATIAL', 'ENTITY', 'INTENT'] as const;
const CONCEPTS = {
  SENSORY: ['Loud Noise', 'Flash of Light', 'Smell of Smoke', 'Vibration', 'Temperature Drop'],
  SPATIAL: ['Blocked Path', 'Open Area', 'High Elevation', 'Corner', 'Narrow Corridor'],
  ENTITY: ['Goblin Scavenger', 'Player Character', 'Unknown NPC', 'Loot Chest', 'Trap Mechanism'],
  INTENT: ['Attack Target', 'Flee to Cover', 'Patrol Route', 'Interact with Object', 'Idle/Wait']
};

// Deterministic pseudo-random based on index to ensure a slot always "reads" the same content until flushed
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const decodeMemory = (index: number, usage: number, tick: number): DecodedMemory => {
  // Use index as seed
  const seed = index * 1337;
  const typeIndex = Math.floor(pseudoRandom(seed) * MEMORY_TYPES.length);
  const type = MEMORY_TYPES[typeIndex];
  
  const conceptList = CONCEPTS[type];
  const primaryConcept = conceptList[Math.floor(pseudoRandom(seed + 1) * conceptList.length)];
  const secondaryConcept = conceptList[Math.floor(pseudoRandom(seed + 2) * conceptList.length)];
  
  // Generate fake vector (8 dims)
  const vector = Array.from({ length: 8 }, (_, i) => pseudoRandom(seed + i + 10));

  return {
    type,
    concepts: [primaryConcept, secondaryConcept],
    vector,
    confidence: usage, // Usage correlates to confidence/strength
    age: Math.floor(pseudoRandom(seed + 50) * 1000) // Simulated age
  };
};
