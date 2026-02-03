
export const ProjectModule = {
    /**
     * Create a new project
     * @param {Object} data - App state
     * @param {string} name - Project name
     * @param {string} description - Project description
     * @returns {Object} The new project object
     */
    create(data, name, description) {
        const id = 'p' + Date.now().toString(36);
        const newProject = {
            id,
            name,
            description,
            createdAt: new Date().toISOString()
        };
        data.projects.push(newProject);
        return newProject;
    },

    /**
     * Get all projects
     * @param {Object} data 
     * @returns {Array} List of projects
     */
    getAll(data) {
        return data.projects || [];
    },

    /**
     * Find project by ID
     */
    getById(data, id) {
        return data.projects.find(p => p.id === id);
    },

    /**
     * Delete project by ID
     */
    delete(data, id) {
        const index = data.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            data.projects.splice(index, 1);
            return true;
        }
        return false;
    }
};
