/**
 * Player class for handling player movement and interaction
 */
class Player {
    constructor(camera, world, particles) {
        this.camera = camera;
        this.world = world;
        this.particles = particles;
        this.position = { x: 0, y: 5, z: 10 }; // Start position above the world
        this.velocity = { x: 0, y: 0, z: 0 };
        this.speed = 0.1;
        this.jumpForce = 0.2;
        this.gravity = 0.01;
        this.onGround = false;
        this.isMoving = false;
        this.lastFootstep = 0;
        this.footstepInterval = 20; // Frames between footsteps
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        // Initialize player
        this.init();
    }

    /**
     * Initialize the player
     */
    init() {
        // Set initial camera position
        this.updateCameraPosition();
        
        // Set up keyboard controls
        this.setupControls();
    }

    /**
     * Set up keyboard controls for player movement
     */
    setupControls() {
        // Key down event
        document.addEventListener('keydown', (event) => {
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.controls.forward = true;
                    break;
                case 's':
                    this.controls.backward = true;
                    break;
                case 'a':
                    this.controls.left = true;
                    break;
                case 'd':
                    this.controls.right = true;
                    break;
                case ' ':
                    this.controls.jump = true;
                    break;
            }
        });
        
        // Key up event
        document.addEventListener('keyup', (event) => {
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.controls.forward = false;
                    break;
                case 's':
                    this.controls.backward = false;
                    break;
                case 'a':
                    this.controls.left = false;
                    break;
                case 'd':
                    this.controls.right = false;
                    break;
                case ' ':
                    this.controls.jump = false;
                    break;
            }
        });
        
        // Mouse movement for camera rotation
        document.addEventListener('mousemove', (event) => {
            // Only rotate camera if mouse is locked (pointer lock API)
            if (document.pointerLockElement) {
                // Rotate camera based on mouse movement
                this.camera.rotation.y -= event.movementX * 0.002;
                
                // Limit vertical rotation to prevent camera flipping
                const verticalRotation = this.camera.rotation.x - event.movementY * 0.002;
                this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, verticalRotation));
            }
        });
        
        // Click to lock pointer
        document.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
    }

    /**
     * Update player position based on controls and physics
     */
    update() {
        // Store previous position for collision detection
        const prevY = this.position.y;
        
        // Apply gravity
        this.velocity.y -= this.gravity;
        
        // Handle jumping
        if (this.controls.jump && this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }
        
        // Calculate movement direction based on camera rotation
        const moveX = this.controls.right - this.controls.left;
        const moveZ = this.controls.backward - this.controls.forward;
        
        // Calculate movement vector relative to camera direction
        const angle = this.camera.rotation.y;
        this.velocity.x = (moveX * Math.cos(angle) + moveZ * Math.sin(angle)) * this.speed;
        this.velocity.z = (moveZ * Math.cos(angle) - moveX * Math.sin(angle)) * this.speed;
        
        // Check if player is moving horizontally
        this.isMoving = Math.abs(this.velocity.x) > 0.001 || Math.abs(this.velocity.z) > 0.001;
        
        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
        
        // Simple collision detection with ground
        if (this.position.y < 1) { // 1 is player height/2
            this.position.y = 1;
            this.velocity.y = 0;
            this.onGround = true;
        }
        
        // Update camera position
        this.updateCameraPosition();
        
        // Check for water interaction (assuming water level is at -0.5)
        const waterLevel = -0.5;
        const wasAboveWater = prevY > waterLevel;
        const isInWater = this.position.y <= waterLevel;
        
        // Create splash when entering water
        if (wasAboveWater && isInWater && this.particles) {
            const splashPos = new THREE.Vector3(
                this.position.x,
                waterLevel,
                this.position.z
            );
            this.particles.createSplashParticles(splashPos);
        }
        
        // Create footstep particles when moving on ground
        if (this.isMoving && this.onGround && this.particles) {
            this.lastFootstep++;
            if (this.lastFootstep >= this.footstepInterval) {
                this.lastFootstep = 0;
                
                // Get block type at player's feet
                const blockPos = {
                    x: Math.floor(this.position.x),
                    y: Math.floor(this.position.y - 1), // Block below player
                    z: Math.floor(this.position.z)
                };
                
                const block = this.world.getBlock(blockPos);
                const blockType = block && block.type ? block.type : 'dirt';
                
                // Create footstep particles
                const particlePos = new THREE.Vector3(
                    this.position.x,
                    this.position.y - 0.9, // Just above the ground
                    this.position.z
                );
                
                try {
                    this.particles.createFootstepParticles(particlePos, blockType);
                } catch (error) {
                    console.error('Error creating footstep particles:', error);
                }
            }
        }
    }

    /**
     * Update camera position to match player position
     */
    updateCameraPosition() {
        this.camera.position.set(this.position.x, this.position.y, this.position.z);
    }

    /**
     * Place a block in the world
     */
    placeBlock(type) {
        try {
            // Calculate position in front of player
            const distance = 3; // Distance in front of player to place block
            const angle = this.camera.rotation.y;
            
            const x = Math.round(this.position.x - Math.sin(angle) * distance);
            const y = Math.round(this.position.y - 0.5); // Slightly below eye level
            const z = Math.round(this.position.z - Math.cos(angle) * distance);
            
            // Add block to world
            this.world.addBlock(type || 'dirt', { x, y, z });
            return true;
        } catch (error) {
            console.error('Error placing block:', error);
            return false;
        }
    }

    /**
     * Remove a block from the world
     */
    removeBlock() {
        try {
            // Calculate position in front of player
            const distance = 3; // Distance in front of player to remove block
            const angle = this.camera.rotation.y;
            
            const x = Math.round(this.position.x - Math.sin(angle) * distance);
            const y = Math.round(this.position.y - 0.5); // Slightly below eye level
            const z = Math.round(this.position.z - Math.cos(angle) * distance);
            
            const position = { x, y, z };
            
            // Get block type before removing
            const block = this.world.getBlock(position);
            
            // Remove block from world
            const removed = this.world.removeBlock(position);
            
            // Create particles if block was removed and particles system exists
            if (removed && block && this.particles) {
                try {
                    const particlePos = new THREE.Vector3(x, y, z);
                    // Make sure we have a valid block type
                    const blockType = block && block.type ? block.type : 'dirt';
                    this.particles.createBlockBreakParticles(particlePos, blockType);
                } catch (particleError) {
                    console.error('Error creating block break particles:', particleError);
                }
            }
            
            return removed;
        } catch (error) {
            console.error('Error removing block:', error);
            return false;
        }
    }
}