
export const SnippetModule = {
    create(data, projectId, title, language, code) {
        if (!data.snippets) data.snippets = [];
        const id = 's' + Date.now().toString(36);
        const snippet = {
            id,
            projectId,
            title,
            language,
            code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.snippets.push(snippet);
        return snippet;
    },

    getByProject(data, projectId) {
        if (!data.snippets) data.snippets = [];
        return data.snippets.filter(s => s.projectId === projectId);
    },

    update(data, id, updates) {
        if (!data.snippets) return null;
        const snippet = data.snippets.find(s => s.id === id);
        if (snippet) {
            Object.assign(snippet, updates);
            snippet.updatedAt = new Date().toISOString();
            return snippet;
        }
        return null;
    },

    delete(data, id) {
        if (!data.snippets) return false;
        const index = data.snippets.findIndex(s => s.id === id);
        if (index !== -1) {
            data.snippets.splice(index, 1);
            return true;
        }
        return false;
    }
};
