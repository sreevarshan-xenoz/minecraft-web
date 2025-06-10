/**
 * World class for managing the Minecraft-style world
 */
class World {
    constructor(size = { width: 16, height: 16, depth: 16 }) {
        this.size = size;
        this.blocks = {}; // Object to store blocks by position key
        this.scene = null;
    }

    /**
     * Initialize the world with a Three.js scene
     */
    init(scene) {
        this.scene = scene;
    }

    /**
     * Generate a simple flat world with grass on top, dirt below, and stone at the bottom
     */
    generateFlatWorld() {
        const { width, depth } = this.size;
        
        // Generate a flat world with 1 layer of grass, 3 layers of dirt, and the rest stone
        for (let x = -width/2; x < width/2; x++) {
            for (let z = -depth/2; z < depth/2; z++) {
                // Add grass at y=0
                this.addBlock('grass', { x, y: 0, z });
                
                // Add dirt for the next 3 layers down
                for (let y = -1; y > -4; y--) {
                    this.addBlock('dirt', { x, y, z });
                }
                
                // Add stone for the remaining layers
                for (let y = -4; y > -this.size.height; y--) {
                    this.addBlock('stone', { x, y, z });
                }
            }
        }
    }

    /**
     * Add a block to the world
     */
    addBlock(type, position) {
        const posKey = `${position.x},${position.y},${position.z}`;
        
        // Create a new block
        const block = new Block(type, position);
        
        // Store the block in our blocks object
        this.blocks[posKey] = block;
        
        // Add the block to the scene if we have one
        if (this.scene) {
            block.addToScene(this.scene);
        }
        
        return block;
    }

    /**
     * Remove a block from the world
     */
    removeBlock(position) {
        const posKey = `${position.x},${position.y},${position.z}`;
        
        // Check if the block exists
        if (this.blocks[posKey]) {
            // Remove the block from the scene
            if (this.scene) {
                this.blocks[posKey].removeFromScene(this.scene);
            }
            
            // Remove the block from our blocks object
            delete this.blocks[posKey];
            
            return true;
        }
        
        return false;
    }

    /**
     * Get a block at a specific position
     */
    getBlock(position) {
        const posKey = `${position.x},${position.y},${position.z}`;
        return this.blocks[posKey];
    }

    /**
     * Check if a position has a block
     */
    hasBlock(position) {
        const posKey = `${position.x},${position.y},${position.z}`;
        return !!this.blocks[posKey];
    }
}