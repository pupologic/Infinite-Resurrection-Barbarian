class Trap extends Phaser.Physics.Arcade.Sprite {
    static createAnimations(scene) {
        if (scene.textures.exists('spike_trap_sheet')) return;

        const texture = scene.textures.get('spike_trap_full');
        // Based on 128x128 image with 4 tiles (2x2 grid)
        const frameWidth = texture.source[0].width / 2;
        const frameHeight = texture.source[0].height / 2;

        scene.textures.addSpriteSheet('spike_trap_sheet', texture.source[0].image, {
            frameWidth: frameWidth,
            frameHeight: frameHeight
        });

        scene.anims.create({
            key: 'spike_trap_activate',
            frames: scene.anims.generateFrameNumbers('spike_trap_sheet', { start: 0, end: 3 }),
            frameRate: 12, // Control speed here
            repeat: 0
        });
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'spike_trap_sheet', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.setImmovable(true);
        // Hitbox 48x48 for 64x64 sprite
        this.body.setSize(48, 48);
        this.setDepth(-15000);

        this.isAnimating = false;
        this.overlappingPlayer = null;

        // Sync damage with the 4th frame (index 3)
        this.on('animationupdate', (anim, frame) => {
            // frame.index 3 is the 4th frame. 
            // isReverse check ensures we only hit when going OUT, not during the reset.
            if (anim.key === 'spike_trap_activate' && frame.index === 3 && !this.anims.isReverse) {
                this.dealDamageIfPossible();
            }
        });
    }

    onUnitOverlap(unit) {
        // If unit is already overlapping this trap, just update reference
        if (this.overlappingUnits && !this.overlappingUnits.includes(unit)) {
            this.overlappingUnits.push(unit);
        } else {
            if (!this.overlappingUnits) this.overlappingUnits = [unit];
        }

        if (!this.isAnimating) {
            this.activate();
        }
    }

    activate() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // 1. Play animation forward (0 -> 1 -> 2 -> 3)
        this.play('spike_trap_activate');

        // 2. When forward animation reaches the end (frame 3)
        this.once('animationcomplete-spike_trap_activate', () => {
            // 3. Wait 1 second at the last frame
            this.scene.time.delayedCall(1000, () => {
                if (this.active) {
                    this.reverseAnimation();
                }
            });
        });
    }

    dealDamageIfPossible() {
        if (this.overlappingUnits) {
            this.overlappingUnits.forEach(unit => {
                if (unit && unit.active && !unit.isDead) { // Check active and dead
                    if (this.scene.physics.overlap(this, unit)) {
                        unit.takeDamage(10);
                        // If it's an enemy, make it flee
                        if (unit instanceof Enemy) {
                            unit.fleeFrom(this.x, this.y);
                        }
                    }
                }
            });
            // Cleanup dead/inactive units
            this.overlappingUnits = this.overlappingUnits.filter(u => u.active && !u.isDead);
        }
    }

    reverseAnimation() {
        // 4. Play animation in reverse (3 -> 2 -> 1 -> 0)
        this.playReverse('spike_trap_activate');

        // 5. When reverse is done
        this.once('animationcomplete-spike_trap_activate', () => {
            this.isAnimating = false;

            // 6. If any unit is STILL on the spike after reset, loop the cycle
            let anyOverlap = false;
            if (this.overlappingUnits) {
                this.overlappingUnits = this.overlappingUnits.filter(u => u.active && !u.isDead); // Cleanup
                this.overlappingUnits.forEach(unit => {
                    if (this.scene.physics.overlap(this, unit)) {
                        anyOverlap = true;
                    }
                });
            }

            if (anyOverlap) {
                this.activate();
            }
        });
    }

    reset() {
        this.isAnimating = false;
        this.overlappingUnits = [];
        this.setFrame(0);
        this.stop();
    }
}
