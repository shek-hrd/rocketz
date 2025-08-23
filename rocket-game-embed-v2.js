/**
 * Rocket Text Game v2 - Health & Points System
 * Improved collision detection with safe spaces/tabs and health recovery
 */

class RocketTextGameV2 {
    static instances = new Map();
    
    constructor(textareaElement) {
        this.textarea = textareaElement;
        this.container = null;
        this.rocket = null;
        this.healthBar = null;
        this.healthFill = null;
        this.pointsDisplay = null;
        
        this.rocketMode = false;
        this.rocketX = 0;
        this.rocketY = 0;
        this.rocketSpeed = 0;
        this.rocketAngle = 0;
        this.maxSpeed = 5;
        
        this.health = 100;
        this.maxHealth = 100;
        this.points = 0;
        this.safeFlightTime = 0;
        
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        this.animationId = null;
        this.blinkingTimeout = null;
        
        this.init();
    }
    
    static init(textareaId) {
        const textarea = document.getElementById(textareaId);
        if (!textarea) {
            console.error(`Textarea with id "${textareaId}" not found`);
            return null;
        }
        
        if (RocketTextGameV2.instances.has(textareaId)) {
            return RocketTextGameV2.instances.get(textareaId);
        }
        
        const instance = new RocketTextGameV2(textarea);
        RocketTextGameV2.instances.set(textareaId, instance);
        return instance;
    }
    
    init() {
        this.createGameElements();
        this.setupEventListeners();
    }
    
    createGameElements() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'rocket-game-container-v2';
        this.container.style.cssText = `
            position: relative;
            display: inline-block;
            width: 100%;
            height: 100%;
        `;
        
        // Wrap textarea
        this.textarea.parentNode.insertBefore(this.container, this.textarea);
        this.container.appendChild(this.textarea);
        
        // Style textarea
        this.textarea.style.cssText += `
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            background: transparent;
            position: relative;
            z-index: 1;
            white-space: pre;
            overflow: auto;
        `;
        
        // Create rocket
        this.rocket = document.createElement('div');
        this.rocket.className = 'rocket-game-rocket-v2';
        this.rocket.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            pointer-events: none;
            transition: none;
            z-index: 10;
            display: none;
        `;
        
        const rocketSymbol = document.createElement('div');
        rocketSymbol.textContent = '▲';
        rocketSymbol.style.cssText = `
            font-size: 20px;
            color: #ff4444;
            text-align: center;
            line-height: 20px;
            transform-origin: center;
        `;
        this.rocket.appendChild(rocketSymbol);
        
        // Create health bar
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'rocket-game-health-v2';
        this.healthBar.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            width: 100px;
            height: 10px;
            background-color: rgba(200, 200, 200, 0.5);
            border-radius: 5px;
            overflow: hidden;
            z-index: 20;
            display: none;
        `;
        
        this.healthFill = document.createElement('div');
        this.healthFill.style.cssText = `
            height: 100%;
            background-color: #4CAF50;
            transition: width 0.3s ease;
            width: 100%;
        `;
        this.healthBar.appendChild(this.healthFill);
        
        // Create points display
        this.pointsDisplay = document.createElement('div');
        this.pointsDisplay.className = 'rocket-game-points-v2';
        this.pointsDisplay.style.cssText = `
            position: absolute;
            color: #2196F3;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            pointer-events: none;
            z-index: 15;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            display: none;
        `;
        
        // Add styles for blinking and damage
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rocket-blink-v2 {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            
            .rocket-game-rocket-v2.blinking {
                animation: rocket-blink-v2 0.3s infinite;
            }
            
            @keyframes damage-fade-v2 {
                0% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
            
            .rocket-damage-text-v2 {
                position: absolute;
                color: #ff4444;
                font-weight: bold;
                font-size: 12px;
                pointer-events: none;
                z-index: 25;
                animation: damage-fade-v2 1s forwards;
            }
        `;
        document.head.appendChild(style);
        
        this.container.appendChild(this.rocket);
        this.container.appendChild(this.healthBar);
        this.container.appendChild(this.pointsDisplay);
    }
    
    setupEventListeners() {
        this.container.addEventListener('click', (e) => this.handleContainerClick(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('resize', () => this.updateFrameInfo());
    }
    
    handleContainerClick(e) {
        if (!this.rocketMode) {
            this.activateRocketMode(e);
        } else {
            this.updateRocketPosition(e);
        }
    }
    
    activateRocketMode(e) {
        this.rocketMode = true;
        this.textarea.blur();
        this.rocket.style.display = 'block';
        this.healthBar.style.display = 'block';
        this.pointsDisplay.style.display = 'block';
        
        this.health = 100;
        this.points = 0;
        this.safeFlightTime = 0;
        
        this.updateRocketPosition(e);
        this.startGameLoop();
    }
    
    deactivateRocketMode() {
        this.rocketMode = false;
        this.rocket.style.display = 'none';
        this.healthBar.style.display = 'none';
        this.pointsDisplay.style.display = 'none';
        this.stopGameLoop();
        this.textarea.focus();
        
        if (this.blinkingTimeout) {
            clearTimeout(this.blinkingTimeout);
            this.blinkingTimeout = null;
        }
        
        this.rocket.classList.remove('blinking');
    }
    
    updateRocketPosition(e) {
        const rect = this.container.getBoundingClientRect();
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
        this.updatePointsDisplay();
        
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
        
        const rect = this.container.getBoundingClientRect();
        this.rocketX = (this.rocketX + deltaX + rect.width) % rect.width;
        this.rocketY = (this.rocketY + deltaY + rect.height) % rect.height;
    }
    
    checkTextCollision() {
        if (!this.rocketMode) return;
        
        const text = this.textarea.value;
        if (!text) return;
        
        const charPos = this.getCharPositionAt(this.rocketX, this.rocketY);
        if (charPos === null) return;
        
        const char = text[charPos];
        const isSafe = char === ' ' || char === '\t' || char === '\n';
        
        if (isSafe) {
            this.health = Math.min(this.health + 0.5, this.maxHealth);
            this.updateHealthDisplay();
        } else {
            this.takeDamage(2);
        }
    }
    
    getCharPositionAt(x, y) {
        const textarea = this.textarea;
        const rect = textarea.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const relX = x - (rect.left - containerRect.left);
        const relY = y - (rect.top - containerRect.top);
        
        const style = window.getComputedStyle(textarea);
        const fontSize = parseInt(style.fontSize);
        const lineHeight = fontSize * 1.4;
        const charWidth = fontSize * 0.6;
        
        const col = Math.floor(relX / charWidth);
        const row = Math.floor(relY / lineHeight);
        
        const lines = textarea.value.split('\n');
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
    
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthDisplay();
        
        if (this.health <= 30 && !this.rocket.classList.contains('blinking')) {
            this.rocket.classList.add('blinking');
        }
        
        if (this.health <= 0) {
            this.deactivateRocketMode();
        }
    }
    
    updatePoints() {
        if (this.rocketSpeed > 0) {
            this.safeFlightTime += 16;
            this.points = Math.floor(this.safeFlightTime / 100);
        }
    }
    
    updateHealthDisplay() {
        this.healthFill.style.width = `${this.health}%`;
        
        if (this.health > 60) {
            this.healthFill.style.backgroundColor = '#4CAF50';
        } else if (this.health > 30) {
            this.healthFill.style.backgroundColor = '#FF9800';
        } else {
            this.healthFill.style.backgroundColor = '#F44336';
        }
    }
    
    updateRocketDisplay() {
        this.rocket.style.left = `${this.rocketX - 10}px`;
        this.rocket.style.top = `${this.rocketY - 10}px`;
        this.rocket.firstChild.style.transform = `rotate(${this.rocketAngle}deg)`;
    }
    
    updatePointsDisplay() {
        this.pointsDisplay.textContent = this.points;
        
        const distance = 30 + (this.rocketSpeed * 10);
        const radians = (this.rocketAngle - 90) * Math.PI / 180;
        const offsetX = Math.cos(radians) * -distance;
        const offsetY = Math.sin(radians) * -distance;
        
        this.pointsDisplay.style.left = `${this.rocketX + offsetX - 10}px`;
        this.pointsDisplay.style.top = `${this.rocketY + offsetY - 10}px`;
    }
    
    updateFrameInfo() {
        // Update frame info if needed
    }
    
    destroy() {
        this.deactivateRocketMode();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.insertBefore(this.textarea, this.container);
            this.container.parentNode.removeChild(this.container);
        }
        RocketTextGameV2.instances.delete(this.textarea.id);
    }
}

// Auto-initialize on elements with data-rocket-game attribute
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('[data-rocket-game]');
    elements.forEach(el => {
        RocketTextGameV2.init(el.id);
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RocketTextGameV2;
} else if (typeof window !== 'undefined') {
    window.RocketTextGameV2 = RocketTextGameV2;
}