/**
 * Skybox class for creating a realistic sky in the Minecraft-style game
 */
class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.timeOfDay = 0; // 0-1 representing time of day (0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight)
        this.timeSpeed = 0.0001; // Speed of day/night cycle
        
        this.init();
    }

    /**
     * Initialize the skybox
     */
    init() {
        // Create a large sphere for the sky
        const geometry = new THREE.SphereGeometry(500, 32, 32);
        
        // Create a shader material for the sky
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.timeOfDay }
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
            side: THREE.BackSide // Render the inside of the sphere
        });
        
        // Create the mesh and add to scene
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        
        // Add a directional light to represent the sun/moon
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 100, 0);
        this.scene.add(this.sunLight);
    }

    /**
     * Update the skybox based on time of day
     */
    update() {
        // Update time of day
        this.timeOfDay = (this.timeOfDay + this.timeSpeed) % 1;
        
        // Update shader uniform
        if (this.mesh && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value = this.timeOfDay;
        }
        
        // Update sun/moon position
        const angle = this.timeOfDay * Math.PI * 2;
        const height = Math.sin(angle);
        const horizontal = Math.cos(angle);
        
        this.sunLight.position.set(horizontal * 100, height * 100, 0);
        
        // Update light intensity based on time of day
        let intensity = Math.max(0, Math.sin(angle));
        this.sunLight.intensity = intensity * 0.8 + 0.2; // Minimum light at night
        
        // Update light color (warmer at sunrise/sunset)
        if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
            // Dawn or dusk - warmer light
            const t = (this.timeOfDay < 0.25) ? this.timeOfDay * 4 : (1 - this.timeOfDay) * 4;
            const r = 1;
            const g = 0.8 + t * 0.2;
            const b = 0.7 + t * 0.3;
            this.sunLight.color.setRGB(r, g, b);
        } else {
            // Day or night - neutral light
            this.sunLight.color.setRGB(1, 1, 1);
        }
    }

    /**
     * Get the vertex shader for the sky
     */
    getVertexShader() {
        return `
            varying vec3 vWorldPosition;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get the fragment shader for the sky
     */
    getFragmentShader() {
        return `
            uniform float time;
            varying vec3 vWorldPosition;
            
            vec3 getSkyColor(vec3 direction, float time) {
                // Normalize direction
                vec3 dir = normalize(direction);
                
                // Calculate sky colors based on time of day
                vec3 dayColor = vec3(0.3, 0.6, 1.0);
                vec3 nightColor = vec3(0.05, 0.05, 0.1);
                vec3 sunsetColor = vec3(0.8, 0.3, 0.1);
                
                // Sun/moon position
                float angle = time * 3.14159 * 2.0;
                vec3 sunDir = normalize(vec3(cos(angle), sin(angle), 0.0));
                
                // Blend between day and night
                float dayFactor = max(0.0, sin(angle));
                
                // Sunset/sunrise factor
                float sunsetFactor = pow(1.0 - abs(sin(angle)), 5.0) * step(0.0, sin(angle));
                
                // Sun/moon glow
                float sunGlow = max(0.0, dot(dir, sunDir));
                sunGlow = pow(sunGlow, 32.0) * dayFactor;
                
                // Stars (only visible at night)
                float stars = 0.0;
                if (dayFactor < 0.3) {
                    // Simple noise function for stars
                    vec3 starPos = floor(dir * 100.0);
                    stars = fract(sin(dot(starPos, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                    stars = step(0.995, stars) * (1.0 - dayFactor / 0.3);
                }
                
                // Combine colors
                vec3 skyColor = mix(nightColor, dayColor, dayFactor);
                skyColor = mix(skyColor, sunsetColor, sunsetFactor);
                
                // Add sun/moon and stars
                skyColor += vec3(1.0, 0.9, 0.7) * sunGlow;
                skyColor += vec3(0.8, 0.8, 1.0) * stars;
                
                return skyColor;
            }
            
            void main() {
                vec3 direction = normalize(vWorldPosition);
                vec3 color = getSkyColor(direction, time);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }
}