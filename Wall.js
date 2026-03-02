class Wall extends Phaser.Physics.Arcade.Sprite {
    // --- REGISTRO DE COLISÕES OTIMIZADO ---
    // Priorizamos caixas fixas para tilesets conhecidos por performance.
    static TILE_COLLISION_REGISTRY = {
        'ground_slice': {
            0: { w: 64, h: 64, offX: 0, offY: 0 },  // Topo Esq
            1: { w: 64, h: 64, offX: 0, offY: 0 },  // Topo Mid
            2: { w: 64, h: 64, offX: 0, offY: 0 },  // Topo Dir
            3: { w: 64, h: 64, offX: 0, offY: 0 },  // Esq
            5: { w: 64, h: 64, offX: 0, offY: 0 },  // Dir
            6: { w: 64, h: 64, offX: 0, offY: 0 },  // Base Esq
            7: { w: 64, h: 64, offX: 0, offY: 0 },  // Base Mid
            8: { w: 64, h: 64, offX: 0, offY: 0 },  // Base Dir
        },
        'inner_corner_sheet': {
            0: { w: 48, h: 48, offX: -8, offY: -8 },  // Frame 0 (Ajuste conforme necessário)
            1: { w: 48, h: 48, offX: 8, offY: -8 }, // Frame 1
            2: { w: 48, h: 48, offX: -8, offY: 8 }, // Frame 2
            3: { w: 48, h: 48, offX: 8, offY: 8 },// Frame 3
        }
    };

    constructor(scene, x, y, texture, frame, options = {}) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);

        this.angleIndex = options.rotation || 0; // 0=0, 1=90, 2=180, 3=270
        this.setAngle(this.angleIndex * 90);

        // Sprite Visual
        scene.physics.add.existing(this, true);
        if (this.body) this.body.enable = false;

        this._collisionGroup = options.collisionGroup || null;
        this.collisionZones = [];

        const colDef = options.collisionDefinition;
        const registry = Wall.TILE_COLLISION_REGISTRY[texture];

        // PRIORIDADE: 
        // 1. Registro Otimizado (Hardcoded para ground_slice)
        // 2. Custom (Grid vinda do Map Manager)
        // 3. Legacy/Generic
        if (registry && registry[frame]) {
            this.setupHardcodedCollision(registry[frame], options);
        } else if (colDef) {
            this.setupCustomCollision(colDef, options);
        } else {
            this.setupLegacyCollision(frame, options);
        }

        this.setDepth(y);

        // Register this Wall sprite visual for level-transition cleanup
        if (scene.wallSprites) scene.wallSprites.add(this);
    }

    setupHardcodedCollision(config, options) {
        let cWidth = config.w || 64;
        let cHeight = config.h || 64;
        let offX = config.offX || 0;
        let offY = config.offY || 0;

        // Rotacionar offsets e dimensões baseados no "angleIndex" (0, 1, 2, 3)
        // 1 = 90 deg CW, 2 = 180 deg, 3 = 270 deg CW
        if (this.angleIndex === 1) { // 90 CW: (x, y) -> (-y, x)
            const tempX = offX;
            offX = -offY;
            offY = tempX;
            // Swap width/height
            const tempW = cWidth;
            cWidth = cHeight;
            cHeight = tempW;
        } else if (this.angleIndex === 2) { // 180: (x,y) -> (-x, -y)
            offX = -offX;
            offY = -offY;
        } else if (this.angleIndex === 3) { // 270 CW: (x, y) -> (y, -x)
            const tempX = offX;
            offX = offY;
            offY = -tempX;
            // Swap width/height
            const tempW = cWidth;
            cWidth = cHeight;
            cHeight = tempW;
        }

        const zone = this.scene.add.zone(this.x + offX, this.y + offY, cWidth, cHeight);
        this.scene.physics.add.existing(zone, true);
        zone.body.setSize(cWidth, cHeight);
        this.addZone(zone);

        if (this.scene.physics.config.debug) {
            const debugRect = this.scene.add.rectangle(this.x + offX, this.y + offY, cWidth, cHeight, 0x00ff00, 0.3);
            debugRect.setDepth(this.depth + 1);
            if (this.scene.debugShapes) this.scene.debugShapes.add(debugRect);
        }
    }

    setupCustomCollision(colDef, options) {
        const tileSize = options.tileSize || 64;

        if (colDef.type === 'grid') {
            const cellSize = tileSize / 8;
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const isActive = colDef.data[row * 8 + col];
                    if (isActive) {
                        // Transformar coordenadas baseadas na rotação
                        let rx = col;
                        let ry = row;

                        // Rotação: 1=90deg, 2=180deg, 3=270deg
                        if (this.angleIndex === 1) { // 90 CW: (x,y) -> (7-y, x)
                            rx = 7 - row;
                            ry = col;
                        } else if (this.angleIndex === 2) { // 180: (x,y) -> (7-x, 7-y)
                            rx = 7 - col;
                            ry = 7 - row;
                        } else if (this.angleIndex === 3) { // 270 CW: (x,y) -> (y, 7-x)
                            rx = row;
                            ry = 7 - col;
                        }

                        this.createZoneFromGrid(rx, ry, 1, 1, cellSize, tileSize);
                    }
                }
            }
        } else if (colDef.type === 'circle') {
            const halfTile = tileSize / 2;
            const radius = colDef.radius * halfTile;
            const zone = this.scene.add.zone(this.x, this.y, radius * 2, radius * 2);
            this.scene.physics.add.existing(zone, true);
            zone.body.setCircle(radius);
            this.addZone(zone);
        }
    }

    createZoneFromGrid(gridX, gridY, gridW, gridH, cellSize, tileSize) {
        const w = gridW * cellSize;
        const h = gridH * cellSize;
        // Posicionamento relativo ao centro do tile
        const offX = (gridX * cellSize) + (w / 2) - (tileSize / 2);
        const offY = (gridY * cellSize) + (h / 2) - (tileSize / 2);

        const zone = this.scene.add.zone(this.x + offX, this.y + offY, w, h);
        this.scene.physics.add.existing(zone, true);
        zone.body.setSize(w, h);
        this.addZone(zone);

        // Representação Visual da Colisão (opcional para debug)
        if (this.scene.physics.config.debug) {
            const debugRect = this.scene.add.rectangle(this.x + offX, this.y + offY, w, h, 0xff0000, 0.3);
            debugRect.setDepth(this.depth + 1);
            if (this.scene.debugShapes) this.scene.debugShapes.add(debugRect);
        }
    }

    addZone(zone) {
        this.collisionZones.push(zone);
        // Usa o grupo de colisão especificado nas options, ou o grupo padrão de walls da cena
        const targetGroup = this._collisionGroup || (this.scene ? this.scene.walls : null);
        if (targetGroup) {
            targetGroup.add(zone);
        }
    }

    setupLegacyCollision(frame, options) {
        // 1. Tenta buscar a configuração global para este frame
        const frameConfig = Wall.collisionConfig[frame] || {};

        // 2. Determina dimensões
        const cWidth = options.collisionWidth || frameConfig.w || 64;
        const cHeight = options.collisionHeight || frameConfig.h || 64;

        // 3. Determina deslocamentos
        const offX = options.offsetX !== undefined ? options.offsetX : (frameConfig.offX || 0);
        const offY = options.offsetY !== undefined ? options.offsetY : (frameConfig.offY || 0);

        const zone = this.scene.add.zone(this.x + offX, this.y + offY, cWidth, cHeight);
        this.scene.physics.add.existing(zone, true);
        zone.body.setSize(cWidth, cHeight);
        this.addZone(zone);
    }
}
