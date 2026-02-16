
export const LogModule = {
    /**
     * Create a new log
     * @param {Object} data - App state
     * @param {string} projectId
     * @param {string} title
     * @param {string} type
     * @param {string} content
     * @param {string[]} [tags=[]] - An array of tags for the log.
     * @returns {Object} The new log object
     */
    create(data, projectId, title, type, content, tags, level = 3) {
        const id = 'l' + Date.now().toString(36);
        const newLog = {
            id,
            projectId,
            type,
            title,
            content,
            tags,
            level: parseInt(level),
            understanding: parseInt(level), // Aliased for LearningAnalyzer
            createdAt: new Date().toISOString(),
            reviewCount: 0,
            lastReviewedAt: null,
            nextReviewAt: null
        };
        data.logs.push(newLog);
        return newLog;
    },

    /**
     * Get all unique tags from all logs
     */
    getAllTags(data) {
        const tags = new Set();
        (data.logs || []).forEach(log => {
            if (log.tags && Array.isArray(log.tags)) {
                log.tags.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort();
    },

    /**
     * Get logs for a specific project
     */
    getByProject(data, projectId) {
        return data.logs.filter(l => l.projectId === projectId);
    },

    /**
     * Get all logs (for statistics)
     */
    getAll(data) {
        return data.logs || [];
    },

    /**
     * Delete log by ID
     */
    delete(data, id) {
        const index = data.logs.findIndex(l => l.id === id);
        if (index !== -1) {
            data.logs.splice(index, 1);
            return true;
        }
        return false;
    },

    /**
     * Update log
     */
    update(data, id, updates) {
        const log = data.logs.find(l => l.id === id);
        if (log) {
            Object.assign(log, updates);
            // Optionally update 'updatedAt'
            log.updatedAt = new Date().toISOString();
            return log;
        }
        return null;
    }
};
