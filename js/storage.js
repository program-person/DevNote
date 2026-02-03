
const STORAGE_KEY = 'devnote_data';

const defaultData = {
    projects: [],
    logs: []
};

export const Storage = {
    /**
     * Load data from LocalStorage
     * @returns {Object} Data object containing projects and logs
     */
    load() {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) {
            return { ...defaultData }; // Return copy of default
        }
        try {
            return JSON.parse(json);
        } catch (e) {
            console.error('Failed to parse storage data:', e);
            return { ...defaultData };
        }
    },

    /**
     * Save data to LocalStorage
     * @param {Object} data - The data object to save
     */
    save(data) {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, json);
        } catch (e) {
            console.error('Failed to save data to storage:', e);
            alert('Failed to save data. LocalStorage might be full.');
        }
    },

    /**
     * Clear all data (Debug purpose)
     */
    clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
