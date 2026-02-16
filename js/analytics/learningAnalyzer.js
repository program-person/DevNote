
export const LearningAnalyzer = {
    /**
     * Calculate Forget Score based on Ebbinghaus Forgetting Curve (Simplified)
     * Score: higher means more urgent to review
     * Formula: DaysSinceReview * (6 - UnderstandingLevel)
     * 
     * @param {Object} log - The log object
     * @returns {number} forgetScore
     */
    calculateForgetScore(log) {
        const now = new Date();
        const lastReview = log.lastReviewedAt ? new Date(log.lastReviewedAt) : new Date(log.createdAt);
        const diffTime = Math.abs(now - lastReview);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Default understanding is 3 if undefined
        const understanding = log.understanding || 3;

        // Multiplier: 
        // Level 1 (Poor) -> 5x speed
        // Level 5 (Perfect) -> 1x speed
        const multiplier = 6 - understanding;

        return diffDays * multiplier;
    },

    /**
     * Get logs sorted by review priority
     * @param {Array} logs 
     * @param {number} limit 
     * @returns {Array} Sorted logs
     */
    getReviewQueue(logs, limit = 10) {
        return logs
            .map(log => ({
                ...log,
                forgetScore: this.calculateForgetScore(log)
            }))
            .sort((a, b) => b.forgetScore - a.forgetScore) // Descending (High score first)
            .slice(0, limit);
    },

    /**
     * Calculate next review date based on understanding
     * @param {number} understanding (1-5)
     * @returns {string} ISO Date string
     */
    calculateNextReview(understanding) {
        const now = new Date();
        let intervalDays = 1;

        // Simple Spaced Repetition Intervals
        switch (parseInt(understanding)) {
            case 1: intervalDays = 1; break;
            case 2: intervalDays = 3; break;
            case 3: intervalDays = 7; break;
            case 4: intervalDays = 14; break;
            case 5: intervalDays = 30; break;
            default: intervalDays = 7;
        }

        now.setDate(now.getDate() + intervalDays);
        return now.toISOString();
    }
};
