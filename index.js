// Timer Manager Class
class Timer {
    constructor(id, name, totalSeconds, color = 'blue') {
        this.id = id;
        this.name = name;
        this.totalSeconds = totalSeconds;
        this.remainingSeconds = totalSeconds;
        this.isRunning = false;
        this.startTime = null;
        this.pausedTime = null;
        this.intervalId = null;
        this.hasAlerted = false;
        this.isAcknowledged = false;
        this.color = color;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = Date.now() - (this.totalSeconds - this.remainingSeconds) * 1000;
        this.tick();
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.intervalId) clearInterval(this.intervalId);
    }

    reset() {
        this.pause();
        this.remainingSeconds = this.totalSeconds;
        this.hasAlerted = false;
        this.isAcknowledged = false;
    }

    tick() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.remainingSeconds = this.totalSeconds - elapsed;

        // Trigger alert once when hitting zero
        if (this.remainingSeconds <= 0 && !this.hasAlerted) {
            this.hasAlerted = true;
            app.playAlert();
            // Force a render when timer elapses to update status
            app.render();
        }

        // Continue ticking if timer is still running (allows negative/overtime)
        if (this.isRunning) {
            this.intervalId = setTimeout(() => this.tick(), 100);
        }
    }

    getStatus() {
        if (this.remainingSeconds < 0) {
            return this.isAcknowledged ? 'acknowledged' : 'blinking';
        }
        if (this.remainingSeconds === 0) {
            return this.isAcknowledged ? 'acknowledged' : 'blinking';
        }
        return this.isRunning ? 'active' : 'idle';
    }

    getDisplayTime() {
        const absSeconds = Math.abs(this.remainingSeconds);
        const hours = Math.floor(absSeconds / 3600);
        const minutes = Math.floor((absSeconds % 3600) / 60);
        const seconds = absSeconds % 60;
        const prefix = this.remainingSeconds < 0 ? '-' : '';
        return `${prefix}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            totalSeconds: this.totalSeconds,
            remainingSeconds: this.remainingSeconds,
            isRunning: false, // Don't persist running state
            isAcknowledged: this.isAcknowledged,
            color: this.color
        };
    }

    static fromJSON(data) {
        const timer = new Timer(data.id, data.name, data.totalSeconds, data.color || 'blue');
        timer.remainingSeconds = data.remainingSeconds;
        timer.isAcknowledged = data.isAcknowledged || false;
        return timer;
    }
}

// App Class
class TimerApp {
    constructor() {
        this.timers = [];
        this.nextId = 1;
        this.audioContext = null;
        this.renderScheduled = false;
        this.selectedColor = 'blue';
        this.init();
    }

    init() {
        this.loadTimers();
        this.attachEventListeners();
        this.render();
    }

    attachEventListeners() {
        document.getElementById('addTimerBtn').addEventListener('click', () => this.addTimer());
        
        document.getElementById('toggleAddBtn').addEventListener('click', () => this.toggleAddPanel());

        // Color picker event listeners
        document.querySelectorAll('.color-option').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectColor(e.target.dataset.color);
            });
        });

        // Use event delegation for timer buttons - handle both click and touch
        const handleButtonClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('button');
            if (!button) return;
            
            const timerId = parseInt(button.dataset.timerId);
            const action = button.dataset.action;
            
            if (action === 'delete') {
                this.deleteTimer(timerId);
            } else if (action === 'action') {
                const timer = this.timers.find(t => t.id === timerId);
                if (!timer) return;
                
                const status = timer.getStatus();
                const isTimedOut = status === 'blinking' || status === 'acknowledged';
                
                if (isTimedOut) {
                    if (timer.isAcknowledged) {
                        this.resetTimer(timerId);
                    } else {
                        this.acknowledgeTimer(timerId);
                    }
                } else {
                    this.toggleTimer(timerId);
                }
            }
        };

        const timersList = document.getElementById('timersList');
        timersList.addEventListener('click', handleButtonClick);
        timersList.addEventListener('touchend', handleButtonClick);

        document.getElementById('timerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTimer();
        });

        document.getElementById('timerHours').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTimer();
        });

        document.getElementById('timerMinutes').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTimer();
        });

        document.getElementById('timerSeconds').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTimer();
        });
    }

    addTimer() {
        const name = document.getElementById('timerName').value.trim() || 'Unnamed';
        const hours = Math.max(0, parseInt(document.getElementById('timerHours').value) || 0);
        const minutes = Math.max(0, Math.min(59, parseInt(document.getElementById('timerMinutes').value) || 0));
        const seconds = Math.max(0, Math.min(59, parseInt(document.getElementById('timerSeconds').value) || 0));
        
        if (hours === 0 && minutes === 0 && seconds === 0) {
            alert('Please set a duration');
            return;
        }

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        const timer = new Timer(this.nextId++, name, totalSeconds);
        this.timers.push(timer);
        
        // Reset inputs
        document.getElementById('timerName').value = '';
        document.getElementById('timerHours').value = '0';
        document.getElementById('timerMinutes').value = '1';
        document.getElementById('timerSeconds').value = '0';
        document.getElementById('timerName').focus();

        this.saveTimers();
        this.render();
        this.closeAddPanel();
    }

    toggleTimer(id) {
        const timer = this.timers.find(t => t.id === id);
        if (!timer) return;

        if (timer.isRunning) {
            timer.pause();
        } else {
            // If timer is at zero or negative, let it continue into overtime
            // Pause all other timers
            this.timers.forEach(t => {
                if (t.id !== id && t.isRunning) {
                    t.pause();
                }
            });
            timer.start();
        }

        // Don't render immediately to avoid interfering with button clicks
        setTimeout(() => this.render(), 10);
    }

    resetTimer(id) {
        const timer = this.timers.find(t => t.id === id);
        if (timer) {
            timer.reset();
            this.saveTimers();
            // Don't render immediately to avoid interfering with button clicks
            setTimeout(() => this.render(), 10);
        }
    }

    deleteTimer(id) {
        const timer = this.timers.find(t => t.id === id);
        if (timer) {
            timer.pause();
            this.timers = this.timers.filter(t => t.id !== id);
            this.saveTimers();
            this.render();
        }
    }

    acknowledgeTimer(id) {
        const timer = this.timers.find(t => t.id === id);
        if (timer) {
            timer.isAcknowledged = true;
            this.saveTimers();
            // Don't render immediately to avoid interfering with button clicks
            setTimeout(() => this.render(), 10);
        }
    }

    toggleAddPanel() {
        const panel = document.getElementById('addTimerSection');
        if (panel.classList.contains('active')) {
            this.closeAddPanel();
        } else {
            this.openAddPanel();
        }
    }

    openAddPanel() {
        const panel = document.getElementById('addTimerSection');
        panel.classList.add('active');
        document.getElementById('timerName').focus();
    }

    closeAddPanel() {
        const panel = document.getElementById('addTimerSection');
        panel.classList.remove('active');
    }

    playAlert() {
        // Try to create sound with Web Audio API
        if (!this.audioContext) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (e) {
                console.log('Web Audio API not supported');
                return;
            }
        }

        // Play a single beep sequence
        try {
            this.playBeep(800, 150);
            setTimeout(() => this.playBeep(800, 150), 200);
            setTimeout(() => this.playBeep(1000, 200), 400);
        } catch (e) {
            console.log('Error playing alert', e);
        }
    }

    playBeep(frequency, duration) {
        try {
            const ctx = this.audioContext;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = frequency;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration / 1000);
        } catch (e) {
            console.log('Error playing beep', e);
        }
    }

    playFallbackAlert() {
        // Fallback: try to play system beep sound
        try {
            const response = new AudioContext().createMediaElementAudioSource(
                new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==')
            );
        } catch (e) {
            // Silent fallback
        }
    }

    saveTimers() {
        const data = this.timers.map(t => t.toJSON());
        localStorage.setItem('timers', JSON.stringify(data));
    }

    loadTimers() {
        try {
            const data = localStorage.getItem('timers');
            if (data) {
                const timers = JSON.parse(data);
                this.timers = timers.map(t => Timer.fromJSON(t));
                this.nextId = Math.max(...this.timers.map(t => t.id), 0) + 1;
            }
        } catch (e) {
            console.error('Error loading timers', e);
        }
    }

    render() {
        const timersList = document.getElementById('timersList');
        const emptyState = document.getElementById('emptyState');

        if (this.timers.length === 0) {
            timersList.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        
        // Check if we need to recreate the HTML or just update displays
        const existingCards = timersList.querySelectorAll('.timer-card');
        const needsFullRender = existingCards.length !== this.timers.length || 
            !Array.from(existingCards).every((card, index) => {
                const timerId = parseInt(card.dataset.timerId);
                return timerId === this.timers[index]?.id;
            });

        if (needsFullRender) {
            // Full render for new/changed timers
            timersList.innerHTML = this.timers.map(timer => {
                const status = timer.getStatus();
                const isTimedOut = status === 'blinking' || status === 'acknowledged';
                const buttonLabel = isTimedOut ? (timer.isAcknowledged ? 'Reset' : 'Ack') : (timer.isRunning ? 'Pause' : 'Start');
                const buttonClass = isTimedOut ? (timer.isAcknowledged ? 'btn-reset' : 'btn-ack') : (timer.isRunning ? 'btn-pause' : 'btn-start');

                return `
                <div class="timer-card ${status}" data-timer-id="${timer.id}">
                    <button class="timer-delete-btn" data-action="delete" data-timer-id="${timer.id}" title="Delete">✕</button>
                    
                    <div class="timer-header">
                        <div class="timer-name">${this.escapeHtml(timer.name)}</div>
                    </div>
                    
                    <div class="timer-display" data-timer-display="${timer.id}">${timer.getDisplayTime()}</div>
                    
                    <button class="timer-action-btn ${buttonClass}" data-action="action" data-timer-id="${timer.id}">
                        ${buttonLabel}
                    </button>
                </div>
                `;
            }).join('');
        } else {
            // Just update the displays and statuses for existing timers
            this.timers.forEach(timer => {
                const card = timersList.querySelector(`[data-timer-id="${timer.id}"]`);
                if (card) {
                    const display = card.querySelector('.timer-display');
                    const button = card.querySelector('.timer-action-btn');
                    
                    // Update display time
                    display.textContent = timer.getDisplayTime();
                    
                    // Update card status
                    const status = timer.getStatus();
                    card.className = `timer-card ${status}`;
                    
                    // Update button
                    const isTimedOut = status === 'blinking' || status === 'acknowledged';
                    const buttonLabel = isTimedOut ? (timer.isAcknowledged ? 'Reset' : 'Ack') : (timer.isRunning ? 'Pause' : 'Start');
                    const buttonClass = isTimedOut ? (timer.isAcknowledged ? 'btn-reset' : 'btn-ack') : (timer.isRunning ? 'btn-pause' : 'btn-start');
                    
                    button.textContent = buttonLabel;
                    button.className = `timer-action-btn ${buttonClass}`;
                }
            });
        }

        // Schedule next render only for running timers
        // Blinking timers don't need frequent updates since they show static time
        if (this.timers.some(t => t.isRunning) && !this.renderScheduled) {
            this.renderScheduled = true;
            setTimeout(() => {
                this.renderScheduled = false;
                this.render();
            }, 50);
        }

        this.saveTimers();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
const app = new TimerApp();
