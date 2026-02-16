
export const MigrationModule = {
    CURRENT_VERSION: 2,

    /**
     * Migrate data to the current version
     * @param {Object} data 
     * @returns {Object} Migrated data
     */
    migrate(data) {
        if (!data) return data;

        // Initialize version if missing (Version 1)
        if (typeof data.schemaVersion === 'undefined') {
            data.schemaVersion = 1;
        }

        if (data.schemaVersion < 2) {
            console.log('Migrating data to v2...');
            this.migrateToV2(data);
            data.schemaVersion = 2;
        }

        return data;
    },

    /**
     * v2 Migration: Add Learning Analysis fields
     * - understanding (1-5, default 3)
     * - reviewCount (default 0)
     * - lastReviewedAt (default null)
     * - nextReviewAt (default null)
     */
    migrateToV2(data) {
        if (data.logs && Array.isArray(data.logs)) {
            data.logs.forEach(log => {
                if (typeof log.understanding === 'undefined') log.understanding = 3;
                if (typeof log.reviewCount === 'undefined') log.reviewCount = 0;
                if (typeof log.lastReviewedAt === 'undefined') log.lastReviewedAt = null;
                if (typeof log.nextReviewAt === 'undefined') log.nextReviewAt = null;
            });
        }
    }
};
