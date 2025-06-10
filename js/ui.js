/**
 * UI class to handle game interface elements
 */
class UI {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.blockSelector = null;
        this.crosshair = null;
        this.controlsInfo = null;
        this.hud = null;
        this.mobileControls = null;
        this.gameMenu = null;
        this.settingsMenu = null;
        this.isPaused = false;
        
        // Initialize UI
        this.init();
    }

    /**
     * Initialize UI elements
     */
    init() {
        // Create UI container
        this.container = document.createElement('div');
        this.container.className = 'ui-container';
        document.body.appendChild(this.container);
        
        // Set up game menu
        this.setupGameMenu();
        
        // Create crosshair
        this.createCrosshair();
        
        // Create block selector
        this.createBlockSelector();
        
        // Create controls info
        this.createControlsInfo();
        
        // Create HUD
        this.createHUD();
        
        // Create pause button
        this.createPauseButton();
        
        // Create mobile controls
        this.createMobileControls();
        
        // Check if device is mobile
        this.checkMobile();
        
        // Listen for window resize
        window.addEventListener('resize', () => this.checkMobile());
    }
    
    /**
     * Set up the game menu
     */
    setupGameMenu() {
        // Get the game menu element
        this.gameMenu = document.getElementById('game-menu');
        
        // Get the start game button
        const startButton = document.getElementById('start-game');
        startButton.addEventListener('click', () => {
            this.hideGameMenu();
            this.game.start();
            document.body.requestPointerLock();
        });
        
        // Get the settings button
        const settingsButton = document.getElementById('settings-button');
        settingsButton.addEventListener('click', () => {
            this.showSettingsMenu();
        });
        
        // Create settings menu
        this.createSettingsMenu();
    }
    
    /**
     * Create settings menu
     */
    createSettingsMenu() {
        // Create settings menu element
        this.settingsMenu = document.createElement('div');
        this.settingsMenu.className = 'settings-menu';
        
        // Add settings content
        this.settingsMenu.innerHTML = `
            <h2>Settings</h2>
            
            <div class="settings-group">
                <label class="settings-label" for="render-distance">Render Distance</label>
                <input type="range" id="render-distance" class="settings-slider" min="1" max="10" value="5">
            </div>
            
            <div class="settings-group">
                <label class="settings-label" for="mouse-sensitivity">Mouse Sensitivity</label>
                <input type="range" id="mouse-sensitivity" class="settings-slider" min="1" max="10" value="5">
            </div>
            
            <div class="settings-group">
                <label class="settings-label">Mouse Smoothing</label>
                <div class="toggle-container">
                    <input type="checkbox" id="mouse-smoothing" class="settings-toggle" checked>
                    <label for="mouse-smoothing" class="toggle-label"></label>
                </div>
            </div>
            
            <div class="settings-group">
                <label class="settings-label">Head Bobbing</label>
                <div class="toggle-container">
                    <input type="checkbox" id="head-bobbing" class="settings-toggle" checked>
                    <label for="head-bobbing" class="toggle-label"></label>
                </div>
            </div>
            
            <button id="back-button" class="menu-button back-button">Back</button>
        `;
        
        // Add to game menu
        this.gameMenu.querySelector('.menu-content').appendChild(this.settingsMenu);
        
        // Add back button event listener
        this.settingsMenu.querySelector('#back-button').addEventListener('click', () => {
            this.hideSettingsMenu();
        });
        
        // Add toggle event listeners
        this.settingsMenu.querySelector('#mouse-smoothing').addEventListener('change', (e) => {
            if (window.game && window.game.player) {
                window.game.player.mouseLookSmoothing = e.target.checked;
            }
        });
        
        this.settingsMenu.querySelector('#head-bobbing').addEventListener('change', (e) => {
            if (window.game && window.game.player) {
                window.game.player.enableBobbing = e.target.checked;
            }
        });
    }
    
    /**
     * Show settings menu
     */
    showSettingsMenu() {
        this.gameMenu.querySelector('.menu-content').children[0].style.display = 'none'; // Hide title
        this.gameMenu.querySelector('.menu-content').children[1].style.display = 'none'; // Hide start button
        this.gameMenu.querySelector('.menu-content').children[2].style.display = 'none'; // Hide settings button
        this.gameMenu.querySelector('.menu-content').children[3].style.display = 'none'; // Hide credits
        this.settingsMenu.style.display = 'block';
    }
    
    /**
     * Hide settings menu
     */
    hideSettingsMenu() {
        this.gameMenu.querySelector('.menu-content').children[0].style.display = 'block'; // Show title
        this.gameMenu.querySelector('.menu-content').children[1].style.display = 'block'; // Show start button
        this.gameMenu.querySelector('.menu-content').children[2].style.display = 'block'; // Show settings button
        this.gameMenu.querySelector('.menu-content').children[3].style.display = 'block'; // Show credits
        this.settingsMenu.style.display = 'none';
    }
    
    /**
     * Show game menu
     */
    showGameMenu() {
        this.gameMenu.style.display = 'flex';
        this.isPaused = true;
        this.game.stop();
    }
    
    /**
     * Hide game menu
     */
    hideGameMenu() {
        this.gameMenu.style.display = 'none';
        this.isPaused = false;
    }

    /**
     * Create crosshair element
     */
    createCrosshair() {
        this.crosshair = document.createElement('div');
        this.crosshair.className = 'crosshair';
        this.container.appendChild(this.crosshair);
    }

    /**
     * Create block selector UI
     */
    createBlockSelector() {
        this.blockSelector = document.createElement('div');
        this.blockSelector.className = 'block-selector';
        
        // Create block options
        const blockTypes = [
            { type: 'grass', key: '1' },
            { type: 'dirt', key: '2' },
            { type: 'stone', key: '3' }
        ];
        
        blockTypes.forEach(block => {
            const blockOption = document.createElement('div');
            blockOption.className = 'block-option';
            blockOption.dataset.type = block.type;
            
            // Add block image
            const blockImage = document.createElement('div');
            blockImage.className = 'block-image';
            blockImage.style.backgroundImage = `url(textures/${block.type}.svg)`;
            blockOption.appendChild(blockImage);
            
            // Add key indicator
            const keyIndicator = document.createElement('span');
            keyIndicator.className = 'key-indicator';
            keyIndicator.textContent = block.key;
            blockOption.appendChild(keyIndicator);
            
            // Add click handler
            blockOption.addEventListener('click', () => {
                this.game.selectedBlockType = block.type;
                this.updateBlockSelector();
            });
            
            this.blockSelector.appendChild(blockOption);
        });
        
        this.container.appendChild(this.blockSelector);
        
        // Initial update
        this.updateBlockSelector();
    }

    /**
     * Update block selector to highlight selected block
     */
    updateBlockSelector() {
        // Remove selected class from all options
        const options = this.blockSelector.querySelectorAll('.block-option');
        options.forEach(option => {
            if (option.dataset.type === this.game.selectedBlockType) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    /**
     * Create controls info UI
     */
    createControlsInfo() {
        this.controlsInfo = document.createElement('div');
        this.controlsInfo.className = 'controls-info';
        
        this.controlsInfo.innerHTML = `
            <h3>Controls</h3>
            <ul>
                <li><strong>W, A, S, D</strong> - Move</li>
                <li><strong>Shift</strong> - Run</li>
                <li><strong>Space</strong> - Jump</li>
                <li><strong>Left Click</strong> - Break block</li>
                <li><strong>Right Click</strong> - Place block</li>
                <li><strong>1, 2, 3</strong> - Select block type</li>
                <li><strong>ESC</strong> - Pause game</li>
                <li><strong>Click</strong> - Lock/unlock mouse</li>
            </ul>
        `;
        
        this.container.appendChild(this.controlsInfo);
        
        // Add fade out after 10 seconds
        setTimeout(() => {
            this.controlsInfo.style.opacity = '0.2';
        }, 10000);
        
        // Show on hover
        this.controlsInfo.addEventListener('mouseenter', () => {
            this.controlsInfo.style.opacity = '1';
        });
        
        // Hide on mouse leave
        this.controlsInfo.addEventListener('mouseleave', () => {
            this.controlsInfo.style.opacity = '0.2';
        });
    }
    
    /**
     * Create HUD elements
     */
    createHUD() {
        this.hud = document.createElement('div');
        this.hud.className = 'hud';
        
        // Create selected block indicator
        const blockIndicator = document.createElement('div');
        blockIndicator.className = 'hud-element';
        blockIndicator.id = 'block-indicator';
        blockIndicator.innerHTML = `Selected: <strong>Grass</strong>`;
        this.hud.appendChild(blockIndicator);
        
        // Create position indicator
        const positionIndicator = document.createElement('div');
        positionIndicator.className = 'hud-element';
        positionIndicator.id = 'position-indicator';
        positionIndicator.innerHTML = `Position: X:0 Y:0 Z:0`;
        this.hud.appendChild(positionIndicator);
        
        this.container.appendChild(this.hud);
    }
    
    /**
     * Create pause button
     */
    createPauseButton() {
        const pauseButton = document.createElement('button');
        pauseButton.className = 'pause-button';
        pauseButton.textContent = 'Pause';
        
        pauseButton.addEventListener('click', () => {
            this.showGameMenu();
        });
        
        // Also listen for ESC key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.isPaused) {
                    this.hideGameMenu();
                    this.game.start();
                    document.body.requestPointerLock();
                } else {
                    this.showGameMenu();
                }
            }
        });
        
        this.container.appendChild(pauseButton);
    }
    
    /**
     * Create mobile controls
     */
    createMobileControls() {
        // Create mobile controls container
        this.mobileControls = document.createElement('div');
        this.mobileControls.className = 'mobile-controls';
        
        // Create D-pad for movement
        const dpad = document.createElement('div');
        dpad.className = 'mobile-dpad';
        
        // Create D-pad buttons
        const buttons = [
            { id: 'up', text: '↑', x: 1, y: 0, key: 'w' },
            { id: 'left', text: '←', x: 0, y: 1, key: 'a' },
            { id: 'down', text: '↓', x: 1, y: 2, key: 's' },
            { id: 'right', text: '→', x: 2, y: 1, key: 'd' },
            { id: 'jump', text: '↑↑', x: 1, y: 1, key: ' ' }
        ];
        
        // Create a 3x3 grid with buttons in the appropriate positions
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const cell = document.createElement('div');
                
                // Find button for this position
                const button = buttons.find(b => b.x === x && b.y === y);
                
                if (button) {
                    cell.className = 'mobile-button';
                    cell.id = `mobile-${button.id}`;
                    cell.textContent = button.text;
                    
                    // Add touch events
                    cell.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        // Simulate keydown
                        const event = new KeyboardEvent('keydown', { key: button.key });
                        document.dispatchEvent(event);
                    });
                    
                    cell.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        // Simulate keyup
                        const event = new KeyboardEvent('keyup', { key: button.key });
                        document.dispatchEvent(event);
                    });
                }
                
                dpad.appendChild(cell);
            }
        }
        
        this.mobileControls.appendChild(dpad);
        
        // Create action buttons container
        const actionButtons = document.createElement('div');
        actionButtons.className = 'mobile-action-buttons';
        
        // Create break and place buttons
        const breakButton = document.createElement('div');
        breakButton.className = 'mobile-button';
        breakButton.textContent = '✖';
        breakButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Simulate left click
            const event = new MouseEvent('mousedown', { button: 0 });
            document.dispatchEvent(event);
        });
        actionButtons.appendChild(breakButton);
        
        const placeButton = document.createElement('div');
        placeButton.className = 'mobile-button';
        placeButton.textContent = '✚';
        placeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Simulate right click
            const event = new MouseEvent('mousedown', { button: 2 });
            document.dispatchEvent(event);
        });
        actionButtons.appendChild(placeButton);
        
        this.container.appendChild(this.mobileControls);
        this.container.appendChild(actionButtons);
    }
    
    /**
     * Check if device is mobile and show/hide mobile controls
     */
    checkMobile() {
        const isMobile = window.innerWidth <= 768;
        if (this.mobileControls) {
            this.mobileControls.style.display = isMobile ? 'block' : 'none';
        }
    }
    
    /**
     * Update HUD information
     */
    updateHUD(playerPosition) {
        // Update selected block
        const blockIndicator = document.getElementById('block-indicator');
        if (blockIndicator) {
            blockIndicator.innerHTML = `Selected: <strong>${this.game.selectedBlockType.charAt(0).toUpperCase() + this.game.selectedBlockType.slice(1)}</strong>`;
        }
        
        // Update position
        const positionIndicator = document.getElementById('position-indicator');
        if (positionIndicator && playerPosition) {
            const x = Math.round(playerPosition.x);
            const y = Math.round(playerPosition.y);
            const z = Math.round(playerPosition.z);
            positionIndicator.innerHTML = `Position: X:${x} Y:${y} Z:${z}`;
        }
    }

    /**
     * Show a message to the player
     */
    showMessage(message, duration = 3000) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;
        
        this.container.appendChild(messageElement);
        
        // Remove message after duration
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                this.container.removeChild(messageElement);
            }, 500); // Fade out animation duration
        }, duration);
    }
}