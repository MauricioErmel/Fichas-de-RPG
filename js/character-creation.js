/**
 * Character Creation/Editing form logic - Part 1: Core rendering
 */

const CharacterCreation = {
    quillEditors: {},
    editMode: false,
    currentCharacter: null,
    selectedSkills: [],

    initNew() {
        this.editMode = false;
        this.currentCharacter = null;
        this.selectedSkills = [];
        this.render();
    },

    initEdit(character) {
        this.editMode = true;
        this.currentCharacter = JSON.parse(JSON.stringify(character));
        this.selectedSkills = (character.skills || []).map(s => s.name);
        this.render();
    },

    getEmptyCharacter() {
        return {
            system: 'Savage Worlds: Edição Aventura',
            portrait: '',
            header: { name: '', race: '', age: '', height: '', weight: '', advances: 0 },
            volatile: { extraWounds: 0, extraBennies: 0 },
            attributes: { agility: 'd4', smarts: 'd4', spirit: 'd4', strength: 'd4', vigor: 'd4' },
            skills: [],
            derivedStats: {
                size: 0,
                movements: [{ type: 'Padrão', pace: 6, runningDie: 'd6' }],
                parryModifiers: [],
                toughnessModifiers: []
            },
            edges: [],
            hindrances: [],
            equipment: { weapons: [], armor: [], shields: [], gear: [] },
            powers: [],
            biography: ''
        };
    },

    render() {
        const container = document.getElementById('character-creation-form');
        if (!container) return;

        const char = this.currentCharacter || this.getEmptyCharacter();

        container.innerHTML = `
            <form id="creation-form" class="creation-form">
                ${this.renderSystemSelect(char)}
                ${this.renderBasicInfo(char)}
                ${this.renderAttributes(char)}
                ${this.renderDerivedStats(char)}
                ${this.renderSkills(char)}
                ${this.renderEdges(char)}
                ${this.renderHindrances(char)}
                ${this.renderEquipment(char)}
                ${this.renderPowers(char)}
                ${this.renderBiography(char)}
                ${this.renderActions()}
            </form>
        `;

        this.initQuillEditors();
        this.setupEventListeners();
        this.populateForm(char);
    },

    renderSystemSelect(char) {
        return `<div class="form-section"><h2>${t('creation.system')}</h2>
            <select id="system-select" class="select select-bordered w-full">
                <option value="Savage Worlds: Edição Aventura" ${char.system === 'Savage Worlds: Edição Aventura' ? 'selected' : ''}>Savage Worlds: Edição Aventura</option>
            </select></div>`;
    },

    renderBasicInfo(char) {
        const h = char.header || {};
        return `<div class="form-section"><h2>${t('creation.basicInfo')}</h2>
            <div class="form-grid">
                <div class="form-control"><label class="label"><span class="label-text">${t('header.name')} *</span></label>
                    <input type="text" id="char-name" class="input input-bordered" value="${h.name || ''}" required /></div>
                <div class="form-control"><label class="label"><span class="label-text">${t('header.race')}</span></label>
                    <input type="text" id="char-race" class="input input-bordered" value="${h.race || ''}" /></div>
                <div class="form-control"><label class="label"><span class="label-text">${t('header.age')}</span></label>
                    <input type="text" id="char-age" class="input input-bordered" value="${h.age || ''}" /></div>
                <div class="form-control"><label class="label"><span class="label-text">${t('header.height')}</span></label>
                    <input type="text" id="char-height" class="input input-bordered" value="${h.height || ''}" /></div>
                <div class="form-control"><label class="label"><span class="label-text">${t('header.weight')}</span></label>
                    <input type="text" id="char-weight" class="input input-bordered" value="${h.weight || ''}" /></div>
                <div class="form-control"><label class="label"><span class="label-text">${t('header.advances')}</span></label>
                    <input type="number" id="char-advances" class="input input-bordered" min="0" value="${h.advances || 0}" /></div>
            </div>
            <div class="form-control mt-4"><label class="label"><span class="label-text">${t('creation.portrait')}</span></label>
                <input type="url" id="char-portrait" class="input input-bordered" placeholder="${t('creation.portraitPlaceholder')}" value="${char.portrait || ''}" /></div>
            <div class="form-grid mt-4">
                <div class="form-control"><label class="label"><span class="label-text">${t('subheader.wounds')} extras</span></label>
                    <input type="number" id="char-extra-wounds" class="input input-bordered" min="0" value="${char.volatile?.extraWounds || 0}" /></div>
                <div class="form-control"><label class="label"><span class="label-text">${t('subheader.bennies')} extras</span></label>
                    <input type="number" id="char-extra-bennies" class="input input-bordered" min="0" value="${char.volatile?.extraBennies || 0}" /></div>
            </div></div>`;
    },

    renderAttributes(char) {
        const attrs = char.attributes || {};
        return `<div class="form-section"><h2>${t('attributes.title')}</h2><div class="form-grid">
            ${['agility', 'smarts', 'spirit', 'strength', 'vigor'].map(attr => `
                <div class="form-control"><label class="label"><span class="label-text">${t('attributes.' + attr)}</span></label>
                    <select id="attr-${attr}" class="select select-bordered">
                        ${DIE_ORDER.map(d => `<option value="${d}" ${attrs[attr] === d ? 'selected' : ''}>${d}</option>`).join('')}
                    </select></div>`).join('')}
        </div></div>`;
    },

    renderDerivedStats(char) {
        const ds = char.derivedStats || {};
        const movements = ds.movements || [{ type: 'Padrão', pace: 6, runningDie: 'd6' }];
        return `<div class="form-section"><h2>${t('derivedStats.size')}, ${t('derivedStats.pace')}</h2>
            <div class="form-control mb-4"><label class="label"><span class="label-text">${t('derivedStats.size')} (-4 a 10)</span></label>
                <input type="number" id="derived-size" class="input input-bordered w-24" min="-4" max="10" value="${ds.size || 0}" /></div>
            <div class="mb-4"><label class="label"><span class="label-text font-bold">${t('derivedStats.pace')}</span></label>
                <div id="movements-list" class="dynamic-list">${movements.map((m, i) => this.renderMovementItem(m, i)).join('')}</div>
                <button type="button" id="add-movement" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addMovement')}</button></div>
            <div class="mb-4"><label class="label"><span class="label-text font-bold">${t('derivedStats.parry')} - Mod</span></label>
                <div id="parry-mods-list" class="dynamic-list">${(ds.parryModifiers || []).map((m, i) => this.renderModifierItem('parry', m, i)).join('')}</div>
                <button type="button" id="add-parry-mod" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addModifier')}</button></div>
            <div class="mb-4"><label class="label"><span class="label-text font-bold">${t('derivedStats.toughness')} - Mod</span></label>
                <div id="toughness-mods-list" class="dynamic-list">${(ds.toughnessModifiers || []).map((m, i) => this.renderModifierItem('toughness', m, i)).join('')}</div>
                <button type="button" id="add-toughness-mod" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addModifier')}</button></div>
        </div>`;
    },

    renderMovementItem(m, i) {
        return `<div class="dynamic-item" data-movement-index="${i}"><div class="item-fields"><div class="flex gap-2">
            <input type="text" class="input input-bordered input-sm flex-1" placeholder="${t('creation.movementType')}" data-movement-type="${i}" value="${m.type || ''}" />
            <input type="number" class="input input-bordered input-sm w-20" placeholder="Pace" data-movement-pace="${i}" min="0" value="${m.pace || 6}" />
            <select class="select select-bordered select-sm" data-movement-die="${i}">${DIE_ORDER.slice(0, 5).map(d => `<option value="${d}" ${m.runningDie === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
        </div></div>${i > 0 ? `<button type="button" class="btn btn-sm btn-ghost btn-remove" data-remove-movement="${i}">✕</button>` : ''}</div>`;
    },

    renderModifierItem(type, m, i) {
        return `<div class="dynamic-item" data-${type}-mod-index="${i}"><div class="item-fields flex gap-2">
            <input type="number" class="input input-bordered input-sm w-20" placeholder="Val" data-${type}-mod-value="${i}" value="${m.value || 0}" />
            <input type="text" class="input input-bordered input-sm flex-1" placeholder="Fonte" data-${type}-mod-source="${i}" value="${m.source || ''}" />
        </div><button type="button" class="btn btn-sm btn-ghost btn-remove" data-remove-${type}-mod="${i}">✕</button></div>`;
    },

    renderSkills(char) {
        const skills = char.skills || [];
        const available = SKILLS_LIST.filter(s => !this.selectedSkills.includes(s));
        return `<div class="form-section"><h2>${t('skills.title')}</h2>
            <div id="skills-list" class="dynamic-list">${skills.map((s, i) => this.renderSkillItem(s, i)).join('')}</div>
            <div class="flex gap-2 mt-2">
                <select id="skill-select" class="select select-bordered select-sm flex-1">
                    <option value="">${t('creation.selectSkill')}</option>
                    ${available.map(s => `<option value="${s}">${s}</option>`).join('')}
                    <option value="custom">${t('skills.custom')}</option>
                </select>
                <button type="button" id="add-skill" class="btn btn-sm btn-outline">+ ${t('creation.addSkill')}</button>
            </div></div>`;
    },

    renderSkillItem(skill, i) {
        return `<div class="dynamic-item" data-skill-index="${i}"><div class="item-fields flex gap-2">
            <span class="flex-1 self-center">${skill.name}</span>
            <select class="select select-bordered select-sm" data-skill-die="${i}">${DIE_ORDER.map(d => `<option value="${d}" ${skill.die === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
        </div><button type="button" class="btn btn-sm btn-ghost btn-remove" data-remove-skill="${i}">✕</button></div>`;
    },

    renderEdges(char) {
        return `<div class="form-section"><h2>${t('sections.edges')}</h2>
            <div id="edges-list" class="dynamic-list">${(char.edges || []).map((e, i) => this.renderEdgeItem(e, i)).join('')}</div>
            <button type="button" id="add-edge" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addEdge')}</button></div>`;
    },

    renderEdgeItem(edge, i) {
        return `<div class="dynamic-item flex-col" data-edge-index="${i}"><div class="flex gap-2 w-full">
            <input type="text" class="input input-bordered input-sm flex-1" placeholder="${t('header.name')}" data-edge-name="${i}" value="${edge.name || ''}" />
            <input type="text" class="input input-bordered input-sm flex-1" placeholder="${t('edges.requirements')}" data-edge-requirements="${i}" value="${edge.requirements || ''}" />
            <button type="button" class="btn btn-sm btn-ghost" data-remove-edge="${i}">✕</button>
        </div><div class="quill-container w-full mt-2" data-edge-description="${i}"></div></div>`;
    },

    renderHindrances(char) {
        return `<div class="form-section"><h2>${t('sections.hindrances')}</h2>
            <div id="hindrances-list" class="dynamic-list">${(char.hindrances || []).map((h, i) => this.renderHindranceItem(h, i)).join('')}</div>
            <button type="button" id="add-hindrance" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addHindrance')}</button></div>`;
    },

    renderHindranceItem(h, i) {
        return `<div class="dynamic-item flex-col" data-hindrance-index="${i}"><div class="flex gap-2 w-full">
            <input type="text" class="input input-bordered input-sm flex-1" placeholder="${t('header.name')}" data-hindrance-name="${i}" value="${h.name || ''}" />
            <select class="select select-bordered select-sm" data-hindrance-type="${i}">
                <option value="minor" ${h.type === 'minor' ? 'selected' : ''}>${t('hindrances.minor')}</option>
                <option value="major" ${h.type === 'major' ? 'selected' : ''}>${t('hindrances.major')}</option>
            </select>
            <button type="button" class="btn btn-sm btn-ghost" data-remove-hindrance="${i}">✕</button>
        </div><div class="quill-container w-full mt-2" data-hindrance-description="${i}"></div></div>`;
    },

    renderEquipment(char) {
        const eq = char.equipment || {};
        return `<div class="form-section"><h2>${t('sections.equipment')}</h2>
            <h3 class="font-bold mt-4 mb-2">${t('equipment.weapons')}</h3>
            <div id="weapons-list" class="dynamic-list">${(eq.weapons || []).map((w, i) => this.renderEquipItem('weapon', w, i)).join('')}</div>
            <button type="button" id="add-weapon" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addWeapon')}</button>
            <h3 class="font-bold mt-4 mb-2">${t('equipment.armor')}</h3>
            <div id="armor-list" class="dynamic-list">${(eq.armor || []).map((a, i) => this.renderEquipItem('armor', a, i)).join('')}</div>
            <button type="button" id="add-armor" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addArmor')}</button>
            <h3 class="font-bold mt-4 mb-2">${t('equipment.shields')}</h3>
            <div id="shields-list" class="dynamic-list">${(eq.shields || []).map((s, i) => this.renderEquipItem('shield', s, i)).join('')}</div>
            <button type="button" id="add-shield" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addShield')}</button>
            <h3 class="font-bold mt-4 mb-2">${t('equipment.gear')}</h3>
            <div id="gear-list" class="dynamic-list">${(eq.gear || []).map((g, i) => this.renderEquipItem('gear', g, i)).join('')}</div>
            <button type="button" id="add-gear" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addGear')}</button>
        </div>`;
    },

    renderEquipItem(type, item, i) {
        const statusOpts = `<option value="equipped" ${item.status === 'equipped' ? 'selected' : ''}>${t('equipment.status.equipped')}</option>
            <option value="carried" ${item.status === 'carried' ? 'selected' : ''}>${t('equipment.status.carried')}</option>
            <option value="stored" ${item.status === 'stored' ? 'selected' : ''}>${t('equipment.status.stored')}</option>`;
        let fields = `<input type="text" class="input input-bordered input-sm" placeholder="${t('header.name')}" data-${type}-name="${i}" value="${item.name || ''}" />`;
        if (type === 'weapon') {
            fields += `<input type="text" class="input input-bordered input-sm" placeholder="Dano" data-weapon-damage="${i}" value="${item.damage || ''}" />
                <input type="text" class="input input-bordered input-sm" placeholder="Dist" data-weapon-range="${i}" value="${item.range || ''}" />
                <input type="number" class="input input-bordered input-sm" placeholder="PA" data-weapon-ap="${i}" min="0" value="${item.ap || 0}" />
                <input type="text" class="input input-bordered input-sm" placeholder="For Min" data-weapon-minstr="${i}" value="${item.minStrength || ''}" />`;
        } else if (type === 'armor') {
            fields += `<input type="number" class="input input-bordered input-sm" placeholder="Arm" data-armor-value="${i}" min="0" value="${item.armorValue || 0}" />
                <input type="text" class="input input-bordered input-sm" placeholder="Áreas" data-armor-areas="${i}" value="${item.protectedAreas || ''}" />
                <input type="text" class="input input-bordered input-sm" placeholder="For Min" data-armor-minstr="${i}" value="${item.minStrength || ''}" />`;
        } else if (type === 'shield') {
            fields += `<input type="number" class="input input-bordered input-sm" placeholder="Aparar" data-shield-parry="${i}" min="0" value="${item.parryBonus || 0}" />
                <select class="select select-bordered select-sm" data-shield-coverage="${i}"><option value="0" ${item.coverage === 0 ? 'selected' : ''}>0</option><option value="-2" ${item.coverage === -2 ? 'selected' : ''}>-2</option><option value="-4" ${item.coverage === -4 ? 'selected' : ''}>-4</option></select>
                <input type="text" class="input input-bordered input-sm" placeholder="For Min" data-shield-minstr="${i}" value="${item.minStrength || ''}" />`;
        }
        fields += `<input type="number" class="input input-bordered input-sm" placeholder="Peso" data-${type}-weight="${i}" step="0.1" min="0" value="${item.weight || 0}" />
            <select class="select select-bordered select-sm" data-${type}-status="${i}">${statusOpts}</select>
            <button type="button" class="btn btn-sm btn-ghost" data-remove-${type}="${i}">✕</button>`;
        return `<div class="dynamic-item flex-col" data-${type}-index="${i}"><div class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">${fields}</div>
            <div class="quill-container w-full mt-2" data-${type}-description="${i}"></div></div>`;
    },

    renderPowers(char) {
        return `<div class="form-section"><h2>${t('sections.powers')}</h2>
            <div id="powers-list" class="dynamic-list">${(char.powers || []).map((p, i) => this.renderPowerItem(p, i)).join('')}</div>
            <button type="button" id="add-power" class="btn btn-sm btn-outline mt-2">+ ${t('creation.addPower')}</button></div>`;
    },

    renderPowerItem(p, i) {
        return `<div class="dynamic-item flex-col" data-power-index="${i}"><div class="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
            <input type="text" class="input input-bordered input-sm" placeholder="${t('header.name')}" data-power-name="${i}" value="${p.name || ''}" />
            <select class="select select-bordered select-sm" data-power-rank="${i}">
                <option value="">N/A</option><option value="Novato" ${p.rank === 'Novato' ? 'selected' : ''}>Novato</option>
                <option value="Experiente" ${p.rank === 'Experiente' ? 'selected' : ''}>Experiente</option>
                <option value="Veterano" ${p.rank === 'Veterano' ? 'selected' : ''}>Veterano</option>
                <option value="Lendário" ${p.rank === 'Lendário' ? 'selected' : ''}>Lendário</option>
            </select>
            <input type="text" class="input input-bordered input-sm" placeholder="PP" data-power-pp="${i}" value="${p.powerPoints || ''}" />
            <input type="text" class="input input-bordered input-sm" placeholder="Dist" data-power-range="${i}" value="${p.range || ''}" />
            <input type="text" class="input input-bordered input-sm" placeholder="Dur" data-power-duration="${i}" value="${p.duration || ''}" />
            <input type="text" class="input input-bordered input-sm" placeholder="Dano" data-power-damage="${i}" value="${p.damage || ''}" />
            <input type="text" class="input input-bordered input-sm" placeholder="PA" data-power-ap="${i}" value="${p.ap || ''}" />
            <input type="text" class="input input-bordered input-sm" placeholder="Perícia" data-power-skill="${i}" value="${p.activationSkill || ''}" />
            <button type="button" class="btn btn-sm btn-ghost" data-remove-power="${i}">✕</button>
        </div>
        <div class="w-full mt-2"><label class="label text-sm">Manifestação</label><div class="quill-container" data-power-manifestation="${i}"></div></div>
        <div class="w-full mt-2"><label class="label text-sm">Descrição</label><div class="quill-container" data-power-description="${i}"></div></div></div>`;
    },

    renderBiography(char) {
        return `<div class="form-section"><h2>${t('sections.biography')}</h2><div class="quill-container" id="biography-editor"></div></div>`;
    },

    renderActions() {
        return `<div class="flex justify-center gap-4 mt-6">
            <button type="button" id="btn-cancel-creation" class="btn btn-ghost">${t('cancel')}</button>
            <button type="submit" class="btn btn-primary">${t('download')}</button></div>`;
    }
};
