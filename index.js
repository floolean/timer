// Timer Manager Class
class Timer {
	constructor(id, name, totalSeconds, color = "blue") {
		this.id = id;
		this.name = name;
		this.totalSeconds = totalSeconds;
		this.remainingSeconds = totalSeconds;
		this.isRunning = false;
		this.startTime = null;
		this.pausedTime = null;
		this.intervalId = null;
		this.hasAlerted = false;
		this.color = color;
	}

	start() {
		if (this.isRunning) return;
		this.isRunning = true;
		this.startTime =
			Date.now() - (this.totalSeconds - this.remainingSeconds) * 1000;
		this.tick();
	}

	pause() {
		if (!this.isRunning) return;

		this.isRunning = false;

		if (this.intervalId) {
			clearTimeout(this.intervalId);
			this.intervalId = null;
		}
	}

	reset() {
		this.pause();
		this.remainingSeconds = this.totalSeconds;
		this.hasAlerted = false;
	}

	tick() {
		// Stop immediately if timer was paused
		if (!this.isRunning) {
			return;
		}

		// Calculate elapsed time from absolute timestamp
		const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

		this.remainingSeconds = this.totalSeconds - elapsed;

		// Immediately update UI
		app.render();

		// Trigger alert once when hitting zero
		if (this.remainingSeconds <= 0 && !this.hasAlerted) {
			this.hasAlerted = true;

			app.playThrottledAlert();
			app.showNotification(this);
		}

		// Continue overtime alerting
		if (this.remainingSeconds < 0) {
			app.playThrottledAlert();
		}

		// Schedule next tick
		this.intervalId = setTimeout(() => this.tick(), 1000);
	}

	getStatus() {
		if (this.remainingSeconds <= 0) {
			return "blinking";
		}
		return this.isRunning ? "active" : "idle";
	}

	getDisplayTime() {
		const absSeconds = Math.abs(this.remainingSeconds);
		const hours = Math.floor(absSeconds / 3600);
		const minutes = Math.floor((absSeconds % 3600) / 60);
		const seconds = absSeconds % 60;
		const prefix = this.remainingSeconds < 0 ? "-" : "";
		return `${prefix}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			totalSeconds: this.totalSeconds,
			remainingSeconds: this.remainingSeconds,
			isRunning: this.isRunning,
			startTime: this.startTime,
			color: this.color,
		};
	}

	static fromJSON(data) {
		const timer = new Timer(
			data.id,
			data.name,
			data.totalSeconds,
			data.color || "blue",
		);
		timer.remainingSeconds = data.remainingSeconds;
		timer.isRunning = !!data.isRunning;
		if (timer.isRunning && data.startTime) {
			timer.startTime = data.startTime;
		} else if (timer.isRunning) {
			timer.startTime =
				Date.now() - (timer.totalSeconds - timer.remainingSeconds) * 1000;
		}
		return timer;
	}
}

// App Class
class TimerApp {
	constructor() {
		this.timers = [];
		this.nextId = 1;
		this.audioContext = null;
		this.selectedColor = "blue";
		this.soundEnabled = true;
		this.lastAlertTime = 0;
		this.wakeLock = null;
		this.init();
	}

	init() {
		this.loadSettings();
		this.loadTimers();
		this.attachEventListeners();
		this.requestNotificationPermission();
		this.requestWakeLock();
		this.render();
	}

	attachEventListeners() {
		document
			.getElementById("addTimerBtn")
			.addEventListener("click", () => this.addTimer());

		document
			.getElementById("toggleAddBtn")
			.addEventListener("click", () => this.toggleAddPanel());
		document
			.getElementById("soundToggleBtn")
			.addEventListener("click", () => this.toggleSound());
		this.updateSoundButton();

		// Color picker event listeners
		document.querySelectorAll(".color-option").forEach((button) => {
			button.addEventListener("click", (e) => {
				e.preventDefault();
				this.selectColor(e.target.dataset.color);
			});
		});

		if (this.selectedColor) {
			this.selectColor(this.selectedColor);
		}

		// Use event delegation for timer buttons and cards
		const handleButtonClick = (e) => {
			e.preventDefault();
			e.stopPropagation();

			const button = e.target.closest("button");
			const card = e.target.closest(".timer-card");

			if (button && !button.disabled) {
				const timerId = parseInt(button.dataset.timerId);
				const action = button.dataset.action;

				if (action === "delete") {
					this.deleteTimer(timerId);
				} else if (action === "action") {
					const timer = this.timers.find((t) => t.id === timerId);
					if (!timer) return;

					const status = timer.getStatus();
					const isTimedOut = status === "blinking";

					if (isTimedOut) {
						this.resetTimer(timerId);
					} else {
						this.toggleTimer(timerId);
					}
				} else if (action === "reset") {
					this.resetTimer(timerId);
				}
			} else if (card) {
				const timerId = parseInt(card.dataset.timerId);
				const timer = this.timers.find((t) => t.id === timerId);
				if (!timer) return;

				if (timer.remainingSeconds <= 0) {
					this.resetTimer(timerId);
				} else if (
					!timer.isRunning &&
					timer.remainingSeconds === timer.totalSeconds
				) {
					this.toggleTimer(timerId);
				}
			}
		};

		const timersList = document.getElementById("timersList");
		timersList.addEventListener("click", handleButtonClick);
		timersList.addEventListener("touchend", handleButtonClick);

		document.getElementById("timerName").addEventListener("keypress", (e) => {
			if (e.key === "Enter") this.addTimer();
		});

		document.getElementById("timerHours").addEventListener("keypress", (e) => {
			if (e.key === "Enter") this.addTimer();
		});

		document
			.getElementById("timerMinutes")
			.addEventListener("keypress", (e) => {
				if (e.key === "Enter") this.addTimer();
			});

		document
			.getElementById("timerSeconds")
			.addEventListener("keypress", (e) => {
				if (e.key === "Enter") this.addTimer();
			});

		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				this.requestWakeLock();
			}
		});

		document.addEventListener("click", () => this.requestWakeLock());
		document.addEventListener("touchend", () => this.requestWakeLock());
	}

	selectColor(color) {
		if (!color) return;
		this.selectedColor = color;
		document.querySelectorAll(".color-option").forEach((btn) => {
			btn.classList.toggle("selected", btn.dataset.color === color);
		});
	}

	requestNotificationPermission() {
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission().catch(() => {});
		}
	}

	toggleSound() {
		this.soundEnabled = !this.soundEnabled;
		this.saveSettings();
		this.updateSoundButton();
	}

	updateSoundButton() {
		const button = document.getElementById("soundToggleBtn");
		if (!button) return;
		button.textContent = this.soundEnabled ? "Sound On" : "Sound Off";
		button.classList.toggle("active", this.soundEnabled);
		button.setAttribute("aria-pressed", String(this.soundEnabled));
	}

	saveSettings() {
		try {
			localStorage.setItem(
				"timerAppSettings",
				JSON.stringify({
					soundEnabled: this.soundEnabled,
				}),
			);
		} catch (e) {
			console.error("Error saving settings", e);
		}
	}

	loadSettings() {
		try {
			const settings = localStorage.getItem("timerAppSettings");
			if (!settings) return;
			const data = JSON.parse(settings);
			if (typeof data.soundEnabled === "boolean") {
				this.soundEnabled = data.soundEnabled;
			}
		} catch (e) {
			console.error("Error loading settings", e);
		}
	}

	initAudioContext() {
		if (!window.AudioContext && !window.webkitAudioContext) {
			return;
		}

		if (!this.audioContext) {
			try {
				const AudioContext = window.AudioContext || window.webkitAudioContext;
				this.audioContext = new AudioContext();
			} catch (e) {
				console.log("AudioContext initialization failed", e);
				return;
			}
		}

		if (this.audioContext.state === "suspended") {
			this.audioContext.resume().catch(() => {});
		}
	}

	async requestWakeLock() {
		if (!("wakeLock" in navigator)) {
			return;
		}

		try {
			if (!this.wakeLock) {
				this.wakeLock = await navigator.wakeLock.request("screen");
				this.wakeLock.addEventListener("release", () => {
					this.wakeLock = null;
				});
			}
		} catch (e) {
			console.log("Wake lock request failed", e);
		}
	}

	async releaseWakeLock() {
		if (this.wakeLock) {
			try {
				await this.wakeLock.release();
			} catch (e) {
				console.log("Wake lock release failed", e);
			}
			this.wakeLock = null;
		}
	}

	showNotification(timer) {
		if (!("Notification" in window) || Notification.permission !== "granted") {
			return;
		}

		const title = `${timer.name} finished`;
		const options = {
			body:
				timer.remainingSeconds < 0
					? `Overtime ${timer.getDisplayTime()}`
					: `Timer "${timer.name}" is up!`,
			tag: `timer-${timer.id}`,
			renotify: true,
			silent: true,
		};

		if (navigator.serviceWorker && navigator.serviceWorker.ready) {
			navigator.serviceWorker.ready
				.then((reg) => {
					if (reg && reg.showNotification) {
						reg.showNotification(title, options).catch(() => {
							new Notification(title, options);
						});
					}
				})
				.catch(() => {
					new Notification(title, options);
				});
		} else {
			new Notification(title, options);
		}
	}

	addTimer() {
		const name = document.getElementById("timerName").value.trim() || "Unnamed";
		const hours = Math.max(
			0,
			parseInt(document.getElementById("timerHours").value) || 0,
		);
		const minutes = Math.max(
			0,
			Math.min(
				59,
				parseInt(document.getElementById("timerMinutes").value) || 0,
			),
		);
		const seconds = Math.max(
			0,
			Math.min(
				59,
				parseInt(document.getElementById("timerSeconds").value) || 0,
			),
		);

		if (hours === 0 && minutes === 0 && seconds === 0) {
			alert("Please set a duration");
			return;
		}

		const totalSeconds = hours * 3600 + minutes * 60 + seconds;
		const timer = new Timer(
			this.nextId++,
			name,
			totalSeconds,
			this.selectedColor,
		);
		this.timers.push(timer);

		// Reset inputs
		document.getElementById("timerName").value = "";
		document.getElementById("timerHours").value = "0";
		document.getElementById("timerMinutes").value = "1";
		document.getElementById("timerSeconds").value = "0";
		document.getElementById("timerName").focus();

		this.saveTimers();
		this.render();
		this.closeAddPanel();
	}

	toggleTimer(id) {
		const timer = this.timers.find((t) => t.id === id);
		if (!timer) return;

		if (timer.isRunning) {
			timer.pause();
		} else {
			// If timer is at zero or negative, let it continue into overtime
			this.initAudioContext();
			timer.start();
		}

		// Don't render immediately to avoid interfering with button clicks
		setTimeout(() => this.render(), 10);
	}

	resetTimer(id) {
		const timer = this.timers.find((t) => t.id === id);
		if (timer) {
			timer.reset();
			this.saveTimers();
			// Don't render immediately to avoid interfering with button clicks
			setTimeout(() => this.render(), 10);
		}
	}

	deleteTimer(id) {
		const timer = this.timers.find((t) => t.id === id);
		if (timer) {
			timer.pause();
			this.timers = this.timers.filter((t) => t.id !== id);
			this.saveTimers();
			this.render();
		}
	}

	toggleAddPanel() {
		const panel = document.getElementById("addTimerSection");
		if (panel.classList.contains("active")) {
			this.closeAddPanel();
		} else {
			this.openAddPanel();
		}
	}

	openAddPanel() {
		const panel = document.getElementById("addTimerSection");
		panel.classList.add("active");
		document.getElementById("timerName").focus();
	}

	closeAddPanel() {
		const panel = document.getElementById("addTimerSection");
		panel.classList.remove("active");
	}

	playThrottledAlert() {
		if (!this.soundEnabled) {
			return;
		}

		if (Date.now() - this.lastAlertTime >= 5000) {
			this.lastAlertTime = Date.now();
			this.playAlert();
		}
	}

	playAlert() {
		// Try to create sound with Web Audio API
		if (!this.audioContext) {
			try {
				const AudioContext = window.AudioContext || window.webkitAudioContext;
				this.audioContext = new AudioContext();
			} catch (e) {
				console.log("Web Audio API not supported");
				return;
			}
		}

		try {
			const now = this.audioContext.currentTime;
			// Three quick beeps (lower frequency)
			this.playBeep(520, 300, now, "square");
			this.playBeep(520, 500, now + 0.15, "square");
			//this.playBeep(880, 100, now + 0.2, "square");
		} catch (e) {
			console.log("Error playing alert", e);
		}
	}

	playBeep(frequency, duration, startTime, type = "sine") {
		try {
			const ctx = this.audioContext;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.connect(gain);
			gain.connect(ctx.destination);

			osc.frequency.value = frequency;
			osc.type = type;

			gain.gain.setValueAtTime(0.001, startTime);
			gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.01);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				startTime + duration / 1000,
			);

			osc.start(startTime);
			osc.stop(startTime + duration / 1000);
		} catch (e) {
			console.log("Error playing beep", e);
		}
	}

	playFallbackAlert() {
		// Fallback: try to play system beep sound
		try {
			const response = new AudioContext().createMediaElementAudioSource(
				new Audio(
					"data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==",
				),
			);
		} catch (e) {
			// Silent fallback
		}
	}

	saveTimers() {
		const data = this.timers.map((t) => t.toJSON());
		localStorage.setItem("timers", JSON.stringify(data));
	}

	loadTimers() {
		try {
			const data = localStorage.getItem("timers");

			if (data) {
				const timers = JSON.parse(data);

				this.timers = timers.map((t) => Timer.fromJSON(t));

				this.nextId = Math.max(...this.timers.map((t) => t.id), 0) + 1;

				this.timers.forEach((timer) => {
					if (timer.isRunning) {
						// Recalculate immediately
						const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);

						timer.remainingSeconds = timer.totalSeconds - elapsed;

						// IMPORTANT:
						// restart ticking loop explicitly
						timer.intervalId = setTimeout(() => timer.tick(), 1000);
					}
				});

				// Immediate refresh after restore
				this.render();
			}
		} catch (e) {
			console.error("Error loading timers", e);
		}
	}

	render() {
		const timersList = document.getElementById("timersList");
		const emptyState = document.getElementById("emptyState");

		if (this.timers.length === 0) {
			timersList.innerHTML = "";
			emptyState.style.display = "flex";
			return;
		}

		emptyState.style.display = "none";

		// Check if we need to recreate the HTML or just update displays
		const existingCards = timersList.querySelectorAll(".timer-card");
		const needsFullRender =
			existingCards.length !== this.timers.length ||
			!Array.from(existingCards).every((card, index) => {
				const timerId = parseInt(card.dataset.timerId);
				return timerId === this.timers[index]?.id;
			});

		if (needsFullRender) {
			timersList.innerHTML = this.timers
				.map((timer) => {
					const status = timer.getStatus();
					const isTimedOut = status === "blinking";
					const buttonLabel = isTimedOut
						? "Reset"
						: timer.isRunning
							? "Pause"
							: "Start";
					const buttonClass = isTimedOut
						? "btn-reset"
						: timer.isRunning
							? "btn-pause"
							: "btn-start";
					const style = `--timer-color: var(--color-${timer.color}); --timer-color-rgb: var(--color-${timer.color}-rgb);`;

					return `
                <div class="timer-card ${status}" data-timer-id="${timer.id}" style="${style}">
                    <button class="timer-delete-btn" data-action="delete" data-timer-id="${timer.id}" title="Delete">✕</button>
                    <div class="timer-strip"></div>
                    <div class="timer-info">
                        <div class="timer-name">${this.escapeHtml(timer.name)}</div>
                        <div class="timer-display" data-timer-display="${timer.id}">${timer.getDisplayTime()}</div>
                    </div>
                    <div class="timer-sidebar">
                        <button class="timer-action-btn ${buttonClass}" data-action="action" data-timer-id="${timer.id}">${buttonLabel}</button>
                        <button class="timer-reset-btn" data-action="reset" data-timer-id="${timer.id}" ${timer.isRunning ? "disabled" : ""}>RESET</button>
                    </div>
                </div>
                `;
				})
				.join("");
		} else {
			this.timers.forEach((timer) => {
				const card = timersList.querySelector(`[data-timer-id="${timer.id}"]`);
				if (card) {
					const display = card.querySelector(".timer-display");
					const actionButton = card.querySelector(".timer-action-btn");
					const resetButton = card.querySelector(".timer-reset-btn");
					const name = card.querySelector(".timer-name");

					if (display) {
						display.textContent = timer.getDisplayTime();
					}

					const status = timer.getStatus();
					card.className = `timer-card ${status}`;
					card.style.setProperty(
						"--timer-color",
						`var(--color-${timer.color})`,
					);
					card.style.setProperty(
						"--timer-color-rgb",
						`var(--color-${timer.color}-rgb)`,
					);

					const isTimedOut = status === "blinking";
					const buttonLabel = isTimedOut
						? "Reset"
						: timer.isRunning
							? "Pause"
							: "Start";
					const buttonClass = isTimedOut
						? "btn-reset"
						: timer.isRunning
							? "btn-pause"
							: "btn-start";

					if (actionButton) {
						actionButton.textContent = buttonLabel;
						actionButton.className = `timer-action-btn ${buttonClass}`;
					}
					if (resetButton) {
						resetButton.disabled = timer.isRunning;
					}
				}
			});
		}

		this.saveTimers();
	}

	escapeHtml(text) {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}
}

// Initialize app
const app = new TimerApp();
