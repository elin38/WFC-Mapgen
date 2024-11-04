class ArrayMap extends Phaser.Scene {
    constructor() {
        super("arrayMapScene");
        this.gridWidth = 20;
        this.gridHeight = 15;
        this.tileSize = 64;  // Using 64x64 tiles
    }

    preload() {
        this.load.path = "./assets/";

        // Load base and transition tiles
        this.load.image('water', 'water.png');
        this.load.image('land', 'land.png');
        this.load.image('tree', 'tree.png');
        this.load.image('building', 'building.png');

        this.load.image('tempTest', 'transition.png');

        // Load transition tiles for different water/land configurations
        this.load.image('water_left', 'water_left.png');           // Water on the left
        this.load.image('water_right', 'water_right.png');         // Water on the right
        this.load.image('water_top', 'water_top.png');             // Water above
        this.load.image('water_bottom', 'water_bottom.png');       // Water below
        this.load.image('water_top_left', 'water_top_left.png');   // Water above and left
        this.load.image('water_top_right', 'water_top_right.png'); // Water above and right
        this.load.image('water_bottom_left', 'water_bottom_left.png'); // Water below and left
        this.load.image('water_bottom_right', 'water_bottom_right.png'); // Water below and right
    }

    create() {
        // Generate initial map
        this.generateMap();

        // Add key event for map regeneration
        this.input.keyboard.on('keydown-R', () => {
            this.generateMap();
        });
    }

    generateMap() {
        // Initialize tile grid
        this.tiles = Array.from({ length: this.gridHeight }, () =>
            Array.from({ length: this.gridWidth }, () => ({
                possibleTiles: ['water', 'land'],
                collapsed: false
            }))
        );

        // Main loop:
        this.wfcLoopGeneration();

        // Render generated map
        //this.renderMap();
        //this.addDecorations();
    }

    async wfcLoopGeneration () {
        while (this.hasUncollapsedTiles()) {
            const tile = this.observe();
            this.propagate(tile);
            this.renderMap();
            await this.wait(10);
        }

        this.addDecorations();
    }

    wait(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    // Checks if there are any uncollapsed tiles
    hasUncollapsedTiles() {
        return this.tiles.some(row => row.some(tile => !tile.collapsed));
    }

    // Observe function - Finds tile with lowest entropy and collapses it
    observe() {
        let minEntropy = Infinity;
        let chosenTile = null;

        // Find the tile with the minimum entropy (fewest options)
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.tiles[y][x];
                if (!tile.collapsed && tile.possibleTiles.length < minEntropy) {
                    minEntropy = tile.possibleTiles.length;
                    chosenTile = { x, y };
                }
            }
        }

        if (chosenTile) {
            const { x, y } = chosenTile;
            const tile = this.tiles[y][x];
            const randomTile = Phaser.Math.RND.pick(tile.possibleTiles);

            tile.possibleTiles = [randomTile];
            tile.collapsed = true;
        }

        return chosenTile;
    }

    // Propagate constraints from a tile to its neighbors
    propagate({ x, y }) {
        const stack = [{ x, y }];

        while (stack.length > 0) {
            const current = stack.pop();
            const tile = this.tiles[current.y][current.x];

            // For each neighbor, reduce possible tiles based on this tile's constraints
            const neighbors = this.getNeighbors(current.x, current.y);

            neighbors.forEach(({ nx, ny }) => {
                const neighborTile = this.tiles[ny][nx];
                if (!neighborTile.collapsed) {
                    const newPossibleTiles = neighborTile.possibleTiles.filter((neighborType) => {
                        // Allow both land and water neighbors
                        return true;
                    });

                    if (newPossibleTiles.length < neighborTile.possibleTiles.length) {
                        neighborTile.possibleTiles = newPossibleTiles;
                        stack.push({ x: nx, y: ny });
                    }
                }
            });
        }
    }

    // Helper to get neighbors within bounds
    getNeighbors(x, y) {
        const neighbors = [];
        if (x > 0) neighbors.push({ nx: x - 1, ny: y });
        if (x < this.gridWidth - 1) neighbors.push({ nx: x + 1, ny: y });
        if (y > 0) neighbors.push({ nx: x, ny: y - 1 });
        if (y < this.gridHeight - 1) neighbors.push({ nx: x, ny: y + 1 });
        return neighbors;
    }

    // Render the tile map based on the WFC results
    renderMap() {
        this.cameras.main.setBounds(0, 0, this.gridWidth * this.tileSize, this.gridHeight * this.tileSize);
        this.add.existing(this.cameras.main);

        this.tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile.collapsed) {
                    const tileType = tile.possibleTiles[0]; // Should be collapsed to one
                    this.add.image(x * this.tileSize, y * this.tileSize, tileType).setOrigin(0);
                }
                else {
                    const tileType = 'tempTest'; // Should be collapsed to one
                    this.add.image(x * this.tileSize, y * this.tileSize, tileType).setOrigin(0);
                }
            });
        });
    }

    // Adds decorations such as trees or buildings
    addDecorations() {
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(0, this.gridWidth - 1);
            const y = Phaser.Math.Between(0, this.gridHeight - 1);
            const tile = this.tiles[y][x];

            if (tile.possibleTiles[0] === 'land') {
                const decoration = Phaser.Math.RND.pick(['tree', 'building']);
                this.add.image(x * this.tileSize, y * this.tileSize, decoration).setOrigin(0);
            }
        }
    }
}
