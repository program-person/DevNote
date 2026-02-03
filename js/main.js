
import { Storage } from './storage.js';
import { ProjectModule } from './project.js';
import { LogModule } from './log.js';
import { UI } from './ui.js';
import { TimerModule } from './timer.js';

const App = {
    data: null,
    currentProjectId: null,

    init() {
        // Load Data
        this.data = Storage.load();

        // Init UI with handlers
        UI.init({
            onProjectCreate: (name, desc) => this.handleProjectCreate(name, desc),
            onProjectSelect: (id) => this.handleProjectSelect(id),
            onProjectDelete: (id) => this.handleProjectDelete(id),
            onLogCreate: (title, type, content, tags, level) => this.handleLogCreate(title, type, content, tags, level),
            onLogUpdate: (id, updates) => this.handleLogUpdate(id, updates),
            onLogDelete: (id) => this.handleLogDelete(id),
            getAllTags: () => this.getAllTags(), // For suggestions
            onDataExport: () => this.handleExportData(),
            onDataImport: (file) => this.handleImportData(file),
            onSearch: (query) => this.handleSearch(query),
            onReview: (isGlobal) => this.handleReview(isGlobal)
        });

        // Init Timer
        const timerDisplay = document.getElementById('timer-display');
        const btnStart = document.getElementById('btn-timer-start');
        const btnReset = document.getElementById('btn-timer-reset');
        if (timerDisplay && btnStart && btnReset) {
            TimerModule.init(timerDisplay, btnStart, btnReset);
        }

        // Initial Render
        this.render();
    },

    render() {
        // Render Project List
        const projects = ProjectModule.getAll(this.data);
        UI.renderProjectList(projects, this.currentProjectId);

        // Update Dashboard Stats
        // Update Dashboard Stats
        const allLogs = LogModule.getAll(this.data);
        UI.updateDashboard(allLogs);

        // Render Main View
        if (this.currentProjectId) {
            const project = ProjectModule.getById(this.data, this.currentProjectId);
            if (project) {
                const logs = LogModule.getByProject(this.data, this.currentProjectId);
                UI.showProjectView(project);
                UI.renderLogList(logs);
            } else {
                // Project might have been deleted (in future)
                this.currentProjectId = null;
                UI.showDashboard();
            }
        } else {
            UI.showDashboard();
        }
    },

    save() {
        Storage.save(this.data);
        this.render();
    },

    // Handlers
    handleProjectCreate(name, description) {
        const newProject = ProjectModule.create(this.data, name, description);
        this.save();
        // Automatically select the new project
        this.handleProjectSelect(newProject.id);
    },

    handleProjectSelect(id) {
        this.currentProjectId = id;
        this.render();
    },

    handleLogCreate(title, type, content, tags, level) {
        if (!this.currentProjectId) return;
        LogModule.create(this.data, this.currentProjectId, title, type, content, tags || [], level);
        this.save();
    },

    // Suggestion Helper
    getAllTags() {
        return LogModule.getAllTags(this.data);
    },

    handleLogUpdate(id, updates) {
        LogModule.update(this.data, id, updates);
        this.save();
    },

    handleLogDelete(id) {
        if (LogModule.delete(this.data, id)) {
            this.save();
        }
    },

    handleProjectDelete(id) {
        // Also delete associated logs
        const logs = LogModule.getByProject(this.data, id);
        logs.forEach(l => LogModule.delete(this.data, l.id));

        if (ProjectModule.delete(this.data, id)) {
            // Select no project if current was deleted
            if (this.currentProjectId === id) {
                this.currentProjectId = null;
            }
            this.save();
        }
    },

    // Feature: Data Backup
    handleExportData() {
        const jsonStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `devnote_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    handleImportData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation
                if (importedData.projects && importedData.logs) {
                    this.data = importedData;
                    this.save();
                    alert('データの復元が完了しました。ページをリロードします。');
                    location.reload();
                } else {
                    alert('エラー: 無効なデータ形式です。');
                }
            } catch (err) {
                alert('エラー: ファイルの読み込みに失敗しました。');
                console.error(err);
            }
        };
        reader.readAsText(file);
    },

    // Feature: Search
    handleSearch(query) {
        if (!this.currentProjectId) return;

        const projectLogs = LogModule.getByProject(this.data, this.currentProjectId);
        if (!query) {
            UI.renderLogList(projectLogs);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = projectLogs.filter(log => {
            const inTitle = log.title?.toLowerCase().includes(lowerQuery);
            const inContent = log.content?.toLowerCase().includes(lowerQuery);
            const inTags = log.tags?.some(t => t.toLowerCase().includes(lowerQuery));
            return inTitle || inContent || inTags;
        });

        UI.renderLogList(filtered);
    },

    // Bonus: Review Mode
    handleReview() {
        if (!this.currentProjectId) return;

        const logs = LogModule.getByProject(this.data, this.currentProjectId);
        if (logs.length === 0) {
            alert('このプロジェクトにはまだログがありません。まずはログを作成しましょう！');
            return;
        }

        // Simple Random Selection
        const randomLog = logs[Math.floor(Math.random() * logs.length)];
        UI.showReviewCard(randomLog);
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
