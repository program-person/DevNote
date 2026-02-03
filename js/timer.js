export const TimerModule = {
    timeLeft: 1500, // 25 minutes in seconds
    isRunning: false,
    intervalId: null,
    elements: null,

    init(displayElement, startBtn, resetBtn) {
        this.elements = {
            display: displayElement,
            start: startBtn,
            reset: resetBtn
        };

        this.updateDisplay();

        this.elements.start.addEventListener('click', () => this.toggle());
        this.elements.reset.addEventListener('click', () => this.reset());
    },

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.elements.start.textContent = '⏸'; // Pause icon
        this.elements.start.style.background = '#f1c40f'; // Yellow for pause

        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    },

    stop() {
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.elements.start.textContent = '▶';
        this.elements.start.style.background = '#2ecc71';
    },

    reset() {
        this.stop();
        this.timeLeft = 1500;
        this.updateDisplay();
    },

    tick() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.updateDisplay();
        } else {
            this.complete();
        }
    },

    complete() {
        this.stop();

        // Simple Audio Notification (Beep)
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880; // A5
            osc.start();
            setTimeout(() => osc.stop(), 500);
        } catch (e) {
            console.warn('AudioContext not supported');
        }

        alert('⏰ 25分経過しました！\n集中お疲れ様でした。作業ログを残しましょう。');
    },

    updateDisplay() {
        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        this.elements.display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
};
