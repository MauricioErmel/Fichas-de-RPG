/**
 * Index page logic - Character listing and navigation
 */

const IndexPage = {
    characters: [],

    /**
     * Initialize the index page
     */
    async init() {
        await this.loadCharacters();
        this.renderCharacters();
        this.setupEventListeners();
    },

    /**
     * Load available characters from the characters folder
     */
    async loadCharacters() {
        // In a static site, we need to know the files beforehand
        // This list would be generated during build or manually maintained
        const characterFiles = ['abel.json', 'rhaast.json'];

        this.characters = [];

        for (const file of characterFiles) {
            try {
                const response = await fetch(`characters/${file}`);
                if (response.ok) {
                    const character = await response.json();
                    character._filename = file;
                    this.characters.push(character);
                }
            } catch (error) {
                console.warn(`Could not load ${file}:`, error);
            }
        }
    },

    /**
     * Render character cards
     */
    renderCharacters() {
        const grid = document.getElementById('characters-grid');
        if (!grid) return;

        if (this.characters.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8 opacity-60">
                    <p data-i18n="noCharacters">${t('noCharacters')}</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.characters.map((char, index) => this.createCharacterCard(char, index)).join('');
    },

    /**
     * Create HTML for a character card
     * @param {object} character - Character data
     * @param {number} index - Index in the array
     * @returns {string} HTML string
     */
    createCharacterCard(character, index) {
        const portrait = character.portrait || 'img/icons/character-default.svg';
        const name = character.header?.name || 'Unknown';
        const system = character.system || 'Savage Worlds';

        return `
            <div class="card bg-base-100 shadow-xl character-card cursor-pointer" data-index="${index}">
                <figure class="relative">
                    <img 
                        src="${portrait}" 
                        alt="${name}" 
                        class="character-portrait"
                        onerror="this.src='img/icons/character-default.svg'"
                    />
                    <div class="system-badge badge badge-primary badge-sm">
                        SW
                    </div>
                </figure>
                <div class="card-body p-4">
                    <h2 class="card-title text-lg">${name}</h2>
                    <p class="text-sm opacity-70">${system}</p>
                </div>
            </div>
        `;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Character card clicks
        document.getElementById('characters-grid')?.addEventListener('click', (e) => {
            const card = e.target.closest('.character-card');
            if (card) {
                const index = parseInt(card.dataset.index);
                this.openCharacter(this.characters[index]);
            }
        });

        // Upload button
        document.getElementById('upload-json')?.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Create button
        document.getElementById('btn-create-character')?.addEventListener('click', () => {
            App.navigateTo('character-creation');
        });
    },

    /**
     * Open a character sheet
     * @param {object} character - Character data
     */
    openCharacter(character) {
        CharacterSheet.loadCharacter(character);
        App.navigateTo('character-sheet');
    },

    /**
     * Handle file upload
     * @param {Event} e - Change event
     */
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            alert(t('messages.invalidFile'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const character = JSON.parse(event.target.result);
                this.openCharacter(character);
            } catch (error) {
                alert(t('messages.invalidFile'));
                console.error('Failed to parse JSON:', error);
            }
        };
        reader.readAsText(file);

        // Reset the input
        e.target.value = '';
    }
};
