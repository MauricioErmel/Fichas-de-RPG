/**
 * Main Application Controller
 */

const App = {
    currentPage: 'index',

    /**
     * Initialize the application
     */
    async init() {
        // Initialize i18n first
        await I18n.init();

        // Setup theme toggle
        this.setupThemeToggle();

        // Setup language selector
        this.setupLanguageSelector();

        // Setup navigation
        this.setupNavigation();

        // Check URL hash for initial page
        this.handleHashChange();

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Initialize index page
        await IndexPage.init();

        console.log('App initialized');
    },

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        const html = document.documentElement;

        // Load saved theme
        const savedTheme = localStorage.getItem('rpg-sheet-theme') || 'retro';
        html.setAttribute('data-theme', savedTheme);
        if (toggle) toggle.checked = savedTheme === 'dim';

        toggle?.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dim' : 'retro';
            html.setAttribute('data-theme', theme);
            localStorage.setItem('rpg-sheet-theme', theme);
        });
    },

    /**
     * Setup language selector
     */
    setupLanguageSelector() {
        document.querySelectorAll('[data-lang]').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                I18n.setLocale(lang);

                // Re-render current page content
                if (this.currentPage === 'index') {
                    IndexPage.renderCharacters();
                } else if (this.currentPage === 'character-sheet') {
                    CharacterSheet.render();
                } else if (this.currentPage === 'character-creation') {
                    CharacterCreation.render();
                }
            });
        });
    },

    /**
     * Setup navigation
     */
    setupNavigation() {
        // Back to index buttons
        document.getElementById('btn-back-to-index')?.addEventListener('click', () => {
            this.navigateTo('index');
        });

        document.getElementById('btn-back-to-index-2')?.addEventListener('click', () => {
            this.navigateTo('index');
        });

        // Edit character button
        document.getElementById('btn-edit-character')?.addEventListener('click', () => {
            if (CharacterSheet.currentCharacter) {
                CharacterCreation.initEdit(CharacterSheet.currentCharacter);
                this.navigateTo('character-creation');
            }
        });
    },

    /**
     * Navigate to a page
     * @param {string} page - Page name (index, character-sheet, character-creation)
     */
    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show target page
        const targetSection = document.getElementById(`page-${page}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');

            // Trigger fade-in animation
            targetSection.style.animation = 'none';
            targetSection.offsetHeight; // Trigger reflow
            targetSection.style.animation = 'fadeIn 0.3s ease-in-out';
        }

        // Update hash
        window.history.pushState(null, '', `#${page}`);
        this.currentPage = page;

        // Scroll to top
        window.scrollTo(0, 0);

        // Initialize page-specific content
        if (page === 'index') {
            IndexPage.renderCharacters();
        } else if (page === 'character-creation' && !CharacterCreation.editMode) {
            CharacterCreation.initNew();
        }
    },

    /**
     * Handle hash change
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'index';
        const validPages = ['index', 'character-sheet', 'character-creation'];

        if (validPages.includes(hash)) {
            this.navigateTo(hash);
        } else {
            this.navigateTo('index');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
