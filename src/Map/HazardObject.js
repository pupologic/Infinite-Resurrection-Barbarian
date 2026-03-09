// HazardObject.js
// A ground hazard that appears when a fireball or energy ball explodes.
// Shrinks in 5 steps over its lifetime, then disappears.
// type: 'fire' | 'energy'
class HazardObject extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'fire') {
        const TILE = 64;
        // Encaixar no tile mais próximo (centro do tile)
        let tx = Math.floor(x / TILE);
        let ty = Math.floor(y / TILE);

        // Verificação básica de segurança: se o tile central está dentro de uma parede, 
        // tentamos os vizinhos imediatos para não spawnar "dentro" do cenário.
        const isTileBlocked = (tileX, tileY) => {
            const worldX = tileX * TILE + TILE / 2;
            const worldY = tileY * TILE + TILE / 2;

            // 1. Verificar Tilemaps
            if (scene.tileCollisionLayers) {
                for (let layer of scene.tileCollisionLayers) {
                    const tile = layer.getTileAtWorldXY(worldX, worldY);
                    if (tile && tile.collides) return true;
                }
            }

            // 2. Verificar Static Groups (Walls/Rocks)
            const point = new Phaser.Geom.Point(worldX, worldY);
            let blocked = false;
            const groups = [scene.walls, scene.innerWalls, scene.obstacles];
            groups.forEach(g => {
                if (!g || blocked) return;
                g.children.iterate(child => {
                    if (blocked) return;
                    const body = child.body;
                    if (body && Phaser.Geom.Rectangle.Contains(body.x, body.y, body.width, body.height, worldX, worldY)) {
                        blocked = true;
                    }
                });
            });
            return blocked;
        };

        // Se o tile atual estiver bloqueado, tenta vizinhos (Simples: 4 direções)
        if (isTileBlocked(tx, ty)) {
            const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (let [dx, dy] of neighbors) {
                if (!isTileBlocked(tx + dx, ty + dy)) {
                    tx += dx;
                    ty += dy;
                    break;
                }
            }
        }

        const snappedX = tx * TILE + TILE / 2;
        const snappedY = ty * TILE + TILE / 2;

        const sheetKey = type === 'fire' ? 'fire_hazard_sheet' : 'energy_hazard_sheet';
        const animKey = type === 'fire' ? 'fire-hazard-burn' : 'energy-hazard-pulse';

        super(scene, snappedX, snappedY, sheetKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hazardType = type;
        this.body.setImmovable(true);
        this.body.moves = false;

        // --- Config per type ---
        if (type === 'fire') {
            // Player takes 2 damage every 2s while burning, for 12s (faster extinguish)
            this.totalDuration = 12000; // ms total lifetime
            this.steps = 5;     // visual size steps before disappearing
            this.burnDamage = 2;
            this.burnInterval = 2000;  // ms between burn ticks
        } else {
            // Player is paralysed for 2s every 6s
            this.totalDuration = 20000;
            this.steps = 5;
            this.paralyzeTime = 2000;  // ms player stays frozen
            this.paralyzeInterval = 6000; // ms between paralysis applications
        }

        // Scale steps: starts at 1.0 and goes down to 0.2, one step each (totalDuration / steps)
        this.stepDuration = this.totalDuration / this.steps;
        this.currentStep = 0;
        this.stepTimer = this.stepDuration;
        this.baseScale = 1.0;

        // Circle collision (~half frame)
        const radius = 22;
        this.body.setCircle(radius, 0, 0);

        this.play(animKey);
        this.setDepth(y - 1); // Just below characters

        // --- Burn/Paralyze tracking ---
        this.playerInside = false;
        this.effectTimer = 0;

        // Registrar como fonte de luz (raio de 1.1 tiles para luz bem fraca no centro apenas)
        if (typeof scene.addLightSource === 'function') {
            this.lightSource = scene.addLightSource(this, 1.1);
        }
    }

    update(delta, player) {
        if (!this.active || !player || player.isDead) return;

        this.stepTimer -= delta;

        if (this.stepTimer <= 0) {
            this.currentStep++;
            this.stepTimer = this.stepDuration;

            // Decrease scale in discrete steps
            const newScale = this.baseScale * (1 - (this.currentStep / this.steps));
            this.setScale(Math.max(0, newScale));

            if (this.currentStep >= this.steps) {
                this.destroy();
                return;
            }
        }

        // Check proximity to player
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const touchRadius = 40 * this.scaleX; // shrink touch area with scale

        if (dist < touchRadius) {
            if (!this.playerInside) {
                this.playerInside = true;
                this.effectTimer = 0; // trigger immediately on enter
            }

            this.effectTimer -= delta;

            if (this.effectTimer <= 0) {
                const interval = this.hazardType === 'fire' ? this.burnInterval : this.paralyzeInterval;
                this.effectTimer = interval;

                if (this.hazardType === 'fire') {
                    // Apply burn damage
                    if (!player.isBurning) {
                        player.isBurning = true;
                        this._applyBurn(player);
                    }
                } else {
                    // Apply paralysis
                    this._applyParalyze(player);
                }
            }
        } else {
            this.playerInside = false;
        }
    }

    _applyBurn(player) {
        if (!player.active || player.isDead) {
            player.isBurning = false;
            return;
        }

        const scene = this.scene; // Capture scene reference
        const BURN_DURATION = 12000; // ms (matches lifetime)
        const BURN_TICK = 2000;  // ms between ticks
        const BURN_DAMAGE = 2;

        let elapsed = 0;

        // Tint flicker to indicate burning
        player.setTint(0xff6600);
        scene.time.delayedCall(300, () => {
            if (player.active && !player.isDead && !player.isHurt) player.clearTint();
        });

        const burnTick = scene.time.addEvent({
            delay: BURN_TICK,
            callback: () => {
                elapsed += BURN_TICK;
                if (!player.active || player.isDead || elapsed >= BURN_DURATION) {
                    burnTick.remove();
                    player.isBurning = false;
                    return;
                }
                player.takeDamage(BURN_DAMAGE, null);
                // Orange tint flash
                player.setTint(0xff4400);
                scene.time.delayedCall(200, () => {
                    if (player.active && !player.isHurt) player.clearTint();
                });
            },
            repeat: Math.ceil(BURN_DURATION / BURN_TICK) - 1
        });
    }

    _applyParalyze(player) {
        if (!player.active || player.isDead) return;

        const PARALYZE_DURATION = 2000;

        player.isTrapped = true;         // Re-uses the "isTrapped" flag that blocks movement
        player.isParalyzed = true;      // Specific flag for blue tint feedback
        player.setVelocity(0);
        player.setTint(0x8888ff);        // Blue tint = energy shock

        this.scene.time.delayedCall(PARALYZE_DURATION, () => {
            if (player.active) {
                player.isTrapped = false;
                player.isParalyzed = false;
                if (!player.isHurt) player.clearTint();
            }
        });
    }
}
