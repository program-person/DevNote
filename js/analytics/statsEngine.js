
export const StatsEngine = {
    /**
     * Calculate comprehensive statistics for the dashboard
     * @param {Object} data - App data state
     * @returns {Object} DashboardStats
     */
    calculateStats(data) {
        const logs = data.logs || [];
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;

        // Basic Counts
        const totalLogs = logs.length;
        const totalReading = logs.filter(l => l.type === 'reading').length;
        const totalCoding = logs.filter(l => l.type === 'coding').length;

        // Time-based calculations
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const weeklyLogs = logs.filter(l => new Date(l.createdAt).getTime() >= startOfWeek).length;
        const monthlyLogs = logs.filter(l => new Date(l.createdAt).getTime() >= startOfMonth).length;

        // Streak Calculation
        const uniqueDays = new Set(
            logs.map(l => new Date(l.createdAt).toDateString())
        );
        let streak = 0;
        let checkDate = new Date();
        while (true) {
            if (uniqueDays.has(checkDate.toDateString())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // If today has no logs yet, check yesterday to continue streak
                if (streak === 0 && checkDate.toDateString() === new Date().toDateString()) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }

        // Language Distribution (Top 5)
        const tagCounts = {};
        logs.forEach(l => {
            if (Array.isArray(l.tags)) {
                l.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        const languages = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));

        // Level Average
        const totalLevel = logs.reduce((sum, l) => sum + (l.level || 0), 0);
        const avgLevel = totalLogs > 0 ? (totalLevel / totalLogs).toFixed(1) : 0;

        return {
            totalLogs,
            weeklyLogs,
            monthlyLogs,
            streak,
            languages,
            avgLevel,
            totalReading,
            totalCoding
        };
    }
};
