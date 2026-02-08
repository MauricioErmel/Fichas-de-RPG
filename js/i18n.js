/**
 * Internationalization (i18n) module
 */

const I18n = {
    currentLocale: 'pt-BR',
    translations: {},

    /**
     * Initialize the i18n system
     */
    async init() {
        // Load saved locale preference
        const savedLocale = localStorage.getItem('rpg-sheet-locale');
        if (savedLocale) {
            this.currentLocale = savedLocale;
        }

        // Load translations
        try {
            const response = await fetch('locales.json');
            this.translations = await response.json();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }

        // Update UI
        this.updateUI();
        this.updateLanguageDisplay();
    },

    /**
     * Set the current locale
     * @param {string} locale - Locale code (e.g., 'pt-BR' or 'en')
     */
    setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            localStorage.setItem('rpg-sheet-locale', locale);
            this.updateUI();
            this.updateLanguageDisplay();
        }
    },

    /**
     * Get a translation by key path
     * @param {string} keyPath - Dot-separated key path (e.g., 'header.name')
     * @param {object} params - Optional parameters for interpolation
     * @returns {string} Translated string
     */
    t(keyPath, params = {}) {
        const keys = keyPath.split('.');
        let value = this.translations[this.currentLocale];

        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return keyPath; // Return key if not found
            }
        }

        if (typeof value !== 'string') {
            return keyPath;
        }

        // Replace parameters
        let result = value;
        for (const [param, replacement] of Object.entries(params)) {
            result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), replacement);
        }

        return result;
    },

    /**
     * Update all elements with data-i18n attribute
     */
    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLocale === 'pt-BR' ? 'pt-BR' : 'en';
    },

    /**
     * Update the language display in the header
     */
    updateLanguageDisplay() {
        const display = document.getElementById('current-lang');
        if (display) {
            display.textContent = this.currentLocale === 'pt-BR' ? 'PT-BR' : 'EN';
        }
    }
};

// Shorthand function for translations
function t(key, params) {
    return I18n.t(key, params);
}
