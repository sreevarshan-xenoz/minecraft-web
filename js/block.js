/**
 * Block class for handling Minecraft-style blocks
 */
class Block {
    constructor(type, position) {
        this.type = type;
        this.position = position;
        this.mesh = null;
        this.createMesh();
    }

    /**
     * Create a Three.js mesh for this block based on its type
     */
    createMesh() {
        // Create geometry (all blocks are 1x1x1 cubes)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create materials based on block type
        let materials = [];
        
        switch(this.type) {
            case 'grass':
                // Create materials for each face of the cube
                // Top face is grass, sides are dirt with grass on top, bottom is dirt
                const topTexture = new THREE.TextureLoader().load('textures/grass.svg');
                const sideTexture = new THREE.TextureLoader().load('textures/dirt.svg');
                
                // Create an array of materials for each face
                materials = [
                    new THREE.MeshBasicMaterial({ map: sideTexture }), // right face
                    new THREE.MeshBasicMaterial({ map: sideTexture }), // left face
                    new THREE.MeshBasicMaterial({ map: topTexture }),  // top face
                    new THREE.MeshBasicMaterial({ map: sideTexture }), // bottom face
                    new THREE.MeshBasicMaterial({ map: sideTexture }), // front face
                    new THREE.MeshBasicMaterial({ map: sideTexture })  // back face
                ];
                break;
                
            case 'dirt':
                const dirtTexture = new THREE.TextureLoader().load('textures/dirt.svg');
                materials = Array(6).fill(new THREE.MeshBasicMaterial({ map: dirtTexture }));
                break;
                
            case 'stone':
                const stoneTexture = new THREE.TextureLoader().load('textures/stone.svg');
                materials = Array(6).fill(new THREE.MeshBasicMaterial({ map: stoneTexture }));
                break;
                
            case 'wood':
                const woodTexture = new THREE.TextureLoader().load('textures/wood.svg');
                materials = Array(6).fill(new THREE.MeshBasicMaterial({ map: woodTexture }));
                break;
                
            case 'leaves':
                const leavesTexture = new THREE.TextureLoader().load('textures/leaves.svg');
                materials = Array(6).fill(new THREE.MeshBasicMaterial({ 
                    map: leavesTexture,
                    transparent: true,
                    opacity: 0.9
                }));
                break;
                
            case 'sand':
                const sandTexture = new THREE.TextureLoader().load('textures/sand.svg');
                materials = Array(6).fill(new THREE.MeshBasicMaterial({ map: sandTexture }));
                break;
                
            case 'glass':
                const glassTexture = new THREE.TextureLoader().load('textures/glass.svg');
                materials = Array(6).fill(new THREE.MeshBasicMaterial({ 
                    map: glassTexture,
                    transparent: true,
                    opacity: 0.6
                }));
                break;
                
            default:
                // Default is a simple colored cube
                materials = Array(6).fill(new THREE.MeshBasicMaterial({ color: 0xAAAAAA }));
        }
        
        // Create mesh with geometry and material
        this.mesh = new THREE.Mesh(geometry, materials);
        
        // Set position
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }

    /**
     * Add this block to a Three.js scene
     */
    addToScene(scene) {
        if (this.mesh) {
            scene.add(this.mesh);
        }
    }

    /**
     * Remove this block from a Three.js scene
     */
    removeFromScene(scene) {
        if (this.mesh) {
            scene.remove(this.mesh);
        }
    }
}