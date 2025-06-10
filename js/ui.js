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
        
        // Create crosshair
        this.createCrosshair();
        
        // Create block selector
        this.createBlockSelector();
        
        // Create controls info
        this.createControlsInfo();
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
                <li><strong>Space</strong> - Jump</li>
                <li><strong>Left Click</strong> - Break block</li>
                <li><strong>Right Click</strong> - Place block</li>
                <li><strong>1, 2, 3</strong> - Select block type</li>
                <li><strong>Click</strong> - Lock/unlock mouse</li>
            </ul>
        `;
        
        this.container.appendChild(this.controlsInfo);
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