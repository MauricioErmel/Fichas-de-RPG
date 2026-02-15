/**
 * Utility functions and constants for Savage Worlds character sheets
 */

// ===========================================
// Constants
// ===========================================

const DIE_ORDER = ['d4', 'd6', 'd8', 'd10', 'd12', 'd12+1', 'd12+2', 'd12+3', 'd12+4'];

const DIE_VALUES = {
    'd4': 4,
    'd6': 6,
    'd8': 8,
    'd10': 10,
    'd12': 12,
    'd12+1': 13,
    'd12+2': 14,
    'd12+3': 15,
    'd12+4': 16
};

const STRENGTH_CAPACITY = {
    'd4': 10,
    'd6': 20,
    'd8': 30,
    'd10': 40,
    'd12': 50,
    'd12+1': 60,
    'd12+2': 70,
    'd12+3': 80,
    'd12+4': 90
};

const SKILLS_LIST = [
    'Atirar', 'Atletismo', 'Cavalgar', 'Ciência', 'Ciência Estranha',
    'Conhecimento Acadêmico', 'Conhecimento Batalha', 'Conhecimento Geral',
    'Conjurar', 'Consertar', 'Curar', 'Dirigir', 'Eletrônica', 'Fé', 'Foco',
    'Furtividade', 'Hackear', 'Idiomas', 'Intimidar', 'Jogar', 'Ladinagem',
    'Lutar', 'Navegar', 'Ocultismo', 'Perceber', 'Performance', 'Persuadir',
    'Pilotar', 'Provocar', 'Psiônicos', 'Sobrevivência'
];

const ATTRIBUTES_LIST = ['Agilidade', 'Astúcia', 'Espírito', 'Força', 'Vigor'];

const STATUS_LIST = [
    { id: 'shaken', name: 'Abalado', icon: 'img/icons/status/status_shaken.svg' },
    { id: 'distracted', name: 'Distraído', icon: 'img/icons/status/status_distracted.svg' },
    { id: 'vulnerable', name: 'Vulnerável', icon: 'img/icons/status/status_vulnerable.svg' },
    { id: 'stunned', name: 'Atordoado', icon: 'img/icons/status/status_stunned.svg' },
    { id: 'entangled', name: 'Enredado', icon: 'img/icons/status/status_entangled.svg' },
    { id: 'bound', name: 'Preso', icon: 'img/icons/status/status_bound.svg' },
    { id: 'incapacitated', name: 'Incapacitado', icon: 'img/icons/status/status_incapacitated.svg' },
    { id: 'prone', name: 'Caído', icon: 'img/icons/status/status_prone.svg' }
];

const FATIGUE_LEVELS = [
    { id: 'fatigued', name: 'Fatigado', icon: 'img/icons/fatigue/fatigued.svg', penalty: -1 },
    { id: 'exhausted', name: 'Exausto', icon: 'img/icons/fatigue/exhausted.svg', penalty: -2 },
    { id: 'incapacitated', name: 'Incapacitado', icon: 'img/icons/fatigue/incapacitated.svg', penalty: -2 }
];

// ===========================================
// Die Utility Functions
// ===========================================

/**
 * Parse a die string to get its numeric value
 * @param {string} die - Die string like 'd8' or 'd12+2'
 * @returns {number} Numeric value for calculations
 */
function parseDie(die) {
    return DIE_VALUES[die] || 4;
}

/**
 * Get the die icon path
 * @param {string} die - Die string like 'd8' or 'd12+2'
 * @returns {string} Path to the die icon
 */
function getDieIcon(die) {
    if (die === 'd4-2') return 'img/icons/dice/d4.svg';
    const baseDie = die.includes('+') ? 'd12' : die;
    return `img/icons/dice/${baseDie}.svg`;
}

/**
 * Calculate half of a die value (for Parry and Toughness)
 * @param {string} die - Die string like 'd8'
 * @returns {number} Half of the die's max value
 */
function halfDie(die) {
    const value = parseDie(die);
    if (value > 12) {
        return 6 + (value - 12); // d12+X = 6 + X
    }
    return Math.floor(value / 2);
}

// ===========================================
// Calculation Functions
// ===========================================

/**
 * Calculate Parry value
 * @param {string} fightingDie - Fighting skill die
 * @param {Array} modifiers - Array of modifier objects
 * @returns {object} { base, total, modifiers }
 */
function calculateParry(fightingDie, modifiers = []) {
    const base = 2 + halfDie(fightingDie);
    const modTotal = modifiers.reduce((sum, mod) => sum + (mod.value || 0), 0);
    return {
        base,
        total: base + modTotal,
        modifiers: modifiers.filter(m => m.value !== 0)
    };
}

/**
 * Calculate Toughness value
 * @param {string} vigorDie - Vigor attribute die
 * @param {number} armorTorso - Armor value on torso
 * @param {Array} modifiers - Array of modifier objects
 * @returns {object} { base, armor, total, modifiers }
 */
function calculateToughness(vigorDie, armorTorso = 0, modifiers = []) {
    const base = 2 + halfDie(vigorDie);
    const modTotal = modifiers.reduce((sum, mod) => sum + (mod.value || 0), 0);
    return {
        base,
        armor: armorTorso,
        total: base + armorTorso + modTotal,
        modifiers: modifiers.filter(m => m.value !== 0)
    };
}

/**
 * Calculate total penalty from wounds, fatigue, and status
 * @param {number} wounds - Number of wounds
 * @param {number} fatigueLevel - Fatigue level (0-3)
 * @param {object} status - Status object with booleans
 * @returns {number} Total penalty
 */
function calculateTotalPenalty(wounds, fatigueLevel, status = {}) {
    let penalty = 0;

    // Wounds: -1 per wound
    penalty += wounds;

    // Fatigue: -1 fatigued, -2 exhausted/incapacitated
    if (fatigueLevel >= 1) {
        penalty += FATIGUE_LEVELS[fatigueLevel - 1].penalty * -1;
    }

    // Distracted: -2
    if (status.distracted) {
        penalty += 2;
    }

    return penalty;
}

/**
 * Calculate movement penalty from wounds
 * @param {number} wounds - Number of wounds
 * @returns {number} Movement penalty
 */
function calculateMovementPenalty(wounds) {
    return wounds;
}

/**
 * Calculate maximum carry weight based on Strength
 * @param {string} strengthDie - Strength attribute die
 * @returns {number} Max weight in kg
 */
function calculateMaxWeight(strengthDie) {
    return STRENGTH_CAPACITY[strengthDie] || 10;
}

/**
 * Calculate total carried weight from equipment
 * @param {object} equipment - Equipment object with weapons, armor, shields, gear
 * @param {object} equipmentStatusOverrides - Optional status overrides from volatile state
 * @returns {number} Total weight in kg
 */
function calculateTotalWeight(equipment, equipmentStatusOverrides = {}) {
    let total = 0;

    const processItems = (items) => {
        if (!items) return;
        items.forEach(item => {
            const status = equipmentStatusOverrides[item.name] || item.status;
            if (status === 'equipped') {
                total += item.weight || 0;
            } else if (status === 'carried') {
                total += (item.weight || 0) / 2;
            }
            // 'stored' items don't count
        });
    };

    processItems(equipment.weapons);
    processItems(equipment.armor);
    processItems(equipment.shields);
    processItems(equipment.gear);

    return Math.round(total * 10) / 10;
}

/**
 * Check if character meets minimum strength requirement
 * @param {string} charStrength - Character's Strength die
 * @param {string} minStrength - Minimum required Strength die
 * @returns {boolean} True if meets requirement
 */
function meetsStrengthRequirement(charStrength, minStrength) {
    if (!minStrength) return true;
    return parseDie(charStrength) >= parseDie(minStrength);
}

// ===========================================
// Damage Parsing
// ===========================================

/**
 * Parse damage string and replace 'Força' with actual strength die
 * @param {string} damage - Damage string like 'Força+d4'
 * @param {string} strengthDie - Character's Strength die
 * @returns {object} { display, hasStrength }
 */
function parseDamage(damage, strengthDie) {
    if (!damage) return { display: '-', hasStrength: false };

    const hasStrength = damage.toLowerCase().includes('força') || damage.toLowerCase().includes('strength');

    if (hasStrength) {
        const display = damage.replace(/força/gi, strengthDie).replace(/strength/gi, strengthDie);
        return { display, hasStrength: true, originalStrength: strengthDie };
    }

    return { display: damage, hasStrength: false };
}

// ===========================================
// Storage Functions
// ===========================================

/**
 * Save volatile state to localStorage
 * @param {string} characterId - Unique character identifier
 * @param {object} state - State object to save
 */
function saveVolatileState(characterId, state) {
    const key = `rpg-sheet-${characterId}`;
    localStorage.setItem(key, JSON.stringify(state));
}

/**
 * Load volatile state from localStorage
 * @param {string} characterId - Unique character identifier
 * @returns {object|null} Saved state or null
 */
function loadVolatileState(characterId) {
    const key = `rpg-sheet-${characterId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Get default volatile state
 * @param {object} character - Character data
 * @returns {object} Default volatile state
 */
function getDefaultVolatileState(character) {
    return {
        wounds: 0,
        maxWounds: 3 + (character.volatile?.extraWounds || 0),
        fatigueLevel: 0,
        bennies: 3 + (character.volatile?.extraBennies || 0),
        status: {
            shaken: false,
            distracted: false,
            vulnerable: false,
            stunned: false,
            entangled: false,
            bound: false,
            incapacitated: false,
            prone: false
        },
        equipmentStatus: {}
    };
}

// ===========================================
// File Generation
// ===========================================

/**
 * Generate filename for character export
 * @param {string} characterName - Character's name
 * @returns {string} Filename like 'char-abel-20260207-213955.json'
 */
function generateFilename(characterName) {
    const sanitizedName = characterName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');

    return `char-${sanitizedName}-${date}-${time}.json`;
}

/**
 * Download a JSON file
 * @param {object} data - Data to save
 * @param {string} filename - Filename
 */
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===========================================
// ID Generation
// ===========================================

/**
 * Generate a simple unique ID for a character
 * @param {object} character - Character data
 * @returns {string} Unique ID based on name
 */
function generateCharacterId(character) {
    const name = character.header?.name || 'unknown';
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}
