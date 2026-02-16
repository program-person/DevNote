
import { Storage } from './storage.js';
import { ProjectModule } from './project.js';
import { LogModule } from './log.js';
import { UI } from './ui.js';
import { SnippetModule } from './snippet.js';
import { TimerModule } from './timer.js';
import { SyncModule } from './sync.js';

const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyChK3L_MZ77uAG4ZgWct--5h1A5dTgPz84",
    authDomain: "devnote-48b39.firebaseapp.com",
    projectId: "devnote-48b39",
    storageBucket: "devnote-48b39.firebasestorage.app",
    messagingSenderId: "472866404045",
    appId: "1:472866404045:web:d2d652ff67aaa3997a5b84",
    measurementId: "G-5F83S6DD16"
};

const App = {
    data: null,
    currentProjectId: null,

    init() {
        // Load Data
        this.data = Storage.load();

        // Try Init Sync
        const storedKey = localStorage.getItem('devnote_sync_key');
        // Always try to use default config if no override
        const storedConfigStr = localStorage.getItem('devnote_firebase_config');
        const config = storedConfigStr ? JSON.parse(storedConfigStr) : DEFAULT_FIREBASE_CONFIG;

        if (storedKey) {
            try {
                // Ensure Firebase is loaded before init
                if (window.Firebase && SyncModule.init(config, storedKey)) {
                    console.log('Cloud Sync Ready');
                } else if (!window.Firebase) {
                    console.warn('Firebase SDK not loaded yet. Sync disabled for this session.');
                }
            } catch (e) {
                console.error('Sync Init Error:', e);
            }
        }

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
            onReview: (isGlobal) => this.handleReview(isGlobal),
            // Sync Handlers
            onSaveSettings: (key, config) => this.handleSaveSettings(key, config),
            onSync: () => this.handleSync(),
            // Phase 6: UI Enhancement Handlers
            onThemeToggle: () => this.handleThemeToggle(),
            onLogSort: (sortType) => this.handleLogSort(sortType),
            onTagFilter: (tag) => this.handleTagFilter(tag),
            // Phase 8: Snippet Handlers
            onSnippetCreate: (title, lang, code) => this.handleSnippetCreate(title, lang, code),
            onSnippetUpdate: (id, updates) => this.handleSnippetUpdate(id, updates),
            onSnippetDelete: (id) => this.handleSnippetDelete(id),
            getSnippets: () => this.getSnippetsForCurrentProject()
        });

        // Init Timer
        const timerDisplay = document.getElementById('timer-display');
        const btnStart = document.getElementById('btn-timer-start');
        const btnReset = document.getElementById('btn-timer-reset');
        if (timerDisplay && btnStart && btnReset) {
            TimerModule.init(timerDisplay, btnStart, btnReset);
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('devnote_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const btn = document.getElementById('btn-theme-toggle');
            if (btn) btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
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

    handleSaveSettings(key, configStr) {
        if (!key) {
            alert('合言葉(ユーザーID)を入力してください。');
            return;
        }

        let config = DEFAULT_FIREBASE_CONFIG;
        if (configStr && configStr.trim() !== '') {
            try {
                config = JSON.parse(configStr);
                localStorage.setItem('devnote_firebase_config', configStr);
            } catch (e) {
                alert('JSONの形式が正しくありません。');
                return;
            }
        }

        localStorage.setItem('devnote_sync_key', key);

        if (SyncModule.init(config, key)) {
            alert('接続に成功しました！データをクラウドに保存します...');
            this.handleSync(); // Auto save on connect
        } else {
            alert('接続に失敗しました。');
        }
    },

    async handleSync() {
        const statusEl = document.getElementById('sync-status');
        if (statusEl) statusEl.textContent = '同期中...';

        // 1. Save (Push)
        const resSave = await SyncModule.save(this.data);
        if (resSave.success) {
            if (statusEl) statusEl.textContent = '✅ 保存完了';
            setTimeout(() => { if (statusEl) statusEl.textContent = '接続済み'; }, 2000);
        } else {
            alert('同期エラー: ' + resSave.error);
            if (statusEl) statusEl.textContent = '❌ エラー';
        }
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
    },

    handleThemeToggle() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('devnote_theme', newTheme);

        // Update button icon
        const btn = document.getElementById('btn-theme-toggle');
        if (btn) btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    },

    handleLogSort(sortType) {
        if (!this.currentProjectId) return;

        const logs = LogModule.findByProject(this.data, this.currentProjectId);
        let sorted = [...logs];

        switch (sortType) {
            case 'date-new':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'date-old':
                sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'title':
                sorted.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
                break;
            case 'level':
                sorted.sort((a, b) => (a.level || 3) - (b.level || 3));
                break;
        }

        UI.renderLogList(sorted);
    },

    handleTagFilter(tag) {
        if (!this.currentProjectId) return;

        const logs = LogModule.findByProject(this.data, this.currentProjectId);
        const filtered = tag ? logs.filter(l => l.tags && l.tags.includes(tag)) : logs;
        UI.renderLogList(filtered);
    },

    // Phase 8: Snippet Handlers
    handleSnippetCreate(title, language, code) {
        if (!this.currentProjectId) return;
        SnippetModule.create(this.data, this.currentProjectId, title, language, code);
        this.save();
        UI.renderSnippetList(this.getSnippetsForCurrentProject());
    },

    handleSnippetUpdate(id, updates) {
        SnippetModule.update(this.data, id, updates);
        this.save();
        UI.renderSnippetList(this.getSnippetsForCurrentProject());
    },

    handleSnippetDelete(id) {
        if (!confirm('このスニペットを削除しますか？')) return;
        SnippetModule.delete(this.data, id);
        this.save();
        UI.renderSnippetList(this.getSnippetsForCurrentProject());
    },

    getSnippetsForCurrentProject() {
        if (!this.currentProjectId) return [];
        return SnippetModule.getByProject(this.data, this.currentProjectId);
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
