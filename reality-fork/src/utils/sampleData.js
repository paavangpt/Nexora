// Sample data for Reality Fork
// Themed as sci-fi configurations for an immersive experience

export const quantumReactor = {
    name: "Quantum Reactor Alpha",
    status: "operational",
    energyOutput: 1.21,
    unit: "gigawatts",
    location: "Sector 7G",
    temperature: 273.15,
    shieldIntegrity: 98.5,
    coolantLevel: "optimal",
    lastMaintenance: "2024-01-15",
};

export const spaceshipConfig = {
    model: "USS Enterprise NCC-1701",
    class: "Constitution",
    warpDrive: "enabled",
    shields: "maximum",
    crew: 430,
    mission: "exploration",
    weapons: "photon torpedoes",
    engine: "matter-antimatter",
    status: "active",
};

export const timelineData = {
    reality: "Prime",
    designation: "Timeline-616",
    year: 2024,
    timeline: "Alpha",
    divergencePoints: 3,
    stability: "high",
    entropyLevel: 0.042,
    observers: 7,
    protected: true,
};

export const neuralNetwork = {
    name: "ARIA-7",
    type: "AGI Prototype",
    nodes: 1000000000,
    learningRate: 0.001,
    accuracy: 99.7,
    trainingStatus: "complete",
    consciousness: "emerging",
    ethicsModule: "active",
};

export const dimensionalGateway = {
    portalId: "GATE-ALPHA-001",
    destination: "Universe-42",
    stability: 87.3,
    power: "charged",
    safetyProtocols: "engaged",
    lastTraversal: "2024-02-01T14:30:00Z",
    travelers: 12,
    returnPath: "active",
};

// Get a random sample for variety
export function getRandomSample() {
    const samples = [
        { name: 'Quantum Reactor', data: quantumReactor },
        { name: 'Spaceship Config', data: spaceshipConfig },
        { name: 'Timeline Data', data: timelineData },
        { name: 'Neural Network', data: neuralNetwork },
        { name: 'Dimensional Gateway', data: dimensionalGateway },
    ];
    return samples[Math.floor(Math.random() * samples.length)];
}

export const allSamples = {
    quantumReactor,
    spaceshipConfig,
    timelineData,
    neuralNetwork,
    dimensionalGateway,
};
