/**
 * Player class for handling player movement and interaction
 */
class Player {
    constructor(camera, world, particles) {
        this.camera = camera;
        this.world = world;
        this.particles = particles;
        this.position = { x: 0, y: 3, z: 0 }; // Start position higher above the world to ensure we don't start inside a block
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
        
        // Debug flag - enable for troubleshooting
        this.debug = true;
        
        // Initialize player
        this.init();
    }

    /**
     * Initialize the player
     */
    init() {
        // Reset camera rotation to ensure it starts level
        this.camera.rotation.set(0, 0, 0);
        
        // Set initial camera position
        this.updateCameraPosition();
        
        // Set up keyboard controls
        this.setupControls();
        
        // Log initial position for debugging
        if (this.debug) {
            console.log("Initial player position:", this.position);
        }
    }

    /**
     * Set up keyboard controls for player movement
     */
    setupControls() {
        // Key down event
        document.addEventListener('keydown', (event) => {
            // Prevent default behavior for game controls
            if (['w', 'a', 's', 'd', ' ', 'shift'].includes(event.key.toLowerCase())) {
                event.preventDefault();
            }
            
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.controls.forward = true;
                    if (this.debug) console.log("Forward pressed");
                    break;
                case 's':
                    this.controls.backward = true;
                    if (this.debug) console.log("Backward pressed");
                    break;
                case 'a':
                    this.controls.left = true;
                    if (this.debug) console.log("Left pressed");
                    break;
                case 'd':
                    this.controls.right = true;
                    if (this.debug) console.log("Right pressed");
                    break;
                case ' ':
                    this.controls.jump = true;
                    if (this.debug) console.log("Jump pressed");
                    break;
                case 'shift':
                    this.controls.run = true;
                    this.isRunning = true;
                    if (this.debug) console.log("Run pressed");
                    break;
            }
        });
        
        // Key up event
        document.addEventListener('keyup', (event) => {
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.controls.forward = false;
                    if (this.debug) console.log("Forward released");
                    break;
                case 's':
                    this.controls.backward = false;
                    if (this.debug) console.log("Backward released");
                    break;
                case 'a':
                    this.controls.left = false;
                    if (this.debug) console.log("Left released");
                    break;
                case 'd':
                    this.controls.right = false;
                    if (this.debug) console.log("Right released");
                    break;
                case ' ':
                    this.controls.jump = false;
                    if (this.debug) console.log("Jump released");
                    break;
                case 'shift':
                    this.controls.run = false;
                    this.isRunning = false;
                    if (this.debug) console.log("Run released");
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
        
        // Apply gravity only if not on ground
        if (!this.onGround) {
            this.velocity.y -= this.gravity;
        } else if (this.velocity.y < 0) {
            // Stop falling when on ground
            this.velocity.y = 0;
        }
        
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
            // Calculate target velocity - fixed direction calculation
            let targetVelocityX = 0;
            let targetVelocityZ = 0;
            
            // Forward/backward movement (aligned with camera)
            if (moveZ !== 0) {
                targetVelocityX += -Math.sin(angle) * moveZ * currentSpeed;
                targetVelocityZ += -Math.cos(angle) * moveZ * currentSpeed;
            }
            
            // Left/right movement (perpendicular to camera)
            if (moveX !== 0) {
                targetVelocityX += Math.cos(angle) * moveX * currentSpeed;
                targetVelocityZ += -Math.sin(angle) * moveX * currentSpeed;
            }
            
            // Smoothly interpolate current velocity toward target
            this.velocity.x = this.velocity.x * 0.8 + targetVelocityX * 0.2;
            this.velocity.z = this.velocity.z * 0.8 + targetVelocityZ * 0.2;
            
            if (this.debug) {
                console.log("Moving with velocity:", this.velocity);
            }
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
        this.position.z += this.velocity.z; // Update X and Z first
        
        // Check for horizontal collisions
        this.handleHorizontalCollisions(prevPosition);
        
        // Then update Y position separately
        this.position.y += this.velocity.y;
        
        // Check for vertical collisions and ground detection
        this.checkGroundAndCollisions(prevPosition);
        
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
        
        // Debug output
        if (this.debug) {
            console.log("Position:", this.position, "OnGround:", this.onGround);
        }
    }
    
    /**
     * Handle horizontal collisions only (X and Z axes)
     */
    handleHorizontalCollisions(prevPosition) {
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
                        // X-axis collision
                        if (prevPosition.x < blockBox.minX) {
                            this.position.x = blockBox.minX - this.width / 2;
                            this.velocity.x = 0;
                        } else if (prevPosition.x > blockBox.maxX) {
                            this.position.x = blockBox.maxX + this.width / 2;
                            this.velocity.x = 0;
                        }
                        
                        // Update player box after X resolution
                        playerBox.minX = this.position.x - this.width / 2;
                        playerBox.maxX = this.position.x + this.width / 2;
                        
                        // Z-axis collision
                        if (this.boxIntersect(playerBox, blockBox)) {
                            if (prevPosition.z < blockBox.minZ) {
                                this.position.z = blockBox.minZ - this.width / 2;
                                this.velocity.z = 0;
                            } else if (prevPosition.z > blockBox.maxZ) {
                                this.position.z = blockBox.maxZ + this.width / 2;
                                this.velocity.z = 0;
                            }
                        }
                    }
                }
            }
        }
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
        
        // First check if player is directly on ground
        const groundCheckPos = {
            x: Math.floor(this.position.x),
            y: Math.floor(this.position.y - this.height / 2 - 0.01), // Just below feet
            z: Math.floor(this.position.z)
        };
        
        const blockBelowPlayer = this.world.getBlock(groundCheckPos);
        if (blockBelowPlayer) {
            this.onGround = true;
            // Ensure player is exactly on top of the block
            this.position.y = Math.floor(this.position.y - this.height / 2) + 0.5 + this.height / 2;
            this.velocity.y = 0;
        }
        
        // Now check for other collisions
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
            // Reduce horizontal bobbing to minimize disorientation
            bobbingOffsetX = Math.sin(this.bobbingCycle) * this.bobbingAmount * 0.3;
        }
        
        // Set camera position at eye level with bobbing
        this.camera.position.set(
            this.position.x + bobbingOffsetX,
            this.position.y + (this.eyeLevel - this.height / 2) + bobbingOffsetY,
            this.position.z
        );
        
        // Ensure camera stays level (no roll)
        this.camera.rotation.z = 0;
    }

    /**
     * Cast a ray to find block in player's view
     */
    castRay() {
        // Create ray direction from camera center
        const direction = new THREE.Vector3();
        direction.set(0, 0, -1); // Forward direction in camera space
        direction.applyQuaternion(this.camera.quaternion); // Transform to world space
        
        // Set up raycaster from camera position in direction of view
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
                    normal: this.calculateHitNormal(intersection, blockBox),
                    block
                });
            }
        }
        
        // Sort by distance
        intersects.sort((a, b) => a.distance - b.distance);
        
        return intersects.length > 0 ? intersects[0] : null;
    }

    /**
     * Calculate which face of the block was hit
     */
    calculateHitNormal(hitPoint, blockBox) {
        // Determine which face was hit by checking which boundary the hit point is closest to
        const epsilon = 0.001; // Small value to handle floating point precision
        
        // Check each face
        if (Math.abs(hitPoint.x - blockBox.min.x) < epsilon) return { x: -1, y: 0, z: 0 }; // Left face
        if (Math.abs(hitPoint.x - blockBox.max.x) < epsilon) return { x: 1, y: 0, z: 0 };  // Right face
        if (Math.abs(hitPoint.y - blockBox.min.y) < epsilon) return { x: 0, y: -1, z: 0 }; // Bottom face
        if (Math.abs(hitPoint.y - blockBox.max.y) < epsilon) return { x: 0, y: 1, z: 0 };  // Top face
        if (Math.abs(hitPoint.z - blockBox.min.z) < epsilon) return { x: 0, y: 0, z: -1 }; // Back face
        if (Math.abs(hitPoint.z - blockBox.max.z) < epsilon) return { x: 0, y: 0, z: 1 };  // Front face
        
        // Default to top face if we can't determine (shouldn't happen)
        return { x: 0, y: 1, z: 0 };
    }

    /**
     * Place a block in the world
     */
    placeBlock(type) {
        try {
            // Cast ray to find where to place block
            const hit = this.castRay();
            
            if (!hit) return false;
            
            // Calculate position adjacent to the hit block using the face normal
            const x = hit.position.x + hit.normal.x;
            const y = hit.position.y + hit.normal.y;
            const z = hit.position.z + hit.normal.z;
            
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

    /**
     * Check for ground beneath player and handle vertical collisions
     */
    checkGroundAndCollisions(prevPosition) {
        // Reset ground state
        this.onGround = false;
        
        // Check directly below player first (faster than full collision check)
        for (let offsetX = -0.3; offsetX <= 0.3; offsetX += 0.3) {
            for (let offsetZ = -0.3; offsetZ <= 0.3; offsetZ += 0.3) {
                const groundCheckPos = {
                    x: this.position.x + offsetX,
                    y: this.position.y - this.height / 2 - 0.01, // Just below feet
                    z: this.position.z + offsetZ
                };
                
                const blockBelowPlayer = this.world.getBlock(groundCheckPos);
                if (blockBelowPlayer) {
                    this.onGround = true;
                    // Ensure player is exactly on top of the block
                    this.position.y = Math.floor(groundCheckPos.y) + 0.5 + this.height / 2;
                    this.velocity.y = 0;
                    return; // Exit early if we found ground
                }
            }
        }
        
        // If we didn't find ground with the quick check, do full collision detection
        this.handleCollisions(prevPosition);
        
        // Simple ground collision as fallback
        if (this.position.y < this.height / 2) {
            this.position.y = this.height / 2;
            this.velocity.y = 0;
            this.onGround = true;
        }
    }
}