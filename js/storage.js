import { MigrationModule } from './migration.js';

const STORAGE_KEY = 'devnote_data';
const BACKUP_KEY = 'devnote_data_backup';

const defaultData = {
    projects: [],
    logs: [],
    snippets: [],
    schemaVersion: 2
};

export const Storage = {
    /**
     * Load data from LocalStorage
     * @returns {Object} Data object containing projects and logs
     */
    load() {
        const json = localStorage.getItem(STORAGE_KEY);
        let data;

        if (!json) {
            data = { ...defaultData };
        } else {
            try {
                data = JSON.parse(json);
            } catch (e) {
                console.error('Failed to parse storage data:', e);
                // Try reading backup
                const backup = localStorage.getItem(BACKUP_KEY);
                if (backup) {
                    try {
                        console.warn('Recovering from backup...');
                        data = JSON.parse(backup);
                    } catch (be) {
                        data = { ...defaultData };
                    }
                } else {
                    data = { ...defaultData };
                }
            }
        }

        // Run Migration
        return MigrationModule.migrate(data);
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
    },

    /**
     * Start Auto Backup (every 5 mins)
     */
    startAutoBackup() {
        console.log('Auto Backup started (Interval: 5min)');
        setInterval(() => {
            const json = localStorage.getItem(STORAGE_KEY);
            if (json) {
                try {
                    localStorage.setItem(BACKUP_KEY, json);
                    console.log('Auto backup saved at', new Date().toLocaleTimeString());
                } catch (e) {
                    console.warn('Auto backup failed (Storage full?):', e);
                }
            }
        }, 5 * 60 * 1000);
    }
};
