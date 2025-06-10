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
        
        // Game state
        this.isRunning = false;
        this.selectedBlockType = 'grass';
        
        // Initialize the game
        this.init();
    }

    /**
     * Initialize the game
     */
    init() {
        // Get canvas element
        this.canvas = document.getElementById('game-canvas');
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Add lighting
        this.setupLighting();
        
        // Create world
        this.world = new World();
        this.world.init(this.scene);
        
        // Generate flat world
        this.world.generateFlatWorld();
        
        // Create player
        this.player = new Player(this.camera, this.world);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Start game loop
        this.isRunning = true;
        this.gameLoop();
    }

    /**
     * Set up lighting for the scene
     */
    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);
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
                    this.player.removeBlock();
                } else if (event.button === 2) { // Right click - place block
                    this.player.placeBlock(this.selectedBlockType);
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
                    break;
                case '2':
                    this.selectedBlockType = 'dirt';
                    break;
                case '3':
                    this.selectedBlockType = 'stone';
                    break;
            }
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Update player
        this.player.update();
        
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