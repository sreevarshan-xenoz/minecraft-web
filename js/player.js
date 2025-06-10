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
        this.runningSpeed = 0.16; // Speed when running (shift key)
        this.jumpForce = 0.2;
        this.gravity = 0.01;
        this.friction = 0.9; // Friction to slow down movement naturally
        this.onGround = false;
        this.isMoving = false;
        this.isRunning = false;
        this.lastFootstep = 0;
        this.footstepInterval = 20; // Frames between footsteps
        this.height = 1.8; // Player height
        this.eyeLevel = 1.6; // Eye level (camera height)
        this.width = 0.6; // Player width for collision detection
        
        // Mouse smoothing
        this.mouseLookSmoothing = true;
        this.mouseLookBuffer = { x: 0, y: 0 };
        this.mouseLookSmoothed = { x: 0, y: 0 };
        this.mouseLookSmoothingFactor = 0.2; // Lower = smoother (0-1)
        
        // Bobbing effect
        this.enableBobbing = true;
        this.bobbingAmount = 0.05;
        this.bobbingSpeed = 0.014;
        this.bobbingCycle = 0;
        
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            run: false
        };
        
        // Ray caster for block interaction
        this.raycaster = new THREE.Raycaster();
        this.maxReach = 5; // Maximum distance to interact with blocks
        
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
                case 'shift':
                    this.controls.run = true;
                    this.isRunning = true;
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
                case 'shift':
                    this.controls.run = false;
                    this.isRunning = false;
                    break;
            }
        });
        
        // Mouse movement for camera rotation with smoothing
        document.addEventListener('mousemove', (event) => {
            // Only rotate camera if mouse is locked (pointer lock API)
            if (document.pointerLockElement) {
                // Get mouse sensitivity from game settings if available
                const sensitivity = window.game?.settings?.mouseSensitivity || 0.002;
                
                // Add movement to buffer for smoothing
                if (this.mouseLookSmoothing) {
                    this.mouseLookBuffer.x += event.movementX * sensitivity;
                    this.mouseLookBuffer.y += event.movementY * sensitivity;
                } else {
                    // Direct rotation without smoothing
                    this.camera.rotation.y -= event.movementX * sensitivity;
                    
                    // Limit vertical rotation to prevent camera flipping
                    const verticalRotation = this.camera.rotation.x - event.movementY * sensitivity;
                    this.camera.rotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, verticalRotation));
                }
            }
        });
        
        // Click to lock pointer
        document.addEventListener('click', () => {
            if (!document.pointerLockElement && !window.game.ui.isPaused) {
                document.body.requestPointerLock();
            }
        });
    }

    /**
     * Apply mouse look smoothing
     */
    applyMouseLookSmoothing() {
        if (!this.mouseLookSmoothing) return;
        
        // Smooth out the mouse movement using lerp (linear interpolation)
        this.mouseLookSmoothed.x = this.mouseLookSmoothed.x * (1 - this.mouseLookSmoothingFactor) + 
                                   this.mouseLookBuffer.x * this.mouseLookSmoothingFactor;
        this.mouseLookSmoothed.y = this.mouseLookSmoothed.y * (1 - this.mouseLookSmoothingFactor) + 
                                   this.mouseLookBuffer.y * this.mouseLookSmoothingFactor;
        
        // Apply the smoothed rotation
        this.camera.rotation.y -= this.mouseLookSmoothed.x;
        
        // Limit vertical rotation to prevent camera flipping
        const verticalRotation = this.camera.rotation.x - this.mouseLookSmoothed.y;
        this.camera.rotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, verticalRotation));
        
        // Reset buffer after applying
        this.mouseLookBuffer.x = 0;
        this.mouseLookBuffer.y = 0;
    }

    /**
     * Update player position based on controls and physics
     */
    update() {
        // Apply mouse look smoothing
        this.applyMouseLookSmoothing();
        
        // Store previous position for collision detection
        const prevPosition = { ...this.position };
        
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
        
        // Determine current speed based on whether player is running
        const currentSpeed = this.isRunning ? this.runningSpeed : this.speed;
        
        // Calculate movement vector relative to camera direction
        const angle = this.camera.rotation.y;
        
        // Apply movement with acceleration/deceleration
        if (moveX !== 0 || moveZ !== 0) {
            // Calculate target velocity
            const targetVelocityX = (moveX * Math.cos(angle) + moveZ * Math.sin(angle)) * currentSpeed;
            const targetVelocityZ = (moveZ * Math.cos(angle) - moveX * Math.sin(angle)) * currentSpeed;
            
            // Smoothly interpolate current velocity toward target
            this.velocity.x = this.velocity.x * 0.8 + targetVelocityX * 0.2;
            this.velocity.z = this.velocity.z * 0.8 + targetVelocityZ * 0.2;
        } else {
            // Apply friction to slow down when not actively moving
            this.velocity.x *= this.friction;
            this.velocity.z *= this.friction;
            
            // Stop completely if velocity is very small
            if (Math.abs(this.velocity.x) < 0.001) this.velocity.x = 0;
            if (Math.abs(this.velocity.z) < 0.001) this.velocity.z = 0;
        }
        
        // Check if player is moving horizontally
        this.isMoving = Math.abs(this.velocity.x) > 0.001 || Math.abs(this.velocity.z) > 0.001;
        
        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
        
        // Check for collisions with blocks and adjust position
        this.handleCollisions(prevPosition);
        
        // Apply head bobbing effect when moving
        this.applyHeadBobbing();
        
        // Update camera position
        this.updateCameraPosition();
        
        // Check for water interaction (assuming water level is at -0.5)
        const waterLevel = -0.5;
        const wasAboveWater = prevPosition.y > waterLevel;
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
        this.createFootstepEffects();
    }
    
    /**
     * Handle collisions with blocks
     */
    handleCollisions(prevPosition) {
        // Check for block collisions in all directions
        const playerBox = {
            minX: this.position.x - this.width / 2,
            maxX: this.position.x + this.width / 2,
            minY: this.position.y - this.height / 2,
            maxY: this.position.y + this.height / 2,
            minZ: this.position.z - this.width / 2,
            maxZ: this.position.z + this.width / 2
        };
        
        // Check blocks in the vicinity of the player
        const checkRadius = Math.ceil(this.width + 1);
        this.onGround = false;
        
        for (let x = Math.floor(this.position.x) - checkRadius; x <= Math.floor(this.position.x) + checkRadius; x++) {
            for (let y = Math.floor(this.position.y) - checkRadius; y <= Math.floor(this.position.y) + checkRadius; y++) {
                for (let z = Math.floor(this.position.z) - checkRadius; z <= Math.floor(this.position.z) + checkRadius; z++) {
                    const block = this.world.getBlock({ x, y, z });
                    if (!block) continue;
                    
                    // Simple block collision box
                    const blockBox = {
                        minX: x - 0.5,
                        maxX: x + 0.5,
                        minY: y - 0.5,
                        maxY: y + 0.5,
                        minZ: z - 0.5,
                        maxZ: z + 0.5
                    };
                    
                    // Check for collision
                    if (this.boxIntersect(playerBox, blockBox)) {
                        // Determine collision direction and resolve
                        
                        // Y-axis collision (ground or ceiling)
                        if (prevPosition.y >= blockBox.maxY && this.velocity.y < 0) {
                            // Landing on top of a block
                            this.position.y = blockBox.maxY + this.height / 2;
                            this.velocity.y = 0;
                            this.onGround = true;
                        } else if (prevPosition.y <= blockBox.minY && this.velocity.y > 0) {
                            // Hitting ceiling
                            this.position.y = blockBox.minY - this.height / 2;
                            this.velocity.y = 0;
                        }
                        
                        // Update player box after Y resolution
                        playerBox.minY = this.position.y - this.height / 2;
                        playerBox.maxY = this.position.y + this.height / 2;
                        
                        // X-axis collision
                        if (this.boxIntersect(playerBox, blockBox)) {
                            if (prevPosition.x < blockBox.minX) {
                                this.position.x = blockBox.minX - this.width / 2;
                            } else if (prevPosition.x > blockBox.maxX) {
                                this.position.x = blockBox.maxX + this.width / 2;
                            }
                            this.velocity.x = 0;
                        }
                        
                        // Update player box after X resolution
                        playerBox.minX = this.position.x - this.width / 2;
                        playerBox.maxX = this.position.x + this.width / 2;
                        
                        // Z-axis collision
                        if (this.boxIntersect(playerBox, blockBox)) {
                            if (prevPosition.z < blockBox.minZ) {
                                this.position.z = blockBox.minZ - this.width / 2;
                            } else if (prevPosition.z > blockBox.maxZ) {
                                this.position.z = blockBox.maxZ + this.width / 2;
                            }
                            this.velocity.z = 0;
                        }
                    }
                }
            }
        }
        
        // Simple ground collision as fallback
        if (this.position.y < this.height / 2) {
            this.position.y = this.height / 2;
            this.velocity.y = 0;
            this.onGround = true;
        }
    }
    
    /**
     * Check if two boxes intersect
     */
    boxIntersect(a, b) {
        return (
            a.minX <= b.maxX && a.maxX >= b.minX &&
            a.minY <= b.maxY && a.maxY >= b.minY &&
            a.minZ <= b.maxZ && a.maxZ >= b.minZ
        );
    }
    
    /**
     * Apply head bobbing effect when moving
     */
    applyHeadBobbing() {
        if (!this.enableBobbing || !this.isMoving || !this.onGround) {
            // Reset bobbing when not moving
            this.bobbingCycle = 0;
            return;
        }
        
        // Calculate bobbing speed based on movement speed
        const speed = this.isRunning ? this.bobbingSpeed * 1.5 : this.bobbingSpeed;
        
        // Update bobbing cycle
        this.bobbingCycle += speed;
        
        // No need to do anything else - the actual bobbing is applied in updateCameraPosition
    }
    
    /**
     * Create footstep particles when moving
     */
    createFootstepEffects() {
        if (this.isMoving && this.onGround && this.particles) {
            this.lastFootstep++;
            
            // Adjust footstep interval based on running
            const interval = this.isRunning ? this.footstepInterval * 0.7 : this.footstepInterval;
            
            if (this.lastFootstep >= interval) {
                this.lastFootstep = 0;
                
                // Get block type at player's feet
                const blockPos = {
                    x: Math.floor(this.position.x),
                    y: Math.floor(this.position.y - this.height / 2 - 0.1), // Block below player
                    z: Math.floor(this.position.z)
                };
                
                const block = this.world.getBlock(blockPos);
                const blockType = block && block.type ? block.type : 'dirt';
                
                // Create footstep particles
                const particlePos = new THREE.Vector3(
                    this.position.x,
                    this.position.y - this.height / 2 + 0.1, // Just above the ground
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
     * Update camera position to match player position with bobbing effect
     */
    updateCameraPosition() {
        // Calculate bobbing offset
        let bobbingOffsetY = 0;
        let bobbingOffsetX = 0;
        
        if (this.enableBobbing && this.isMoving && this.onGround) {
            // Vertical bobbing (sine wave)
            bobbingOffsetY = Math.sin(this.bobbingCycle * 2) * this.bobbingAmount;
            
            // Horizontal bobbing (sine wave with phase offset)
            bobbingOffsetX = Math.sin(this.bobbingCycle) * this.bobbingAmount * 0.5;
        }
        
        // Set camera position at eye level with bobbing
        this.camera.position.set(
            this.position.x + bobbingOffsetX,
            this.position.y + (this.eyeLevel - this.height / 2) + bobbingOffsetY,
            this.position.z
        );
    }

    /**
     * Cast a ray to find block in player's view
     */
    castRay() {
        // Create ray direction from camera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.unproject(this.camera);
        direction.sub(this.camera.position).normalize();
        
        // Set up raycaster
        this.raycaster.set(this.camera.position, direction);
        
        // Find intersecting blocks
        const blocks = Object.values(this.world.blocks);
        const intersects = [];
        
        // Simple ray-block intersection check
        for (const block of blocks) {
            const blockPos = block.mesh.position;
            const distance = Math.sqrt(
                Math.pow(blockPos.x - this.camera.position.x, 2) +
                Math.pow(blockPos.y - this.camera.position.y, 2) +
                Math.pow(blockPos.z - this.camera.position.z, 2)
            );
            
            // Skip blocks that are too far
            if (distance > this.maxReach) continue;
            
            // Create a box for the block
            const blockBox = new THREE.Box3().setFromObject(block.mesh);
            
            // Check if ray intersects the box
            const intersection = this.raycaster.ray.intersectBox(blockBox, new THREE.Vector3());
            
            if (intersection) {
                intersects.push({
                    distance: intersection.distanceTo(this.camera.position),
                    position: {
                        x: Math.floor(blockPos.x),
                        y: Math.floor(blockPos.y),
                        z: Math.floor(blockPos.z)
                    },
                    block
                });
            }
        }
        
        // Sort by distance
        intersects.sort((a, b) => a.distance - b.distance);
        
        return intersects.length > 0 ? intersects[0] : null;
    }

    /**
     * Place a block in the world
     */
    placeBlock(type) {
        try {
            // Cast ray to find where to place block
            const hit = this.castRay();
            
            if (!hit) return false;
            
            // Calculate position adjacent to the hit block
            // This is a simplified approach - a more accurate one would determine which face was hit
            const angle = this.camera.rotation.y;
            const dx = -Math.sin(angle);
            const dz = -Math.cos(angle);
            
            // Simple approach: place block in front of the hit block
            const x = hit.position.x + Math.round(dx);
            const y = hit.position.y;
            const z = hit.position.z + Math.round(dz);
            
            // Check if position is valid (not inside player)
            const playerBox = {
                minX: this.position.x - this.width / 2,
                maxX: this.position.x + this.width / 2,
                minY: this.position.y - this.height / 2,
                maxY: this.position.y + this.height / 2,
                minZ: this.position.z - this.width / 2,
                maxZ: this.position.z + this.width / 2
            };
            
            const blockBox = {
                minX: x - 0.5,
                maxX: x + 0.5,
                minY: y - 0.5,
                maxY: y + 0.5,
                minZ: z - 0.5,
                maxZ: z + 0.5
            };
            
            // Don't place block if it would intersect with player
            if (this.boxIntersect(playerBox, blockBox)) {
                return false;
            }
            
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
            // Cast ray to find block to remove
            const hit = this.castRay();
            
            if (!hit) return false;
            
            // Remove block from world
            const removed = this.world.removeBlock(hit.position);
            
            // Create particles if block was removed and particles system exists
            if (removed && hit.block && this.particles) {
                try {
                    const particlePos = new THREE.Vector3(
                        hit.position.x,
                        hit.position.y,
                        hit.position.z
                    );
                    this.particles.createBlockBreakParticles(particlePos, hit.block.type);
                } catch (error) {
                    console.error('Error creating block break particles:', error);
                }
            }
            
            return removed;
        } catch (error) {
            console.error('Error removing block:', error);
            return false;
        }
    }
}