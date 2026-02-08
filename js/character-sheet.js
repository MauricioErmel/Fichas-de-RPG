/**
 * Character Sheet display logic
 */

const CharacterSheet = {
    currentCharacter: null,
    volatileState: null,

    /**
     * Load a character and display it
     * @param {object} character - Character data
     */
    loadCharacter(character) {
        this.currentCharacter = character;
        const charId = generateCharacterId(character);

        // Load or initialize volatile state
        this.volatileState = loadVolatileState(charId) || getDefaultVolatileState(character);

        // Ensure maxWounds is updated if character has extra wounds
        this.volatileState.maxWounds = 3 + (character.volatile?.extraWounds || 0);

        this.render();
    },

    /**
     * Save current volatile state
     */
    saveState() {
        if (this.currentCharacter) {
            const charId = generateCharacterId(this.currentCharacter);
            saveVolatileState(charId, this.volatileState);
        }
    },

    /**
     * Get current total penalty
     */
    getTotalPenalty() {
        return calculateTotalPenalty(
            this.volatileState.wounds,
            this.volatileState.fatigueLevel,
            this.volatileState.status
        );
    },

    /**
     * Main render function
     */
    render() {
        const container = document.getElementById('character-sheet-content');
        if (!container || !this.currentCharacter) return;

        const char = this.currentCharacter;
        const penalty = this.getTotalPenalty();

        container.innerHTML = `
            ${this.renderHeader(char)}
            ${this.renderSubheader(char)}
            ${this.renderDerivedStats(char)}
            ${this.renderAttributes(char, penalty)}
            ${this.renderSkills(char, penalty)}
            ${this.renderEdges(char)}
            ${this.renderHindrances(char)}
            ${this.renderEquipment(char)}
            ${this.renderPowers(char)}
            ${this.renderBiography(char)}
        `;

        this.setupEventListeners();
    },

    /**
     * Render character header
     */
    renderHeader(char) {
        const portrait = char.portrait || 'img/icons/character-default.svg';
        const header = char.header || {};

        return `
            <div class="sheet-header">
                <img 
                    src="${portrait}" 
                    alt="${header.name || ''}" 
                    class="sheet-portrait"
                    onerror="this.src='img/icons/character-default.svg'"
                />
                <div class="sheet-info flex-1">
                    <h1>${header.name || t('header.name')}</h1>
                    <div class="info-grid">
                        <span><strong>${t('header.race')}:</strong> ${header.race || '-'}</span>
                        <span><strong>${t('header.age')}:</strong> ${header.age || '-'}</span>
                        <span><strong>${t('header.height')}:</strong> ${header.height || '-'}</span>
                        <span><strong>${t('header.weight')}:</strong> ${header.weight || '-'}</span>
                        <span><strong>${t('header.advances')}:</strong> ${header.advances || 0}</span>
                    </div>
                </div>
                <img src="img/systems/swade.webp" alt="Savage Worlds" class="h-12 w-auto hidden sm:block" />
            </div>
        `;
    },

    /**
     * Render subheader (fatigue, wounds, bennies, status)
     */
    renderSubheader(char) {
        return `
            <div class="sheet-subheader">
                ${this.renderFatigue()}
                ${this.renderWounds()}
                ${this.renderBennies()}
                ${this.renderStatus()}
            </div>
        `;
    },

    /**
     * Render fatigue section
     */
    renderFatigue() {
        const currentLevel = this.volatileState.fatigueLevel;

        return `
            <div class="stat-box">
                <h3>${t('subheader.fatigue')}</h3>
                <div class="fatigue-levels">
                    ${FATIGUE_LEVELS.map((level, idx) => `
                        <div class="fatigue-level ${currentLevel > idx ? 'active' : ''}" data-level="${idx + 1}">
                            <img src="${level.icon}" alt="${level.name}" />
                            <span>${t('fatigueLevel.' + level.id)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render wounds section
     */
    renderWounds() {
        const wounds = this.volatileState.wounds;
        const maxWounds = this.volatileState.maxWounds;

        return `
            <div class="stat-box">
                <h3>${t('subheader.wounds')} (${wounds}/${maxWounds})</h3>
                <div class="wounds-container">
                    ${Array(maxWounds).fill(0).map((_, idx) => `
                        <div class="wound-circle ${idx < wounds ? 'active' : ''}" data-wound="${idx}"></div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render bennies section
     */
    renderBennies() {
        const bennies = this.volatileState.bennies;

        return `
            <div class="stat-box">
                <h3>${t('subheader.bennies')}</h3>
                <div class="bennies-container">
                    <button class="btn btn-sm btn-ghost" data-benny-action="decrease">−</button>
                    <img src="img/icons/benny.svg" alt="Benny" />
                    <span class="benny-count">${bennies}</span>
                    <button class="btn btn-sm btn-ghost" data-benny-action="increase">+</button>
                </div>
            </div>
        `;
    },

    /**
     * Render status section
     */
    renderStatus() {
        const status = this.volatileState.status;

        return `
            <div class="stat-box col-span-full lg:col-span-1">
                <h3>${t('subheader.status')}</h3>
                <div class="status-grid">
                    ${STATUS_LIST.map(s => `
                        <div class="status-item ${status[s.id] ? 'active' : ''}" data-status="${s.id}">
                            <img src="${s.icon}" alt="${s.name}" />
                            <span>${t('statusNames.' + s.id)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render derived stats
     */
    renderDerivedStats(char) {
        const derivedStats = char.derivedStats || {};
        const attrs = char.attributes || {};
        const skills = char.skills || [];

        // Find Fighting skill
        const fightingSkill = skills.find(s =>
            s.name.toLowerCase() === 'lutar' || s.name.toLowerCase() === 'fighting'
        );
        const fightingDie = fightingSkill?.die || 'd4-2';

        // Calculate Parry
        const parryMods = derivedStats.parryModifiers || [];
        const parry = calculateParry(fightingDie, parryMods);

        // Calculate Toughness
        const vigorDie = attrs.vigor || 'd4';
        const torsoArmor = this.getTorsoArmor(char);
        const toughnessMods = derivedStats.toughnessModifiers || [];
        const toughness = calculateToughness(vigorDie, torsoArmor, toughnessMods);

        // Movement with wound penalty
        const movementPenalty = calculateMovementPenalty(this.volatileState.wounds);
        const movements = derivedStats.movements || [{ type: 'Padrão', pace: 6, runningDie: 'd6' }];

        // Size
        const size = derivedStats.size || 0;

        return `
            <div class="derived-stats">
                <div class="derived-stat">
                    <div class="label">${t('derivedStats.size')}</div>
                    <div class="value">${size >= 0 ? '+' + size : size}</div>
                </div>
                
                <div class="derived-stat">
                    <div class="label">${t('derivedStats.pace')}</div>
                    <div class="value">
                        ${movements.map(m => {
            const pace = Math.max(0, m.pace - movementPenalty);
            return `${m.type !== 'Padrão' && m.type !== 'Standard' ? m.type + ': ' : ''}${pace}" / ${m.runningDie}`;
        }).join('<br>')}
                    </div>
                    ${movementPenalty > 0 ? `<div class="modifier">-${movementPenalty} (${t('subheader.wounds')})</div>` : ''}
                </div>
                
                <div class="derived-stat">
                    <div class="label">${t('derivedStats.parry')}</div>
                    <div class="value">${parry.total}</div>
                    ${parry.modifiers.length > 0 ? `
                        <div class="modifier" title="${parry.modifiers.map(m => m.source + ': +' + m.value).join(', ')}">*</div>
                    ` : ''}
                </div>
                
                <div class="derived-stat">
                    <div class="label">${t('derivedStats.toughness')}</div>
                    <div class="value">
                        ${toughness.total}
                        ${toughness.armor > 0 ? `<span class="text-sm">(${toughness.armor})</span>` : ''}
                    </div>
                    ${toughness.modifiers.length > 0 ? `
                        <div class="modifier" title="${toughness.modifiers.map(m => m.source + ': +' + m.value).join(', ')}">*</div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Get torso armor value
     */
    getTorsoArmor(char) {
        const armor = char.equipment?.armor || [];
        let total = 0;

        armor.forEach(a => {
            const status = this.volatileState.equipmentStatus?.[a.name] || a.status;
            if (status === 'equipped' && a.protectedAreas) {
                const areas = a.protectedAreas.toLowerCase();
                if (areas.includes('torso') || areas.includes('tronco')) {
                    total += a.armorValue || 0;
                }
            }
        });

        return total;
    },

    /**
     * Render attributes
     */
    renderAttributes(char, penalty) {
        const attrs = char.attributes || {};
        const attrList = [
            { key: 'agility', name: 'Agilidade' },
            { key: 'smarts', name: 'Astúcia' },
            { key: 'spirit', name: 'Espírito' },
            { key: 'strength', name: 'Força' },
            { key: 'vigor', name: 'Vigor' }
        ];

        return `
            <div class="attributes-section">
                <h2 class="section-title">${t('attributes.title')}</h2>
                <div class="trait-list">
                    ${attrList.map(attr => {
            const die = attrs[attr.key] || 'd4';
            return this.renderTraitItem(t('attributes.' + attr.key), die, penalty);
        }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render skills
     */
    renderSkills(char, penalty) {
        const skills = char.skills || [];

        return `
            <div class="skills-section">
                <h2 class="section-title">${t('skills.title')}</h2>
                <div class="trait-list">
                    ${skills.map(skill => this.renderTraitItem(skill.name, skill.die, penalty)).join('')}
                    ${this.renderTraitItem(t('skills.unskilled'), 'd4-2', penalty)}
                </div>
            </div>
        `;
    },

    /**
     * Render a single trait item (attribute or skill)
     */
    renderTraitItem(name, die, penalty) {
        const icon = getDieIcon(die);
        const penaltyText = penalty > 0 ? `<span class="trait-penalty">-${penalty}</span>` : '';

        return `
            <div class="trait-item">
                <img src="${icon}" alt="${die}" />
                <span class="trait-name">${name}</span>
                <span class="trait-die">${die}</span>
                ${penaltyText}
            </div>
        `;
    },

    /**
     * Render edges (advantages)
     */
    renderEdges(char) {
        const edges = char.edges || [];
        if (edges.length === 0) return '';

        return `
            <div class="collapsible-section">
                <h2 class="section-title">${t('sections.edges')}</h2>
                ${edges.map((edge, idx) => `
                    <div class="collapsible-item" data-collapse="edge-${idx}">
                        <div class="collapsible-header">
                            <div class="header-content">
                                <span class="item-name">${edge.name}</span>
                                <span class="item-subtitle">${t('edges.requirements')}: ${edge.requirements || '-'}</span>
                            </div>
                            <svg class="chevron w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        <div class="collapsible-content">
                            <div class="collapsible-body">${edge.description || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render hindrances (complications)
     */
    renderHindrances(char) {
        const hindrances = char.hindrances || [];
        if (hindrances.length === 0) return '';

        return `
            <div class="collapsible-section">
                <h2 class="section-title">${t('sections.hindrances')}</h2>
                ${hindrances.map((h, idx) => `
                    <div class="collapsible-item" data-collapse="hindrance-${idx}">
                        <div class="collapsible-header">
                            <div class="header-content">
                                <span class="item-name">${h.name}</span>
                                <span class="badge ${h.type === 'major' ? 'badge-major' : 'badge-minor'}">
                                    ${t('hindrances.' + h.type)}
                                </span>
                            </div>
                            <svg class="chevron w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        <div class="collapsible-content">
                            <div class="collapsible-body">${h.description || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render equipment
     */
    renderEquipment(char) {
        const equipment = char.equipment || {};
        const strengthDie = char.attributes?.strength || 'd4';
        const totalWeight = calculateTotalWeight(equipment);
        const maxWeight = calculateMaxWeight(strengthDie);
        const isOverweight = totalWeight > maxWeight;

        return `
            <div class="equipment-section">
                <h2 class="section-title">${t('sections.equipment')}</h2>
                
                ${this.renderWeapons(equipment.weapons, strengthDie)}
                ${this.renderArmor(equipment.armor, strengthDie)}
                ${this.renderShields(equipment.shields, strengthDie)}
                ${this.renderGear(equipment.gear)}
                
                <div class="weight-summary ${isOverweight ? 'overweight' : ''}">
                    ${t('equipment.totalWeight')}: ${totalWeight} kg / ${maxWeight} kg
                </div>
            </div>
        `;
    },

    /**
     * Render weapons
     */
    renderWeapons(weapons, strengthDie) {
        if (!weapons || weapons.length === 0) return '';

        return `
            <div class="equipment-category">
                <h4>${t('equipment.weapons')}</h4>
                ${weapons.map(w => {
            const status = this.volatileState.equipmentStatus?.[w.name] || w.status;
            const damage = parseDamage(w.damage, strengthDie);
            const meetsStr = meetsStrengthRequirement(strengthDie, w.minStrength);

            return `
                        <div class="equipment-item ${!meetsStr ? 'warning' : ''}">
                            <div class="item-header">
                                <span class="item-name">${w.name}</span>
                                <span class="badge item-status">${t('equipment.status.' + status)}</span>
                            </div>
                            <div class="item-stats">
                                <span><strong>${t('equipment.damage')}:</strong> 
                                    ${damage.hasStrength
                    ? `<span class="text-strength" title="${t('equipment.strengthAttribute')}">${damage.display}</span>`
                    : damage.display
                }
                                </span>
                                ${w.range ? `<span><strong>${t('equipment.range')}:</strong> ${w.range}</span>` : ''}
                                <span><strong>${t('equipment.ap')}:</strong> ${w.ap || 0}</span>
                                <span><strong>${t('equipment.minStrength')}:</strong> ${w.minStrength || '-'}</span>
                                <span><strong>${t('header.weight')}:</strong> ${w.weight || 0} kg</span>
                            </div>
                            ${!meetsStr ? `<div class="strength-warning">⚠ ${t('equipment.minStrength')}: ${w.minStrength}</div>` : ''}
                            ${w.description ? `<div class="item-description">${w.description}</div>` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    /**
     * Render armor
     */
    renderArmor(armor, strengthDie) {
        if (!armor || armor.length === 0) return '';

        return `
            <div class="equipment-category">
                <h4>${t('equipment.armor')}</h4>
                ${armor.map(a => {
            const status = this.volatileState.equipmentStatus?.[a.name] || a.status;
            const meetsStr = meetsStrengthRequirement(strengthDie, a.minStrength);

            return `
                        <div class="equipment-item ${!meetsStr ? 'warning' : ''}">
                            <div class="item-header">
                                <span class="item-name">${a.name}</span>
                                <span class="badge item-status">${t('equipment.status.' + status)}</span>
                            </div>
                            <div class="item-stats">
                                <span><strong>${t('equipment.armorValue')}:</strong> +${a.armorValue || 0}</span>
                                <span><strong>${t('equipment.protectedAreas')}:</strong> ${a.protectedAreas || '-'}</span>
                                <span><strong>${t('equipment.minStrength')}:</strong> ${a.minStrength || '-'}</span>
                                <span><strong>${t('header.weight')}:</strong> ${a.weight || 0} kg</span>
                            </div>
                            ${!meetsStr ? `<div class="strength-warning">⚠ ${t('equipment.minStrength')}: ${a.minStrength}</div>` : ''}
                            ${a.description ? `<div class="item-description">${a.description}</div>` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    /**
     * Render shields
     */
    renderShields(shields, strengthDie) {
        if (!shields || shields.length === 0) return '';

        return `
            <div class="equipment-category">
                <h4>${t('equipment.shields')}</h4>
                ${shields.map(s => {
            const status = this.volatileState.equipmentStatus?.[s.name] || s.status;
            const meetsStr = meetsStrengthRequirement(strengthDie, s.minStrength);

            return `
                        <div class="equipment-item ${!meetsStr ? 'warning' : ''}">
                            <div class="item-header">
                                <span class="item-name">${s.name}</span>
                                <span class="badge item-status">${t('equipment.status.' + status)}</span>
                            </div>
                            <div class="item-stats">
                                <span><strong>${t('equipment.parryBonus')}:</strong> +${s.parryBonus || 0}</span>
                                <span><strong>${t('equipment.coverage')}:</strong> ${s.coverage || 0}</span>
                                <span><strong>${t('equipment.minStrength')}:</strong> ${s.minStrength || '-'}</span>
                                <span><strong>${t('header.weight')}:</strong> ${s.weight || 0} kg</span>
                            </div>
                            ${!meetsStr ? `<div class="strength-warning">⚠ ${t('equipment.minStrength')}: ${s.minStrength}</div>` : ''}
                            ${s.description ? `<div class="item-description">${s.description}</div>` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    /**
     * Render gear (miscellaneous)
     */
    renderGear(gear) {
        if (!gear || gear.length === 0) return '';

        return `
            <div class="equipment-category">
                <h4>${t('equipment.gear')}</h4>
                ${gear.map(g => {
            const status = this.volatileState.equipmentStatus?.[g.name] || g.status;

            return `
                        <div class="equipment-item">
                            <div class="item-header">
                                <span class="item-name">${g.name}</span>
                                <span class="badge item-status">${t('equipment.status.' + status)}</span>
                            </div>
                            <div class="item-stats">
                                <span><strong>${t('header.weight')}:</strong> ${g.weight || 0} kg</span>
                            </div>
                            ${g.description ? `<div class="item-description">${g.description}</div>` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    /**
     * Render powers
     */
    renderPowers(char) {
        const powers = char.powers || [];
        if (powers.length === 0) return '';

        return `
            <div class="collapsible-section">
                <h2 class="section-title">${t('sections.powers')}</h2>
                ${powers.map((p, idx) => `
                    <div class="collapsible-item" data-collapse="power-${idx}">
                        <div class="collapsible-header">
                            <div class="header-content">
                                <span class="item-name">${p.name}</span>
                                ${p.manifestation ? `<span class="item-subtitle">${p.manifestation.substring(0, 50)}${p.manifestation.length > 50 ? '...' : ''}</span>` : ''}
                            </div>
                            <svg class="chevron w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        <div class="collapsible-content">
                            <div class="collapsible-body">
                                ${p.manifestation ? `<p><strong>${t('powers.manifestation')}:</strong> ${p.manifestation}</p>` : ''}
                                ${p.rank && p.rank !== 'Não se aplica' ? `<p><strong>${t('powers.rank')}:</strong> ${p.rank}</p>` : ''}
                                ${p.powerPoints && p.powerPoints !== 'Não se aplica' ? `<p><strong>${t('powers.powerPoints')}:</strong> ${p.powerPoints}</p>` : ''}
                                ${p.range && p.range !== 'Não se aplica' ? `<p><strong>${t('powers.range')}:</strong> ${p.range}</p>` : ''}
                                ${p.duration && p.duration !== 'Não se aplica' ? `<p><strong>${t('powers.duration')}:</strong> ${p.duration}</p>` : ''}
                                ${p.damage && p.damage !== 'Não se aplica' ? `<p><strong>${t('powers.damage')}:</strong> ${p.damage}</p>` : ''}
                                ${p.ap && p.ap !== 'Não se aplica' ? `<p><strong>${t('powers.ap')}:</strong> ${p.ap}</p>` : ''}
                                ${p.activationSkill && p.activationSkill !== 'Não se aplica' ? `<p><strong>${t('powers.activationSkill')}:</strong> ${p.activationSkill}</p>` : ''}
                                ${p.description ? `<div class="mt-2">${p.description}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render biography
     */
    renderBiography(char) {
        if (!char.biography) return '';

        return `
            <div class="biography-section">
                <h2 class="section-title">${t('sections.biography')}</h2>
                <div class="biography-content">${char.biography}</div>
            </div>
        `;
    },

    /**
     * Setup event listeners for interactive elements
     */
    setupEventListeners() {
        const container = document.getElementById('character-sheet-content');
        if (!container) return;

        // Fatigue clicks
        container.querySelectorAll('.fatigue-level').forEach(el => {
            el.addEventListener('click', () => {
                const level = parseInt(el.dataset.level);
                this.toggleFatigue(level);
            });
        });

        // Wound circles
        container.querySelectorAll('.wound-circle').forEach(el => {
            el.addEventListener('click', () => {
                const wound = parseInt(el.dataset.wound);
                this.toggleWound(wound);
            });
        });

        // Benny buttons
        container.querySelectorAll('[data-benny-action]').forEach(el => {
            el.addEventListener('click', () => {
                const action = el.dataset.bennyAction;
                this.adjustBennies(action === 'increase' ? 1 : -1);
            });
        });

        // Status clicks
        container.querySelectorAll('.status-item').forEach(el => {
            el.addEventListener('click', () => {
                const statusId = el.dataset.status;
                this.toggleStatus(statusId);
            });
        });

        // Collapsible items
        container.querySelectorAll('.collapsible-header').forEach(el => {
            el.addEventListener('click', () => {
                const item = el.closest('.collapsible-item');
                item.classList.toggle('open');
            });
        });

        // Modifier clicks
        container.querySelectorAll('.modifier').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = el.getAttribute('title');
                if (text) {
                    const modal = document.getElementById('modifier_modal');
                    const content = document.getElementById('modifier_modal_content');
                    if (modal && content) {
                        content.innerHTML = text.split(', ').map(mod => `<div class="mb-2 pl-4 border-l-2 border-primary">• ${mod}</div>`).join('');
                        modal.showModal();
                    }
                }
            });
        });
    },

    /**
     * Toggle fatigue level
     */
    toggleFatigue(level) {
        // If clicking the current level, decrease; otherwise set to that level
        if (this.volatileState.fatigueLevel === level) {
            this.volatileState.fatigueLevel = level - 1;
        } else {
            this.volatileState.fatigueLevel = level;
        }

        // Check for incapacitated via fatigue
        if (this.volatileState.fatigueLevel >= 3) {
            this.volatileState.status.incapacitated = true;
        }

        this.saveState();
        this.render();
    },

    /**
     * Toggle wound
     */
    toggleWound(woundIndex) {
        if (this.volatileState.wounds > woundIndex) {
            this.volatileState.wounds = woundIndex;
        } else {
            this.volatileState.wounds = woundIndex + 1;
        }

        this.saveState();
        this.render();
    },

    /**
     * Adjust bennies count
     */
    adjustBennies(delta) {
        const newValue = this.volatileState.bennies + delta;
        if (newValue >= 0 && newValue <= 99) {
            this.volatileState.bennies = newValue;
            this.saveState();
            this.render();
        }
    },

    /**
     * Toggle status with dependencies
     */
    toggleStatus(statusId) {
        const status = this.volatileState.status;
        const newValue = !status[statusId];

        if (newValue) {
            // Activating status
            status[statusId] = true;

            // Dependencies when activating
            if (statusId === 'entangled') {
                status.vulnerable = true;
            }
            if (statusId === 'bound') {
                status.entangled = true;
                status.vulnerable = true;
                status.distracted = true;
            }
        } else {
            // Deactivating status
            status[statusId] = false;

            // Dependencies when deactivating
            if (statusId === 'entangled') {
                status.vulnerable = false;
            }
            if (statusId === 'bound') {
                status.distracted = false;
            }
        }

        this.saveState();
        this.render();
    }
};
