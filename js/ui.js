
export const UI = {
    elements: {},

    init(handlers) {
        this.handlers = handlers;

        // Initialize elements AFTER DOM is ready
        this.elements = {
            projectList: document.getElementById('project-list'),
            logList: document.getElementById('log-list'),
            modalProject: document.getElementById('modal-project'),
            modalLog: document.getElementById('modal-log'),
            currentProjectTitle: document.getElementById('current-project-title'),
            btnNewProject: document.getElementById('btn-new-project'),
            btnNewLog: document.getElementById('btn-new-log'),
            formProject: document.getElementById('form-project'),
            formLog: document.getElementById('form-log'),
            closeModals: document.querySelectorAll('.close-modal'),
            dashboardView: document.getElementById('dashboard-view'),
            logListView: document.getElementById('log-list-view'),
            totalLogsCount: document.getElementById('total-logs-count'),
            logIdInput: document.getElementById('log-id'),
            modalLogTitle: document.getElementById('modal-log-title'),
            btnToggleCheatSheet: document.getElementById('btn-toggle-cheat-sheet'),
            cheatSheet: document.getElementById('cheat-sheet'),
            tagSuggestions: document.getElementById('tag-suggestions'),
            // Phase 8: Snippets
            modalSnippet: document.getElementById('modal-snippet'),
            formSnippet: document.getElementById('form-snippet'),
            snippetList: document.getElementById('snippet-list')
        };

        this.setupEventListeners();

        // Initialize Mermaid
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({ startOnLoad: false, theme: 'default' });
        }
    },

    // Helper to render Extras (Mermaid, Math)
    renderMarkdownExtras(container) {
        // 1. Math (KaTeX)
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ]
            });
        }

        // 2. Mermaid
        if (typeof mermaid !== 'undefined') {
            const codeBlocks = container.querySelectorAll('pre code.language-mermaid');
            codeBlocks.forEach((block, index) => {
                const pre = block.parentElement;
                const code = block.textContent;
                const div = document.createElement('div');
                div.className = 'mermaid';
                div.textContent = code;
                div.id = `mermaid-${Date.now()}-${index}`; // Unique ID needed sometimes
                pre.replaceWith(div);
            });

            mermaid.run().catch(err => console.error('Mermaid error:', err));
        }
    },

    renderTagSuggestions(tags) {
        const container = this.elements.tagSuggestions;
        if (!container) return;

        container.innerHTML = '';
        if (tags.length === 0) {
            container.innerHTML = '<span style="font-size:0.8rem; color:#888;">使用履歴なし</span>';
            return;
        }

        tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = '#' + tag;
            btn.style.cssText = 'background:#e0e0e0; border:none; border-radius:12px; padding:2px 8px; font-size:0.75rem; cursor:pointer; margin-right:5px;';
            btn.addEventListener('click', () => {
                const input = document.getElementById('log-tags');
                const current = input.value.trim();
                if (current) {
                    input.value = current + ', ' + tag;
                } else {
                    input.value = tag;
                }
            });
            container.appendChild(btn);
        });
    },

    setupEventListeners() {
        const { elements, handlers } = this;

        // Modals
        elements.btnNewProject.addEventListener('click', () => {
            elements.modalProject.classList.remove('hidden');
        });

        elements.btnNewLog.addEventListener('click', () => {
            // Reset form for NEW log
            this.resetLogForm();
            // Render suggestions
            const allTags = handlers.getAllTags ? handlers.getAllTags() : [];
            this.renderTagSuggestions(allTags);

            elements.modalLog.classList.remove('hidden');
        });

        elements.closeModals.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find the parent modal and close it
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });

        // Global Shortcuts
        window.addEventListener('keydown', (e) => {
            // Ctrl + N: New Log
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (!elements.btnNewLog.disabled) {
                    elements.btnNewLog.click();
                } else {
                    alert('プロジェクトを選択してください');
                }
            }

            // Ctrl + K: Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const search = document.getElementById('search-input');
                if (search) search.focus();
            }

            // Ctrl + Enter: Submit Form (if modal open)
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!elements.modalLog.classList.contains('hidden')) {
                    elements.formLog.dispatchEvent(new Event('submit'));
                }
            }
            // Esc: Close Modals
            if (e.key === 'Escape') {
                elements.modalLog.classList.add('hidden');
                elements.modalProject.classList.add('hidden');
                const ms = document.getElementById('modal-settings'); if (ms) ms.classList.add('hidden');
                const mh = document.getElementById('modal-help'); if (mh) mh.classList.add('hidden');
                const rv = document.getElementById('review-view'); if (rv) rv.classList.add('hidden');
                if (elements.cheatSheet) elements.cheatSheet.classList.add('hidden');
            }
        });

        // Settings & Help Modals
        const btnSettings = document.getElementById('btn-open-settings');
        const modalSettings = document.getElementById('modal-settings');
        if (btnSettings && modalSettings) {
            btnSettings.addEventListener('click', () => {
                modalSettings.classList.remove('hidden');
                const config = localStorage.getItem('devnote_firebase_config');
                const key = localStorage.getItem('devnote_sync_key');
                if (config) document.getElementById('firebase-config').value = config;
                if (key) document.getElementById('sync-key').value = key;
            });
        }

        const btnSaveSettings = document.getElementById('btn-save-settings');
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener('click', () => {
                const key = document.getElementById('sync-key').value;
                const configStr = document.getElementById('firebase-config').value;
                handlers.onSaveSettings(key, configStr);
                const statusEl = document.getElementById('sync-status');
                if (!statusEl || statusEl.textContent !== '❌ エラー') {
                    modalSettings.classList.add('hidden');
                }
            });
        }

        const btnForceSync = document.getElementById('btn-force-sync');
        if (btnForceSync) {
            btnForceSync.addEventListener('click', () => handlers.onSync());
        }

        // Data Export/Import
        const btnExport = document.getElementById('btn-export-data');
        const btnImport = document.getElementById('btn-import-data');
        const fileImport = document.getElementById('file-import');

        if (btnExport) btnExport.addEventListener('click', handlers.onDataExport);
        if (btnImport) btnImport.addEventListener('click', () => fileImport.click());
        if (fileImport) fileImport.addEventListener('change', (e) => handlers.onDataImport(e.target.files[0]));

        // Help Modal
        const btnHelp = document.getElementById('btn-help');
        const modalHelp = document.getElementById('modal-help');
        if (btnHelp && modalHelp) {
            btnHelp.addEventListener('click', () => modalHelp.classList.remove('hidden'));
        }

        // Search Input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                handlers.onSearch(e.target.value);
            });
        }

        // Bonus: Review Mode
        const btnReview = document.getElementById('btn-review-mode');
        if (btnReview) {
            btnReview.addEventListener('click', () => {
                handlers.onReview();
            });
        }

        // Navigation: Go to Dashboard
        const appLogo = document.getElementById('app-logo');
        if (appLogo) {
            appLogo.addEventListener('click', () => {
                // Clear active project style
                const activeItem = this.elements.projectList.querySelector('.active');
                if (activeItem) activeItem.classList.remove('active');

                // Show dashboard
                this.showDashboard();
            });
        }

        // Quick Review (Dashboard)
        const btnQuickReview = document.getElementById('btn-quick-review');
        if (btnQuickReview) {
            btnQuickReview.addEventListener('click', () => {
                const activeItem = this.elements.projectList.querySelector('.active');
                if (activeItem) activeItem.classList.remove('active');

                handlers.onReview(true); // pass true for "Global Review" mode
            });
        }

        // Templates
        const tmplBtns = document.querySelectorAll('.btn-template');
        tmplBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.tmpl;
                const textarea = document.getElementById('log-content');
                let text = '';

                if (type === 'bug') {
                    text = `### 🐛 バグの内容\n- 現象:\n- 原因:\n\n### 🛠️ 解決策\n\`\`\`js\n// Code here\n\`\`\``;
                } else if (type === 'learning') {
                    text = `### 📚 学んだこと\n1. \n2. \n\n### 📝 補足\n`;
                } else if (type === 'idea') {
                    text = `### 💡 アイデア概要\n- 背景:\n- 具体案:\n`;
                }

                const cursor = textarea.selectionStart;
                const val = textarea.value;
                textarea.value = val.slice(0, cursor) + text + val.slice(cursor);
                textarea.focus();
            });
        });


        // Phase 6: Theme Toggle
        const btnThemeToggle = document.getElementById('btn-theme-toggle');
        if (btnThemeToggle) {
            btnThemeToggle.addEventListener('click', () => handlers.onThemeToggle());
        }

        // Phase 6: Log Sort
        const sortSelect = document.getElementById('log-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => handlers.onLogSort(e.target.value));
        }

        // Cheat Sheet Toggle
        elements.btnToggleCheatSheet.addEventListener('click', () => {
            elements.cheatSheet.classList.toggle('hidden');
        });

        // Phase 8: Tab Switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                document.getElementById('tab-logs').classList.toggle('hidden', tab !== 'logs');
                document.getElementById('tab-snippets').classList.toggle('hidden', tab !== 'snippets');
                if (tab === 'snippets') {
                    this.renderSnippetList(handlers.getSnippets());
                }
            });
        });

        // Phase 8: Snippet Modal
        const btnNewSnippet = document.getElementById('btn-new-snippet');
        if (btnNewSnippet) {
            btnNewSnippet.addEventListener('click', () => {
                document.getElementById('snippet-edit-id').value = '';
                document.getElementById('snippet-modal-title').textContent = '新しいスニペットを保存';
                elements.formSnippet.reset();
                elements.modalSnippet.classList.remove('hidden');
            });
        }

        // Phase 8: Snippet Form
        if (elements.formSnippet) {
            elements.formSnippet.addEventListener('submit', (e) => {
                e.preventDefault();
                const editId = document.getElementById('snippet-edit-id').value;
                const title = document.getElementById('snippet-title').value;
                const language = document.getElementById('snippet-language').value;
                const code = document.getElementById('snippet-code').value;

                if (editId) {
                    handlers.onSnippetUpdate(editId, { title, language, code });
                } else {
                    handlers.onSnippetCreate(title, language, code);
                }
                elements.modalSnippet.classList.add('hidden');
                e.target.reset();
            });
        }

        // Forms
        elements.formProject.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('project-name').value;
            const desc = document.getElementById('project-desc').value;
            handlers.onProjectCreate(name, desc);
            elements.modalProject.classList.add('hidden');
            e.target.reset();
        });

        elements.formLog.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('log-id').value;
            const title = document.getElementById('log-title').value;
            const type = document.getElementById('log-type').value;
            const content = document.getElementById('log-content').value;

            // Split tags by comma, trim, and filter empty
            const tagsInput = document.getElementById('log-tags').value;
            const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

            if (id) {
                // UPDATE
                handlers.onLogUpdate(id, { title, type, content, tags });
            } else {
                // CREATE
                handlers.onLogCreate(title, type, content, tags);
            }
            elements.modalLog.classList.add('hidden');
        });
    },

    resetLogForm() {
        this.elements.formLog.reset();
        this.elements.logIdInput.value = '';
        this.elements.modalLogTitle.textContent = 'New Log';
        this.elements.cheatSheet.classList.add('hidden');
    },

    openEditLogModal(log) {
        this.elements.logIdInput.value = log.id;
        document.getElementById('log-title').value = log.title;
        document.getElementById('log-type').value = log.type;
        // Phase 4: Tags
        document.getElementById('log-tags').value = (log.tags || []).join(', ');
        // Render suggestions
        const allTags = this.handlers.getAllTags ? this.handlers.getAllTags() : [];
        this.renderTagSuggestions(allTags);

        document.getElementById('log-content').value = log.content;
        this.elements.modalLogTitle.textContent = 'ログ編集';
        this.elements.modalLog.classList.remove('hidden');
    },

    renderProjectList(projects, activeProjectId) {
        this.elements.projectList.innerHTML = '';
        projects.forEach(p => {
            const li = document.createElement('li');

            // Content container
            const contentSpan = document.createElement('span');
            contentSpan.textContent = p.name;
            contentSpan.style.flex = '1';

            // Delete Action
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'project-actions';

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-icon btn-delete';
            btnDelete.innerHTML = '🗑️';
            btnDelete.title = 'Delete Project';
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent select
                if (confirm(`Delete project "${p.name}"? This will delete all logs in inside.`)) {
                    this.handlers.onProjectDelete(p.id);
                }
            });
            actionsDiv.appendChild(btnDelete);

            li.appendChild(contentSpan);
            li.appendChild(actionsDiv);

            if (p.id === activeProjectId) {
                li.classList.add('active');
            }
            li.addEventListener('click', (e) => {
                // Safety check: if delete button was clicked (should be handled by stopPropagation, but just in case)
                if (e.target.closest('.btn-delete')) return;

                console.log('Project clicked:', p.id);
                this.handlers.onProjectSelect(p.id);
            });
            this.elements.projectList.appendChild(li);
        });
    },

    renderLogList(logs) {
        this.elements.logList.innerHTML = '';
        if (logs.length === 0) {
            this.elements.logList.innerHTML = '<p style="color:#888; text-align:center;">No logs yet. created one!</p>';
            return;
        }

        // Sort new to old
        [...logs].reverse().forEach(log => {
            const card = document.createElement('div');
            card.className = `log-card type-${log.type}`;

            // Markdown Rendering
            // Parse with marked, then sanitize with DOMPurify
            const rawHtml = DOMPurify.sanitize(marked.parse(log.content));

            // Tags rendering
            const tagsHtml = (log.tags && log.tags.length > 0)
                ? `<div class="log-tags" style="margin-bottom:0.5rem;">${log.tags.map(t => `<span class="tag-chip" style="background:#eee; padding:2px 6px; border-radius:12px; font-size:0.75rem; margin-right:4px;">#${t}</span>`).join('')}</div>`
                : '';

            // Construct Card HTML with Actions
            card.innerHTML = `
                <div class="log-header">
                    <h3>${this.escapeHtml(log.title)} <small style="font-weight:normal; font-size:0.8em; padding:2px 5px; background:#eee; border-radius:4px;">${log.type}</small></h3>
                    <div class="log-meta">
                        <span class="log-date">${new Date(log.createdAt).toLocaleString('ja-JP')}</span>
                        <div class="log-actions" style="display:inline-block; margin-left:10px;">
                            <button class="btn-icon btn-edit" data-id="${log.id}" title="編集">✏️</button>
                            <button class="btn-icon btn-delete" data-id="${log.id}" title="削除">🗑️</button>
                        </div>
                    </div>
                </div>
                ${tagsHtml}
                <div class="log-content markdown-body">
                    ${rawHtml}
                </div>
            `;

            // Event Listeners for Edit/Delete
            const btnEdit = card.querySelector('.btn-edit');
            const btnDelete = card.querySelector('.btn-delete');

            btnEdit.addEventListener('click', () => this.openEditLogModal(log));
            btnDelete.addEventListener('click', () => {
                if (confirm('Delete this log?')) {
                    this.handlers.onLogDelete(log.id);
                }
            });

            card.querySelectorAll('pre code').forEach((block) => {
                // Skip if it became a mermaid div
                if (block.classList.contains('language-mermaid')) return;
                hljs.highlightElement(block);
                this.addCopyButton(block);
            });

            // Extras
            this.renderMarkdownExtras(card.querySelector('.log-content'));

            this.elements.logList.appendChild(card);
        });
    },

    addCopyButton(codeBlock) {
        const pre = codeBlock.parentElement;
        // Check if already wrapped (rehashing prevention)
        if (pre.parentElement.classList.contains('code-block-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.className = 'btn-copy';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            });
        });
        wrapper.appendChild(btn);
    },

    updateDashboard(allLogs) {
        // A. Summary Stats
        const now = new Date();
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
        const oneMonthAgo = new Date(); oneMonthAgo.setDate(now.getDate() - 30);

        const total = allLogs.length;
        const weekly = allLogs.filter(l => new Date(l.createdAt) >= oneWeekAgo).length;
        const monthly = allLogs.filter(l => new Date(l.createdAt) >= oneMonthAgo).length;

        // Update Stats Cards
        const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setStat('stat-total', total);
        setStat('stat-weekly', weekly);
        setStat('stat-monthly', monthly);
        setStat('total-logs-count', total); // Fallback for old layout if exists

        // Streak Calc
        const streakEl = document.getElementById('stat-streak');
        if (streakEl) {
            const dates = new Set(allLogs.map(l => new Date(l.createdAt).toLocaleDateString()));
            let streak = 0;
            let d = new Date();
            // Check today or yesterday
            if (!dates.has(d.toLocaleDateString())) {
                d.setDate(d.getDate() - 1);
            }
            while (dates.has(d.toLocaleDateString())) {
                streak++;
                d.setDate(d.getDate() - 1);
            }
            streakEl.textContent = streak;
        }

        // B. Heatmap (Reuse existing logic)
        const graphContainer = document.getElementById('contribution-graph');
        if (graphContainer) {
            graphContainer.innerHTML = '';
            const daysMap = {};
            allLogs.forEach(log => {
                const dateKey = new Date(log.createdAt).toISOString().split('T')[0];
                daysMap[dateKey] = (daysMap[dateKey] || 0) + 1;
            });
            const daysToShow = 180;
            for (let i = daysToShow; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const count = daysMap[dateStr] || 0;
                let level = 0;
                if (count >= 1) level = 1;
                if (count >= 3) level = 2;
                if (count >= 5) level = 3;
                if (count >= 8) level = 4;
                const cell = document.createElement('div');
                cell.className = `contrib-day contrib-level-${level}`;
                cell.title = `${dateStr}: ${count} logs`;
                graphContainer.appendChild(cell);
            }
        }

        // C. Skills (Chart.js)
        const ctx = document.getElementById('skills-chart');
        if (ctx) {
            const tagCounts = {};
            allLogs.forEach(l => {
                if (l.tags && l.tags.length > 0) {
                    l.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
                } else {
                    tagCounts['(No Tag)'] = (tagCounts['(No Tag)'] || 0) + 1;
                }
            });

            // Limit to top 8
            const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
            const labels = sortedTags.map(x => x[0]);
            const data = sortedTags.map(x => x[1]);

            if (this.skillsChart) {
                this.skillsChart.destroy();
            }

            // Check if Chart is defined (loaded)
            if (typeof Chart !== 'undefined') {
                this.skillsChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: [
                                '#3498db', '#e74c3c', '#2ecc71', '#f1c40f',
                                '#9b59b6', '#34495e', '#1abc9c', '#e67e22'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'right' }
                        }
                    }
                });
            }
        }

        // D. Issues (Low Level)
        const issuesContainer = document.getElementById('list-issues');
        if (issuesContainer) {
            const lowLevel = allLogs.filter(l => l.level && l.level <= 2).slice(0, 5);
            issuesContainer.innerHTML = '';
            if (lowLevel.length === 0) {
                issuesContainer.innerHTML = '<p style="color:#888;">復習が必要な項目はありません。優秀です！</p>';
            } else {
                lowLevel.forEach(l => {
                    const row = document.createElement('div');
                    row.style.cssText = 'border-bottom:1px solid #eee; padding:5px 0; font-size:0.85rem;';
                    row.innerHTML = `
                        <span style="color:#e74c3c;">${'★'.repeat(l.level || 1)}</span>
                        <b>${this.escapeHtml(l.title)}</b>
                    `;
                    issuesContainer.appendChild(row);
                });
            }
        }

        // E. Smart Recommendation
        const recContainer = document.getElementById('smart-recommendation');
        if (recContainer && allLogs.length > 0) {
            // Find random log older than 3 days
            const threeDaysAgo = new Date(); threeDaysAgo.setDate(now.getDate() - 3);
            const candidates = allLogs.filter(l => new Date(l.createdAt) < threeDaysAgo);
            const pool = candidates.length > 0 ? candidates : allLogs;
            const target = pool[Math.floor(Math.random() * pool.length)];

            if (target) {
                recContainer.innerHTML = `
                    <div style="font-size:0.8rem; color:#666;">これ覚えていますか？</div>
                    <div style="font-weight:bold; margin:5px 0;">${this.escapeHtml(target.title)}</div>
                    <div style="font-size:0.8rem; color:#888;">${new Date(target.createdAt).toLocaleDateString()} - ${target.tags ? target.tags.join(', ') : ''}</div>
                `;
            }
        }

        // F. Contribution Graph (GitHub-style calendar)
        this.renderContributionGraph(allLogs);
    },

    renderContributionGraph(allLogs) {
        const container = document.getElementById('contribution-graph');
        if (!container) return;

        // Count logs per day
        const dayCounts = {};
        allLogs.forEach(log => {
            const date = new Date(log.createdAt).toISOString().split('T')[0];
            dayCounts[date] = (dayCounts[date] || 0) + 1;
        });

        // Build 52 weeks of data (past year)
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Start from the nearest past Sunday
        const startDate = new Date(oneYearAgo);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        // Color scale
        const getColor = (count) => {
            if (count === 0) return '#ebedf0';
            if (count === 1) return '#9be9a8';
            if (count === 2) return '#40c463';
            if (count <= 4) return '#30a14e';
            return '#216e39';
        };

        // Dark mode colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const getColorDark = (count) => {
            if (count === 0) return '#161b22';
            if (count === 1) return '#0e4429';
            if (count === 2) return '#006d32';
            if (count <= 4) return '#26a641';
            return '#39d353';
        };

        const colorFn = isDark ? getColorDark : getColor;

        // Build grid (7 rows x ~53 cols)
        let html = '<div style="display:flex; gap:3px;">';

        // Month labels
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        let currentDate = new Date(startDate);
        let lastMonth = -1;

        // Create week columns
        while (currentDate <= today) {
            const weekStart = new Date(currentDate);
            html += '<div style="display:flex; flex-direction:column; gap:3px;">';

            // Month label at top of first week of each month
            if (currentDate.getMonth() !== lastMonth) {
                html += `<div style="font-size:0.65rem; color:#888; height:14px; line-height:14px;">${months[currentDate.getMonth()]}</div>`;
                lastMonth = currentDate.getMonth();
            } else {
                html += '<div style="height:14px;"></div>';
            }

            for (let day = 0; day < 7; day++) {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + day);

                if (d > today) {
                    html += '<div style="width:12px; height:12px;"></div>';
                    continue;
                }

                const dateStr = d.toISOString().split('T')[0];
                const count = dayCounts[dateStr] || 0;
                const color = colorFn(count);
                const tooltip = `${d.toLocaleDateString('ja-JP')}: ${count}件のログ`;

                html += `<div style="width:12px; height:12px; border-radius:2px; background:${color};" title="${tooltip}"></div>`;

                currentDate.setDate(currentDate.getDate() + 1);
            }
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    // Phase 8: Render Snippet List
    renderSnippetList(snippets) {
        const container = this.elements.snippetList;
        if (!container) return;

        if (!snippets || snippets.length === 0) {
            container.innerHTML = '<div class="snippet-empty">💾 まだスニペットがありません。<br>「+ 新規スニペット」でコードを保存しましょう！</div>';
            return;
        }

        // Sort by newest first
        const sorted = [...snippets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = sorted.map(s => {
            // Escape HTML in code
            const escapedCode = this.escapeHtml(s.code);
            const previewLines = s.code.split('\n').slice(0, 8).join('\n');
            const escapedPreview = this.escapeHtml(previewLines);
            const hasMore = s.code.split('\n').length > 8;
            const date = new Date(s.createdAt).toLocaleDateString('ja-JP');

            return `
            <div class="snippet-card" data-snippet-id="${s.id}">
                <div class="snippet-card-header">
                    <h4>
                        <span>${this.escapeHtml(s.title)}</span>
                        <span class="lang-badge">${s.language}</span>
                    </h4>
                    <div class="snippet-actions">
                        <button class="btn-snippet-copy" data-id="${s.id}" title="コピー">📋 コピー</button>
                        <button class="btn-snippet-edit" data-id="${s.id}" title="編集">✏️</button>
                        <button class="btn-snippet-delete" data-id="${s.id}" title="削除">🗑️</button>
                    </div>
                </div>
                <pre class="snippet-code-preview"><code class="language-${s.language}">${escapedPreview}</code>${hasMore ? '\n...' : ''}</pre>
                <div class="snippet-card-footer">${date}</div>
            </div>`;
        }).join('');

        // Syntax highlight all snippets
        container.querySelectorAll('pre code').forEach(block => {
            if (typeof hljs !== 'undefined') {
                hljs.highlightElement(block);
            }
        });

        // Copy buttons
        container.querySelectorAll('.btn-snippet-copy').forEach(btn => {
            btn.addEventListener('click', () => {
                const snippet = snippets.find(s => s.id === btn.dataset.id);
                if (snippet) {
                    navigator.clipboard.writeText(snippet.code).then(() => {
                        btn.textContent = '✅ コピー済';
                        setTimeout(() => btn.textContent = '📋 コピー', 1500);
                    });
                }
            });
        });

        // Edit buttons
        container.querySelectorAll('.btn-snippet-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const snippet = snippets.find(s => s.id === btn.dataset.id);
                if (snippet) {
                    document.getElementById('snippet-edit-id').value = snippet.id;
                    document.getElementById('snippet-modal-title').textContent = 'スニペットを編集';
                    document.getElementById('snippet-title').value = snippet.title;
                    document.getElementById('snippet-language').value = snippet.language;
                    document.getElementById('snippet-code').value = snippet.code;
                    this.elements.modalSnippet.classList.remove('hidden');
                }
            });
        });

        // Delete buttons
        container.querySelectorAll('.btn-snippet-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handlers.onSnippetDelete(btn.dataset.id);
            });
        });
    },


    showProjectView(project) {
        this.elements.dashboardView.classList.add('hidden');
        document.getElementById('review-view').classList.add('hidden');
        this.elements.logListView.classList.remove('hidden');

        // Show Search Bar and Review Button
        document.getElementById('search-bar-container').style.display = 'block';
        document.getElementById('btn-review-mode').style.display = 'inline-block';

        // Show sort dropdown
        const sortDropdown = document.getElementById('log-sort');
        if (sortDropdown) sortDropdown.style.display = 'inline-block';

        this.elements.currentProjectTitle.textContent = project.name;
        this.elements.btnNewLog.disabled = false;

        // Reset tabs to logs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const logsTab = document.querySelector('.tab-btn[data-tab="logs"]');
        if (logsTab) logsTab.classList.add('active');
        const tabLogs = document.getElementById('tab-logs');
        const tabSnippets = document.getElementById('tab-snippets');
        if (tabLogs) tabLogs.classList.remove('hidden');
        if (tabSnippets) tabSnippets.classList.add('hidden');
    },

    showDashboard() {
        this.elements.dashboardView.classList.remove('hidden');
        this.elements.logListView.classList.add('hidden');
        this.elements.currentProjectTitle.textContent = 'Select a Project';
        this.elements.btnNewLog.disabled = true;
        // Also remove active class from list
        const activeItem = this.elements.projectList.querySelector('.active');
        if (activeItem) activeItem.classList.remove('active');
    },

    // Phase 4 Bonus: Review Mode
    showReviewCard(log) {
        // Switch View
        this.elements.logListView.classList.add('hidden');
        this.elements.dashboardView.classList.add('hidden');
        const reviewView = document.getElementById('review-view');
        reviewView.classList.remove('hidden');

        // Reset Card State
        document.getElementById('review-answer-container').classList.add('hidden');
        const btnShow = document.getElementById('btn-show-answer');
        const btnNext = document.getElementById('btn-next-review');
        btnShow.classList.remove('hidden');
        btnNext.classList.add('hidden');

        // Set Content
        document.getElementById('review-title').textContent = log.title;
        document.getElementById('review-type').textContent = log.type;
        document.getElementById('review-content').innerHTML = DOMPurify.sanitize(marked.parse(log.content));

        // Syntax Highlight for Answer
        document.getElementById('review-content').querySelectorAll('pre code').forEach(block => {
            if (block.classList.contains('language-mermaid')) return;
            hljs.highlightElement(block);
        });

        // Extras
        this.renderMarkdownExtras(document.getElementById('review-content'));

        // Event Listeners (Using .onclick to prevent multiple listeners stacking)
        btnShow.onclick = () => {
            document.getElementById('review-answer-container').classList.remove('hidden');
            btnShow.classList.add('hidden');
            btnNext.classList.remove('hidden');
        };

        btnNext.onclick = () => {
            this.handlers.onReview(); // Get another random log
        };

        document.getElementById('btn-close-review').onclick = () => {
            reviewView.classList.add('hidden');
            this.elements.logListView.classList.remove('hidden');
        };
    },

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
