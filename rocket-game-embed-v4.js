class RocketTextGameV4 {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        
        this.options = {
            width: options.width || '100%',
            height: options.height || '400px',
            fontSize: options.fontSize || '11px',
            placeholder: options.placeholder || 'Click here to start the game...',
            initialText: options.initialText || '🚀 Rocket Text Game v4 - Simplified Design\n\nThis version returns to the classic design with enhanced features:\n\n📍 COORDINATES & STATS\nReal-time position, speed, and max speed displayed in the bottom-right corner.\n\n⏱️ DYNAMIC CLOCK\nWhen stopped, clock appears above rocket center. When moving, it drags behind based on acceleration.\n\n🎯 SIMPLE CONTROLS\nClick to activate, arrow keys to control, escape to exit.\n\n🔄 TEXT WRAPPING\nSeamless wrapping in all directions.\n\nThe quick brown fox jumps over the lazy dog. Amazingly few discotheques provide jukeboxes for wizards who make toxic brew for evil queens and jacks. Pack my box with five dozen liquor jugs.',
            ...options
        };
        
        this.rocketMode = false;
        this.rocketX = 0;
        this.rocketY = 0;
        this.rocketSpeed = 0;
        this.rocketAngle = 0;
        this.maxSpeed = 3;
        
        this.points = 0;
        this.safeFlightTime = 0;
        
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.createElements();
        this.setupStyles();
        this.setupEventListeners();
    }
    
    createElements() {
        this.container.innerHTML = `
            <textarea class="rocket-game-textarea" placeholder="${this.options.placeholder}">${this.options.initialText}</textarea>
            <div class="rocket-game-rocket">
                <div class="rocket-game-rocket-symbol">▲</div>
            </div>
            <div class="rocket-game-stats">
                X: 0, Y: 0<br>
                Speed: 0.0<br>
                Max: 3.0
            </div>
            <div class="rocket-game-clock">0</div>
        `;
        
        this.textarea = this.container.querySelector('.rocket-game-textarea');
        this.rocket = this.container.querySelector('.rocket-game-rocket');
        this.stats = this.container.querySelector('.rocket-game-stats');
        this.clock = this.container.querySelector('.rocket-game-clock');
    }
    
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .rocket-game-container {
                position: relative;
                width: ${this.options.width};
                height: ${this.options.height};
                border: 1px solid #ccc;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .rocket-game-textarea {
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
                font-family: 'Courier New', monospace;
                font-size: ${this.options.fontSize};
                padding: 15px;
                box-sizing: border-box;
                resize: none;
                background: transparent;
                position: relative;
                z-index: 1;
                white-space: pre-wrap;
                overflow: auto;
                word-wrap: break-word;
                word-break: break-word;
            }
            
            .rocket-game-rocket {
                position: absolute;
                width: 20px;
                height: 20px;
                pointer-events: none;
                transition: none;
                z-index: 10;
                display: none;
            }
            
            .rocket-game-rocket-symbol {
                font-size: 20px;
                color: #ff4444;
                text-align: center;
                line-height: 20px;
                transform-origin: center;
            }
            
            .rocket-game-stats {
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-family: 'Courier New', monospace;
                font-size: ${this.options.fontSize};
                color: #888;
                text-shadow: 1px 1px 1px rgba(255,255,255,0.8), -1px -1px 1px rgba(0,0,0,0.1);
                z-index: 15;
                background: transparent;
                padding: 5px;
                line-height: 1.4;
            }
            
            .rocket-game-clock {
                position: absolute;
                color: #666;
                font-family: 'Courier New', monospace;
                font-size: ${parseInt(this.options.fontSize) + 1}px;
                font-weight: bold;
                pointer-events: none;
                z-index: 15;
                display: none;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            
            .rocket-game-container.rocket-game-active .rocket-game-textarea {
                pointer-events: none;
            }
        `;
        
        if (!document.querySelector('#rocket-game-styles')) {
            style.id = 'rocket-game-styles';
            document.head.appendChild(style);
        }
        
        this.container.classList.add('rocket-game-container');
    }
    
    setupEventListeners() {
        this.textarea.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleClick(e) {
        if (!this.rocketMode) {
            this.activateRocketMode(e);
        } else {
            this.updateRocketPosition(e);
        }
    }
    
    activateRocketMode(e) {
        this.rocketMode = true;
        this.container.classList.add('rocket-game-active');
        this.rocket.style.display = 'block';
        
        this.rocketSpeed = 0;
        this.points = 0;
        this.safeFlightTime = 0;
        
        this.updateRocketPosition(e);
        this.startGameLoop();
    }
    
    deactivateRocketMode() {
        this.rocketMode = false;
        this.container.classList.remove('rocket-game-active');
        this.rocket.style.display = 'none';
        this.clock.style.display = 'none';
        this.stopGameLoop();
    }
    
    updateRocketPosition(e) {
        const rect = this.textarea.getBoundingClientRect();
        this.rocketX = e.clientX - rect.left;
        this.rocketY = e.clientY - rect.top;
        this.updateRocketDisplay();
    }
    
    handleKeyDown(e) {
        if (this.rocketMode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            this.keys[e.key] = true;
        }
    }
    
    handleKeyUp(e) {
        if (this.rocketMode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            this.keys[e.key] = false;
        }
        
        if (e.key === 'Escape' && this.rocketMode) {
            this.deactivateRocketMode();
        }
    }
    
    startGameLoop() {
        if (!this.animationId) {
            this.gameLoop();
        }
    }
    
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameLoop() {
        this.updateRocket();
        this.checkTextCollision();
        this.updatePoints();
        this.updateRocketDisplay();
        this.updateStats();
        this.updateClock();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    updateRocket() {
        if (this.keys.ArrowLeft) {
            this.rocketAngle = (this.rocketAngle - 5 + 360) % 360;
        }
        if (this.keys.ArrowRight) {
            this.rocketAngle = (this.rocketAngle + 5) % 360;
        }
        
        if (this.keys.ArrowUp) {
            this.rocketSpeed = Math.min(this.rocketSpeed + 0.2, this.maxSpeed);
        }
        if (this.keys.ArrowDown) {
            this.rocketSpeed = Math.max(this.rocketSpeed - 0.2, 0);
        }
        
        const radians = (this.rocketAngle - 90) * Math.PI / 180;
        const deltaX = Math.cos(radians) * this.rocketSpeed;
        const deltaY = Math.sin(radians) * this.rocketSpeed;
        
        const rect = this.textarea.getBoundingClientRect();
        
        let newX = this.rocketX + deltaX;
        let newY = this.rocketY + deltaY;
        
        if (newX < 0) {
            newX = rect.width - 20;
        } else if (newX > rect.width) {
            newX = 0;
        }
        
        if (newY < 0) {
            newY = rect.height - 20;
        } else if (newY > rect.height) {
            newY = 0;
        }
        
        this.rocketX = newX;
        this.rocketY = newY;
    }
    
    checkTextCollision() {
        if (!this.rocketMode) return;
        
        const text = this.textarea.value;
        if (!text) return;
        
        const charPos = this.getCharPositionAt(this.rocketX, this.rocketY);
        if (charPos === null) return;
        
        const char = text[charPos];
        const isSafe = char === ' ' || char === '\t' || char === '\n';
        
        if (!isSafe) {
            this.deactivateRocketMode();
        }
    }
    
    getCharPositionAt(x, y) {
        const rect = this.textarea.getBoundingClientRect();
        
        const style = window.getComputedStyle(this.textarea);
        const fontSize = parseInt(style.fontSize);
        const lineHeight = fontSize * 1.4;
        const charWidth = fontSize * 0.6;
        
        const col = Math.floor(x / charWidth);
        const row = Math.floor(y / lineHeight);
        
        const lines = this.textarea.value.split('\n');
        if (row >= lines.length) return null;
        
        const line = lines[row];
        if (col >= line.length) return null;
        
        let charPos = 0;
        for (let i = 0; i < row; i++) {
            charPos += lines[i].length + 1;
        }
        charPos += col;
        
        return charPos;
    }
    
    updatePoints() {
        if (this.rocketSpeed > 0) {
            this.safeFlightTime += 16;
            this.points = Math.floor(this.safeFlightTime / 100);
        } else {
            this.points = 0;
            this.safeFlightTime = 0;
        }
    }
    
    updateRocketDisplay() {
        this.rocket.style.left = `${this.rocketX - 10}px`;
        this.rocket.style.top = `${this.rocketY - 10}px`;
        this.rocket.querySelector('.rocket-game-rocket-symbol').style.transform = `rotate(${this.rocketAngle}deg)`;
    }
    
    updateStats() {
        this.stats.innerHTML = `X: ${Math.round(this.rocketX)}, Y: ${Math.round(this.rocketY)}<br>Speed: ${this.rocketSpeed.toFixed(1)}<br>Max: ${this.maxSpeed.toFixed(1)}`;
    }
    
    updateClock() {
        if (this.rocketSpeed === 0) {
            this.clock.style.display = 'block';
            this.clock.style.left = `${this.rocketX - 10}px`;
            this.clock.style.top = `${this.rocketY - 30}px`;
        } else {
            const dragDistance = this.rocketSpeed * 20;
            const radians = (this.rocketAngle - 90) * Math.PI / 180;
            const offsetX = Math.cos(radians) * -dragDistance;
            const offsetY = Math.sin(radians) * -dragDistance;
            
            this.clock.style.left = `${this.rocketX + offsetX - 10}px`;
            this.clock.style.top = `${this.rocketY + offsetY - 10}px`;
        }
        
        this.clock.textContent = this.points;
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('[data-rocket-game]');
    containers.forEach(container => {
        new RocketTextGameV4(container.id);
    });
});