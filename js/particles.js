/**
 * Particles class for creating various particle effects in the game
 */
class Particles {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        
        // Particle types and their properties
        this.particleTypes = {
            blockBreak: {
                size: 0.1,
                count: 8,
                lifetime: 1.0,
                gravity: 0.05,
                initialVelocity: 0.2
            },
            footstep: {
                size: 0.05,
                count: 3,
                lifetime: 0.5,
                gravity: 0.02,
                initialVelocity: 0.1
            },
            splash: {
                size: 0.08,
                count: 10,
                lifetime: 0.8,
                gravity: 0.03,
                initialVelocity: 0.15
            }
        };
    }

    /**
     * Update all active particles
     */
    update() {
        // Update each particle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update lifetime
            particle.lifetime -= 0.016; // Assuming 60fps
            
            // Remove if lifetime is over
            if (particle.lifetime <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(i, 1);
                continue;
            }
            
            // Update position based on velocity
            particle.mesh.position.x += particle.velocity.x;
            particle.mesh.position.y += particle.velocity.y;
            particle.mesh.position.z += particle.velocity.z;
            
            // Apply gravity
            particle.velocity.y -= particle.gravity;
            
            // Scale down as lifetime decreases
            const scale = particle.lifetime / particle.maxLifetime;
            particle.mesh.scale.set(scale, scale, scale);
            
            // Rotate for more dynamic effect
            particle.mesh.rotation.x += 0.1;
            particle.mesh.rotation.y += 0.1;
            particle.mesh.rotation.z += 0.1;
        }
    }

    /**
     * Create particles at a specific position with a specific type
     */
    createParticles(position, type, material) {
        // Get particle properties based on type
        const properties = this.particleTypes[type] || this.particleTypes.blockBreak;
        
        // Create particles
        for (let i = 0; i < properties.count; i++) {
            // Create geometry
            const geometry = new THREE.BoxGeometry(properties.size, properties.size, properties.size);
            
            // Use provided material or create a default one
            const particleMaterial = material || new THREE.MeshBasicMaterial({ color: 0xffffff });
            
            // Create mesh
            const mesh = new THREE.Mesh(geometry, particleMaterial);
            
            // Set position
            mesh.position.copy(position);
            
            // Random velocity
            const velocity = {
                x: (Math.random() - 0.5) * properties.initialVelocity,
                y: Math.random() * properties.initialVelocity,
                z: (Math.random() - 0.5) * properties.initialVelocity
            };
            
            // Add to scene
            this.scene.add(mesh);
            
            // Add to particles array
            this.particles.push({
                mesh,
                velocity,
                gravity: properties.gravity,
                lifetime: properties.lifetime,
                maxLifetime: properties.lifetime
            });
        }
    }

    /**
     * Create block breaking particles
     */
    createBlockBreakParticles(position, blockType) {
        // Create material based on block type
        let material;
        
        switch(blockType) {
            case 'grass':
                material = new THREE.MeshBasicMaterial({ color: 0x567D46 });
                break;
            case 'dirt':
                material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
                break;
            case 'stone':
                material = new THREE.MeshBasicMaterial({ color: 0x7D7D7D });
                break;
            default:
                material = new THREE.MeshBasicMaterial({ color: 0xAAAAAA });
        }
        
        this.createParticles(position, 'blockBreak', material);
    }

    /**
     * Create footstep particles
     */
    createFootstepParticles(position, groundType) {
        // Create material based on ground type
        let material;
        
        switch(groundType) {
            case 'grass':
                material = new THREE.MeshBasicMaterial({ color: 0x567D46 });
                break;
            case 'dirt':
                material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
                break;
            case 'stone':
                material = new THREE.MeshBasicMaterial({ color: 0x7D7D7D });
                break;
            default:
                material = new THREE.MeshBasicMaterial({ color: 0xAAAAAA });
        }
        
        this.createParticles(position, 'footstep', material);
    }

    /**
     * Create water splash particles
     */
    createSplashParticles(position) {
        const material = new THREE.MeshBasicMaterial({ color: 0x3366AA, transparent: true, opacity: 0.7 });
        this.createParticles(position, 'splash', material);
    }
}