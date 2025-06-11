/**
 * Main Game class to manage the Minecraft-style game
 */
class Game {
    constructor() {
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // Game components
        this.world = null;
        this.player = null;
        this.skybox = null;
        this.water = null;
        this.particles = null;
        this.ui = null;
        
        // Game state
        this.isRunning = false;
        this.selectedBlockType = 'grass';
        this.settings = {
            renderDistance: 5,
            mouseSensitivity: 0.002
        };
        
        // Initialize the game
        this.init();
    }

    /**
     * Initialize the game
     */
    init() {
        // Create a scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Create a camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Create a renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
        
        // Create the world
        this.world = new World({ width: 32, height: 32, depth: 32 }); // Increased world size
        this.world.init(this.scene);
        this.world.generateFlatWorld();
        
        // Create the player
        this.player = new Player(this.camera, this.world);
        this.player.init();
        
        // Create the UI
        this.ui = new UI(this);
        this.ui.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start the game loop
        this.gameLoop();
    }

    /**
     * Set up event listeners for player interaction
     */
    setupEventListeners() {
        // Mouse click events for block placement/removal
        document.addEventListener('mousedown', (event) => {
            // Only handle if pointer is locked
            if (document.pointerLockElement) {
                if (event.button === 0) { // Left click - remove block
                    const success = this.player.removeBlock();
                    if (success) {
                        this.ui.showMessage('Block removed!', 1000);
                    }
                } else if (event.button === 2) { // Right click - place block
                    const success = this.player.placeBlock(this.selectedBlockType);
                    if (success) {
                        this.ui.showMessage(`Placed ${this.selectedBlockType} block!`, 1000);
                    }
                }
            }
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Number keys to select block type
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case '1':
                    this.selectedBlockType = 'grass';
                    this.ui.updateBlockSelector();
                    this.ui.showMessage('Selected: Grass', 1000);
                    break;
                case '2':
                    this.selectedBlockType = 'dirt';
                    this.ui.updateBlockSelector();
                    this.ui.showMessage('Selected: Dirt', 1000);
                    break;
                case '3':
                    this.selectedBlockType = 'stone';
                    this.ui.updateBlockSelector();
                    this.ui.showMessage('Selected: Stone', 1000);
                    break;
                case '4':
                    this.selectedBlockType = 'wood';
                    this.ui.updateBlockSelector();
                    this.ui.showMessage('Selected: Wood', 1000);
                    break;
                case '5':
                    this.selectedBlockType = 'leaves';
                    this.ui.updateBlockSelector();
                    this.ui.showMessage('Selected: Leaves', 1000);
                    break;
                case '6':
                    this.selectedBlockType = 'sand';
                    this.ui.updateBlockSelector();
                    this.ui.showMessage('Selected: Sand', 1000);
                    break;
                case '7':
                    this.selectedBlockType = 'glass';
                    this.ui.updateBlockSelector();
                    this.ui.showMessage('Selected: Glass', 1000);
                    break;
            }
        });
        
        // Listen for settings changes
        document.getElementById('render-distance')?.addEventListener('change', (event) => {
            this.settings.renderDistance = parseInt(event.target.value);
        });
        
        document.getElementById('mouse-sensitivity')?.addEventListener('change', (event) => {
            this.settings.mouseSensitivity = parseInt(event.target.value) * 0.0004;
        });
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Update player
        this.player.update();
        
        // Update skybox
        if (this.skybox) {
            this.skybox.update();
        }
        
        // Update water
        if (this.water) {
            this.water.update();
        }
        
        // Update particles
        if (this.particles) {
            this.particles.update();
        }
        
        // Update UI
        if (this.ui) {
            this.ui.updateHUD(this.player.position);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Start the game
     */
    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    /**
     * Stop the game
     */
    stop() {
        this.isRunning = false;
    }
}