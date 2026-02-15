/**
 * Character Creation - Part 2: Event handlers and data collection
 */

// Extend CharacterCreation with event handling methods
Object.assign(CharacterCreation, {

    initQuillEditors() {
        this.quillEditors = {};
        const cfg = { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'underline'], ['clean']] } };

        const bio = document.getElementById('biography-editor');
        if (bio) this.quillEditors['biography'] = new Quill(bio, cfg);

        document.querySelectorAll('.quill-container[data-edge-description]').forEach((c, i) => {
            this.quillEditors[`edge-desc-${i}`] = new Quill(c, cfg);
        });
        document.querySelectorAll('.quill-container[data-hindrance-description]').forEach((c, i) => {
            this.quillEditors[`hindrance-desc-${i}`] = new Quill(c, cfg);
        });
        document.querySelectorAll('.quill-container[data-power-manifestation]').forEach((c, i) => {
            this.quillEditors[`power-manifest-${i}`] = new Quill(c, cfg);
        });
        document.querySelectorAll('.quill-container[data-power-description]').forEach((c, i) => {
            this.quillEditors[`power-desc-${i}`] = new Quill(c, cfg);
        });

        document.querySelectorAll('.quill-container[data-power-modifiers]').forEach((c, i) => {
            this.quillEditors[`power-mod-${i}`] = new Quill(c, cfg);
        });
        ['weapon', 'armor', 'shield', 'gear'].forEach(type => {
            document.querySelectorAll(`.quill-container[data-${type}-description]`).forEach((c, i) => {
                this.quillEditors[`${type}-desc-${i}`] = new Quill(c, cfg);
            });
        });
    },

    populateForm(char) {
        if (char.biography && this.quillEditors['biography']) {
            this.quillEditors['biography'].root.innerHTML = char.biography;
        }
        (char.edges || []).forEach((e, i) => {
            if (e.description && this.quillEditors[`edge-desc-${i}`]) {
                this.quillEditors[`edge-desc-${i}`].root.innerHTML = e.description;
            }

        });
        (char.hindrances || []).forEach((h, i) => {
            if (h.description && this.quillEditors[`hindrance-desc-${i}`]) {
                this.quillEditors[`hindrance-desc-${i}`].root.innerHTML = h.description;
            }

        });
        (char.powers || []).forEach((p, i) => {
            if (p.manifestation && this.quillEditors[`power-manifest-${i}`]) {
                this.quillEditors[`power-manifest-${i}`].root.innerHTML = p.manifestation;
            }
            if (p.description && this.quillEditors[`power-desc-${i}`]) {
                this.quillEditors[`power-desc-${i}`].root.innerHTML = p.description;
            }
            if (p.modifiers && this.quillEditors[`power-mod-${i}`]) {
                this.quillEditors[`power-mod-${i}`].root.innerHTML = p.modifiers;
            }
        });
        ['weapons', 'armor', 'shields', 'gear'].forEach(type => {
            const items = char.equipment?.[type] || [];
            const singular = type === 'gear' ? 'gear' : type.slice(0, -1);
            items.forEach((item, i) => {
                if (item.description && this.quillEditors[`${singular}-desc-${i}`]) {
                    this.quillEditors[`${singular}-desc-${i}`].root.innerHTML = item.description;
                }
            });
        });
    },

    setupEventListeners() {
        const form = document.getElementById('creation-form');
        if (!form) return;

        form.addEventListener('submit', (e) => { e.preventDefault(); this.saveCharacter(); });
        document.getElementById('btn-cancel-creation')?.addEventListener('click', () => App.navigateTo('index'));
        document.getElementById('add-skill')?.addEventListener('click', () => this.addSkill());
        document.getElementById('add-edge')?.addEventListener('click', () => this.addDynamicItem('edge'));
        document.getElementById('add-hindrance')?.addEventListener('click', () => this.addDynamicItem('hindrance'));
        document.getElementById('add-power')?.addEventListener('click', () => this.addDynamicItem('power'));
        document.getElementById('add-weapon')?.addEventListener('click', () => this.addDynamicItem('weapon'));
        document.getElementById('add-armor')?.addEventListener('click', () => this.addDynamicItem('armor'));
        document.getElementById('add-shield')?.addEventListener('click', () => this.addDynamicItem('shield'));
        document.getElementById('add-gear')?.addEventListener('click', () => this.addDynamicItem('gear'));
        document.getElementById('add-movement')?.addEventListener('click', () => this.addMovement());
        document.getElementById('add-parry-mod')?.addEventListener('click', () => this.addModifier('parry'));
        document.getElementById('add-toughness-mod')?.addEventListener('click', () => this.addModifier('toughness'));

        form.addEventListener('click', (e) => {
            const handlers = [
                ['data-remove-skill', 'removeSkill'],
                ['data-remove-edge', 'edge'], ['data-remove-hindrance', 'hindrance'],
                ['data-remove-power', 'power'], ['data-remove-weapon', 'weapon'],
                ['data-remove-armor', 'armor'], ['data-remove-shield', 'shield'],
                ['data-remove-gear', 'gear']
            ];
            for (const [attr, type] of handlers) {
                const el = e.target.closest(`[${attr}]`);
                if (el) {
                    const idx = parseInt(el.getAttribute(attr));
                    if (attr === 'data-remove-skill') this.removeSkill(idx);
                    else this.removeDynamicItem(type, idx);
                    return;
                }
            }
            const rmMov = e.target.closest('[data-remove-movement]');
            if (rmMov) { this.removeMovement(parseInt(rmMov.dataset.removeMovement)); return; }
            const rmPar = e.target.closest('[data-remove-parry-mod]');
            if (rmPar) { this.removeModifier('parry', parseInt(rmPar.dataset.removeParryMod)); return; }
            const rmTou = e.target.closest('[data-remove-toughness-mod]');
            if (rmTou) { this.removeModifier('toughness', parseInt(rmTou.dataset.removeToughnessMod)); return; }
        });
    },

    addSkill() {
        const select = document.getElementById('skill-select');
        const value = select.value;
        if (!value) return;
        if (value === 'custom') {
            const name = prompt(t('creation.customSkillName'));
            if (name) { this.selectedSkills.push(name); this.render(); }
        } else if (!this.selectedSkills.includes(value)) {
            this.selectedSkills.push(value); this.render();
        } else { alert(t('validation.duplicateSkill')); }
    },

    removeSkill(i) { this.selectedSkills.splice(i, 1); this.render(); },

    addDynamicItem(type) {
        const char = this.collectFormData();
        const templates = {
            edge: { name: '', requirements: '', description: '' },
            hindrance: { name: '', type: 'minor', description: '' },
            power: { name: '', manifestation: '', description: '', modifiers: '', rank: '', powerPoints: '', range: '', duration: '', damage: '', ap: '', activationSkill: '' },
            weapon: { name: '', damage: '', range: '', ap: 0, minStrength: '', weight: 0, status: 'equipped', description: '' },
            armor: { name: '', armorValue: 0, protectedAreas: '', minStrength: '', weight: 0, status: 'equipped', description: '' },
            shield: { name: '', parryBonus: 0, coverage: 0, minStrength: '', weight: 0, status: 'equipped', description: '' },
            gear: { name: '', weight: 0, status: 'carried', description: '' }
        };
        const targets = {
            edge: char.edges, hindrance: char.hindrances, power: char.powers,
            weapon: char.equipment.weapons, armor: char.equipment.armor, shield: char.equipment.shields, gear: char.equipment.gear
        };
        targets[type].push(templates[type]);
        this.currentCharacter = char; this.render();
    },

    removeDynamicItem(type, i) {
        const char = this.collectFormData();
        const targets = {
            edge: char.edges, hindrance: char.hindrances, power: char.powers,
            weapon: char.equipment.weapons, armor: char.equipment.armor, shield: char.equipment.shields, gear: char.equipment.gear
        };
        targets[type].splice(i, 1);
        this.currentCharacter = char; this.render();
    },

    addMovement() {
        const char = this.collectFormData();
        char.derivedStats.movements.push({ type: '', pace: 6, runningDie: 'd6' });
        this.currentCharacter = char; this.render();
    },

    removeMovement(i) {
        const char = this.collectFormData();
        char.derivedStats.movements.splice(i, 1);
        this.currentCharacter = char; this.render();
    },

    addModifier(type) {
        const char = this.collectFormData();
        (type === 'parry' ? char.derivedStats.parryModifiers : char.derivedStats.toughnessModifiers).push({ value: 0, source: '' });
        this.currentCharacter = char; this.render();
    },

    removeModifier(type, i) {
        const char = this.collectFormData();
        (type === 'parry' ? char.derivedStats.parryModifiers : char.derivedStats.toughnessModifiers).splice(i, 1);
        this.currentCharacter = char; this.render();
    },

    collectFormData() {
        const char = this.getEmptyCharacter();
        char.system = document.getElementById('system-select')?.value || 'Savage Worlds: Edição Aventura';
        char.portrait = document.getElementById('char-portrait')?.value || '';
        char.header = {
            name: document.getElementById('char-name')?.value || '',
            race: document.getElementById('char-race')?.value || '',
            age: document.getElementById('char-age')?.value || '',
            height: document.getElementById('char-height')?.value || '',
            weight: document.getElementById('char-weight')?.value || '',
            advances: parseInt(document.getElementById('char-advances')?.value) || 0
        };
        char.volatile = {
            extraWounds: parseInt(document.getElementById('char-extra-wounds')?.value) || 0,
            extraBennies: parseInt(document.getElementById('char-extra-bennies')?.value) || 0
        };
        ['agility', 'smarts', 'spirit', 'strength', 'vigor'].forEach(a => {
            char.attributes[a] = document.getElementById(`attr-${a}`)?.value || 'd4';
        });
        char.derivedStats.size = parseInt(document.getElementById('derived-size')?.value) || 0;

        document.querySelectorAll('[data-movement-type]').forEach((inp, i) => {
            char.derivedStats.movements.push({
                type: inp.value || 'Padrão',
                pace: parseInt(document.querySelector(`[data-movement-pace="${i}"]`)?.value) || 6,
                runningDie: document.querySelector(`[data-movement-die="${i}"]`)?.value || 'd6'
            });
        });
        char.derivedStats.movements = char.derivedStats.movements.slice(1);

        document.querySelectorAll('[data-parry-mod-value]').forEach((inp, i) => {
            char.derivedStats.parryModifiers.push({
                value: parseInt(inp.value) || 0,
                source: document.querySelector(`[data-parry-mod-source="${i}"]`)?.value || ''
            });
        });
        document.querySelectorAll('[data-toughness-mod-value]').forEach((inp, i) => {
            char.derivedStats.toughnessModifiers.push({
                value: parseInt(inp.value) || 0,
                source: document.querySelector(`[data-toughness-mod-source="${i}"]`)?.value || ''
            });
        });

        char.skills = this.selectedSkills.map((name, i) => ({
            name, die: document.querySelector(`[data-skill-die="${i}"]`)?.value || 'd4'
        }));

        document.querySelectorAll('[data-edge-name]').forEach((inp, i) => {
            char.edges.push({
                name: inp.value || '',
                requirements: document.querySelector(`[data-edge-requirements="${i}"]`)?.value || '',
                description: this.quillEditors[`edge-desc-${i}`]?.root.innerHTML || ''
            });
        });

        document.querySelectorAll('[data-hindrance-name]').forEach((inp, i) => {
            char.hindrances.push({
                name: inp.value || '',
                type: document.querySelector(`[data-hindrance-type="${i}"]`)?.value || 'minor',
                description: this.quillEditors[`hindrance-desc-${i}`]?.root.innerHTML || ''
            });
        });

        document.querySelectorAll('[data-weapon-name]').forEach((inp, i) => {
            char.equipment.weapons.push({
                name: inp.value || '', damage: document.querySelector(`[data-weapon-damage="${i}"]`)?.value || '',
                range: document.querySelector(`[data-weapon-range="${i}"]`)?.value || '',
                ap: parseInt(document.querySelector(`[data-weapon-ap="${i}"]`)?.value) || 0,
                minStrength: document.querySelector(`[data-weapon-minstr="${i}"]`)?.value || '',
                weight: parseFloat(document.querySelector(`[data-weapon-weight="${i}"]`)?.value) || 0,
                status: document.querySelector(`[data-weapon-status="${i}"]`)?.value || 'equipped',
                description: this.quillEditors[`weapon-desc-${i}`]?.root.innerHTML || ''
            });
        });

        document.querySelectorAll('[data-armor-name]').forEach((inp, i) => {
            char.equipment.armor.push({
                name: inp.value || '', armorValue: parseInt(document.querySelector(`[data-armor-value="${i}"]`)?.value) || 0,
                protectedAreas: document.querySelector(`[data-armor-areas="${i}"]`)?.value || '',
                minStrength: document.querySelector(`[data-armor-minstr="${i}"]`)?.value || '',
                weight: parseFloat(document.querySelector(`[data-armor-weight="${i}"]`)?.value) || 0,
                status: document.querySelector(`[data-armor-status="${i}"]`)?.value || 'equipped',
                description: this.quillEditors[`armor-desc-${i}`]?.root.innerHTML || ''
            });
        });

        document.querySelectorAll('[data-shield-name]').forEach((inp, i) => {
            char.equipment.shields.push({
                name: inp.value || '', parryBonus: parseInt(document.querySelector(`[data-shield-parry="${i}"]`)?.value) || 0,
                coverage: parseInt(document.querySelector(`[data-shield-coverage="${i}"]`)?.value) || 0,
                minStrength: document.querySelector(`[data-shield-minstr="${i}"]`)?.value || '',
                weight: parseFloat(document.querySelector(`[data-shield-weight="${i}"]`)?.value) || 0,
                status: document.querySelector(`[data-shield-status="${i}"]`)?.value || 'equipped',
                description: this.quillEditors[`shield-desc-${i}`]?.root.innerHTML || ''
            });
        });

        document.querySelectorAll('[data-gear-name]').forEach((inp, i) => {
            char.equipment.gear.push({
                name: inp.value || '', weight: parseFloat(document.querySelector(`[data-gear-weight="${i}"]`)?.value) || 0,
                status: document.querySelector(`[data-gear-status="${i}"]`)?.value || 'carried',
                description: this.quillEditors[`gear-desc-${i}`]?.root.innerHTML || ''
            });
        });

        document.querySelectorAll('[data-power-name]').forEach((inp, i) => {
            char.powers.push({
                name: inp.value || '', rank: document.querySelector(`[data-power-rank="${i}"]`)?.value || '',
                powerPoints: document.querySelector(`[data-power-pp="${i}"]`)?.value || '',
                range: document.querySelector(`[data-power-range="${i}"]`)?.value || '',
                duration: document.querySelector(`[data-power-duration="${i}"]`)?.value || '',
                damage: document.querySelector(`[data-power-damage="${i}"]`)?.value || '',
                ap: document.querySelector(`[data-power-ap="${i}"]`)?.value || '',
                activationSkill: document.querySelector(`[data-power-skill="${i}"]`)?.value || '',
                manifestation: this.quillEditors[`power-manifest-${i}`]?.root.innerHTML || '',
                description: this.quillEditors[`power-desc-${i}`]?.root.innerHTML || '',
                modifiers: this.quillEditors[`power-mod-${i}`]?.root.innerHTML || ''
            });
        });

        char.biography = this.quillEditors['biography']?.root.innerHTML || '';
        return char;
    },

    saveCharacter() {
        const char = this.collectFormData();
        if (!char.header.name) { alert(t('validation.required')); return; }
        const filename = generateFilename(char.header.name);
        downloadJSON(char, filename);
    }
});
