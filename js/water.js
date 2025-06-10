/**
 * Water class for creating realistic water in the Minecraft-style game
 */
class Water {
    constructor(scene, size = { width: 32, depth: 32 }) {
        this.scene = scene;
        this.size = size;
        this.mesh = null;
        this.waterLevel = -1; // Water level in the world (y coordinate)
        this.timeOffset = 0;
        
        this.init();
    }

    /**
     * Initialize the water
     */
    init() {
        // Create a plane geometry for the water surface
        const geometry = new THREE.PlaneGeometry(
            this.size.width,
            this.size.depth,
            this.size.width / 2,
            this.size.depth / 2
        );
        
        // Rotate the plane to be horizontal
        geometry.rotateX(-Math.PI / 2);
        
        // Create a shader material for the water
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: new THREE.Color(0x3366aa) },
                waterDepth: { value: 1.0 }
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
            transparent: true
        });
        
        // Create the mesh and add to scene
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = this.waterLevel;
        this.scene.add(this.mesh);
    }

    /**
     * Update the water animation
     */
    update() {
        if (this.mesh && this.mesh.material.uniforms) {
            // Update time uniform for wave animation
            this.timeOffset += 0.01;
            this.mesh.material.uniforms.time.value = this.timeOffset;
            
            // Optionally update water color based on time of day
            // This could be linked to the skybox time
        }
    }

    /**
     * Set the water level
     */
    setWaterLevel(level) {
        this.waterLevel = level;
        if (this.mesh) {
            this.mesh.position.y = this.waterLevel;
        }
    }

    /**
     * Get the vertex shader for the water
     */
    getVertexShader() {
        return `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            // Simple noise function
            float noise(vec2 p) {
                return sin(p.x * 10.0) * sin(p.y * 10.0) * 0.5 + 0.5;
            }
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Calculate wave height
                float waveHeight = 0.0;
                
                // Small waves
                waveHeight += sin(position.x * 2.0 + time * 2.0) * 0.1;
                waveHeight += sin(position.z * 3.0 + time * 1.5) * 0.1;
                
                // Apply wave height to y position
                vec3 newPosition = position;
                newPosition.y += waveHeight;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
    }

    /**
     * Get the fragment shader for the water
     */
    getFragmentShader() {
        return `
            uniform float time;
            uniform vec3 waterColor;
            uniform float waterDepth;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                // Base water color
                vec3 color = waterColor;
                
                // Add wave patterns
                float pattern1 = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time);
                float pattern2 = sin(vUv.x * 30.0 - time * 0.5) * sin(vUv.y * 30.0 - time * 0.5);
                
                // Combine patterns
                float pattern = (pattern1 + pattern2) * 0.5;
                
                // Adjust color based on pattern
                color = mix(color, color * 1.2, pattern * 0.5 + 0.5);
                
                // Add transparency for water effect
                float alpha = 0.8;
                
                // Add edge foam
                float edgeFactor = max(0.0, 1.0 - distance(vUv, vec2(0.5)) * 2.0);
                color = mix(color, vec3(1.0), edgeFactor * 0.1);
                
                gl_FragColor = vec4(color, alpha);
            }
        `;
    }
}