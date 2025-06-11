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
     * Also includes trees and other features
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
                
                // Random patches of sand (5% chance)
                if (Math.random() < 0.05) {
                    this.addBlock('sand', { x, y: 0, z });
                    
                    // Sometimes make small sand patches (50% chance)
                    if (Math.random() < 0.5) {
                        const directions = [
                            { dx: 1, dz: 0 },
                            { dx: -1, dz: 0 },
                            { dx: 0, dz: 1 },
                            { dx: 0, dz: -1 }
                        ];
                        
                        // Add sand in 1-3 random adjacent positions
                        const numAdjacent = Math.floor(Math.random() * 3) + 1;
                        const shuffled = directions.sort(() => 0.5 - Math.random());
                        
                        for (let i = 0; i < numAdjacent; i++) {
                            const nx = x + shuffled[i].dx;
                            const nz = z + shuffled[i].dz;
                            
                            // Check if position is within world bounds
                            if (nx >= -width/2 && nx < width/2 && nz >= -depth/2 && nz < depth/2) {
                                this.addBlock('sand', { x: nx, y: 0, z: nz });
                            }
                        }
                    }
                }
            }
        }
        
        // Add trees (3-5 trees)
        const numTrees = Math.floor(Math.random() * 3) + 3;
        for (let t = 0; t < numTrees; t++) {
            // Random position for the tree
            const treeX = Math.floor(Math.random() * (width - 4)) - width/2 + 2;
            const treeZ = Math.floor(Math.random() * (depth - 4)) - depth/2 + 2;
            
            // Create tree trunk (3-5 blocks tall)
            const treeHeight = Math.floor(Math.random() * 3) + 3;
            for (let y = 1; y <= treeHeight; y++) {
                this.addBlock('wood', { x: treeX, y, z: treeZ });
            }
            
            // Create tree leaves
            for (let y = treeHeight - 1; y <= treeHeight + 1; y++) {
                for (let x = treeX - 2; x <= treeX + 2; x++) {
                    for (let z = treeZ - 2; z <= treeZ + 2; z++) {
                        // Skip if it's the trunk position
                        if (y <= treeHeight && x === treeX && z === treeZ) {
                            continue;
                        }
                        
                        // Add leaves with some randomness for a more natural look
                        // Corners have lower chance of having leaves
                        const isCorner = (Math.abs(x - treeX) === 2 && Math.abs(z - treeZ) === 2);
                        const isEdge = (Math.abs(x - treeX) === 2 || Math.abs(z - treeZ) === 2);
                        
                        let leafChance = 0.9;
                        if (isCorner) leafChance = 0.3;
                        else if (isEdge) leafChance = 0.7;
                        
                        // Top layer has fewer leaves
                        if (y === treeHeight + 1) {
                            leafChance *= 0.5;
                        }
                        
                        if (Math.random() < leafChance) {
                            this.addBlock('leaves', { x, y, z });
                        }
                    }
                }
            }
        }
        
        // Add some glass blocks as decorative elements (2-4 small structures)
        const numGlassStructures = Math.floor(Math.random() * 3) + 2;
        for (let g = 0; g < numGlassStructures; g++) {
            const glassX = Math.floor(Math.random() * width) - width/2;
            const glassZ = Math.floor(Math.random() * depth) - depth/2;
            
            // Simple glass structure (2x2x2)
            for (let x = glassX; x < glassX + 2; x++) {
                for (let z = glassZ; z < glassZ + 2; z++) {
                    // Check if position is within world bounds
                    if (x >= -width/2 && x < width/2 && z >= -depth/2 && z < depth/2) {
                        this.addBlock('glass', { x, y: 1, z });
                        this.addBlock('glass', { x, y: 2, z });
                    }
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
     * @param {Object} position - The position of the block to remove
     * @returns {boolean} - Whether a block was removed
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
        // Ensure we're working with integer positions
        const x = Math.floor(position.x);
        const y = Math.floor(position.y);
        const z = Math.floor(position.z);
        const posKey = `${x},${y},${z}`;
        return this.blocks[posKey];
    }

    /**
     * Check if a position has a block
     */
    hasBlock(position) {
        // Ensure we're working with integer positions
        const x = Math.floor(position.x);
        const y = Math.floor(position.y);
        const z = Math.floor(position.z);
        const posKey = `${x},${y},${z}`;
        return !!this.blocks[posKey];
    }
}