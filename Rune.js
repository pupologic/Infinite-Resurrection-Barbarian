class Rune extends Phaser.Physics.Arcade.Sprite {
    // Frame index → ability name (for display/debugging)
    static FRAME_LABELS = ['Dash', 'Jump Kick', 'Punch', 'Ground Pound', 'Roar', 'Shield'];

    // How to detect if the player is currently using each ability
    static ABILITY_CHECKS = [
        (p) => p.isGroundDashing,     // 0 — Dash
        (p) => p.isJumpKicking,       // 1 — Jump Kick
        (p) => p.isAttacking,         // 2 — Punch
        (p) => p.isPounding,          // 3 — Ground Pound
        (p) => p.isRoaring,           // 4 — Roar
        (p) => p.isDefending,         // 5 — Shield
    ];

    // Hint texts for each rune (what button/action to use)
    static HINT_TEXTS = [
        "SHIFT para Deslizar",      // 0 — Dash
        "SPACE e Soque para Chutar",      // 1 — Jump Kick
        "Click ou J para Socar", // 2 — Punch
        "Q para Derrubar",           // 3 — Ground Pound
        "R para Rugir",           // 4 — Roar
        "F para Defender",           // 5 — Shield
    ];

    static createAnimations(scene) {
        if (scene.textures.exists('runes_sheet')) return;

        const tex = scene.textures.get('runes_full');
        // The tilesheet is a 3x3 grid (3 columns x 3 rows)
        const frameWidth = Math.floor(tex.source[0].width / 3);
        const frameHeight = Math.floor(tex.source[0].height / 3);

        scene.textures.addSpriteSheet('runes_sheet', tex.source[0].image, {
            frameWidth,
            frameHeight
        });
    }

    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} frameIndex  0–5, selects which ability destroys this rune
     * @param {object} options Optional: { radius, offsetX, offsetY }
     */
    constructor(scene, x, y, frameIndex = 0, options = {}) {
        super(scene, x, y, 'runes_sheet', frameIndex);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body

        this.frameIndex = Phaser.Math.Clamp(frameIndex, 0, 5);
        this.isBroken = false;
        this.abilityCheck = Rune.ABILITY_CHECKS[this.frameIndex];

        this.setDepth(y);
        this.setImmovable(true);

        // Use standard rectangular collision with manual offset control
        const cWidth = options.width || options.collisionWidth || (this.width * 0.6);
        const cHeight = options.height || options.collisionHeight || (this.height * 0.6);
        const offX = options.offsetX !== undefined ? options.offsetX : ((this.width - cWidth) / 2);
        const offY = options.offsetY !== undefined ? options.offsetY : ((this.height - cHeight) / 2);

        this.body.setSize(cWidth, cHeight);
        this.body.setOffset(offX, offY);

        // Create Hint Text (initially invisible)
        this.hintText = scene.add.text(x, y - 50, Rune.HINT_TEXTS[this.frameIndex], {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(y + 100).setAlpha(0);
    }

    /**
     * Updates visibility of the hint text and checks for proximity or external FX destruction 
     * (especially important for AoE attacks like Roar and Pound)
     */
    update(player) {
        if (this.isBroken || !this.active) {
            if (this.hintText.alpha > 0) this.hintText.setAlpha(0);
            return;
        }

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const showRange = 120; // Distance to show the hint

        // Hint visibility
        if (dist < showRange) {
            if (this.hintText.alpha < 1) this.hintText.setAlpha(1);
        } else {
            if (this.hintText.alpha > 0) this.hintText.setAlpha(0);
        }

        // Destruction logic via proximity or external FX
        if (this.frameIndex === 3) {
            // Ground Pound: Check for overlap with FX sprites ("pedras/objetos")
            if (this.scene.poundFxGroup) {
                this.scene.poundFxGroup.getChildren().forEach(fx => {
                    const fxDist = Phaser.Math.Distance.Between(this.x, this.y, fx.x, fx.y);
                    if (fxDist < 40) { // If a stone is close enough to the rune
                        this.tryBreak(player);
                    }
                });
            }
        } else {
            // Roar (4) has a larger AOE, others are closer
            let breakRange = 60;
            if (this.frameIndex === 4) breakRange = 120;

            if (dist <= breakRange) {
                if (this.abilityCheck(player)) {
                    this.tryBreak(player);
                }
            }
        }
    }

    /**
     * Called when the player overlaps this rune.
     * Only breaks when the correct ability is active.
     */
    tryBreak(player) {
        if (this.isBroken) return;
        if (!this.abilityCheck(player)) return;

        this.isBroken = true;

        // Restore Player Health and Stamina
        player.heal(100);
        player.stamina = player.maxStamina;

        // Kill tweens & disable physics
        this.scene.tweens.killTweensOf(this);
        this.alpha = 1;
        this.body.enable = false;
        this.hintText.setAlpha(0);

        // Switch to destroyed frame
        this.setFrame(6);

        // White flash
        this.setTint(0xffffff);
        this.scene.time.delayedCall(80, () => {
            if (this.active) this.clearTint();
        });

        // Camera shake
        this.scene.cameras.main.shake(120, 0.006);

        // Small particle burst (circles)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = Phaser.Math.Between(20, 50);
            const px = this.x + Math.cos(angle) * dist * 0.3;
            const py = this.y + Math.sin(angle) * dist * 0.3;
            const particle = this.scene.add.circle(px, py, Phaser.Math.Between(3, 6), 0xffd700, 1);
            particle.setDepth(this.depth + 1);
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * dist,
                y: this.y + Math.sin(angle) * dist,
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Broken runes now stay visible at frame index 6 (the 7th frame)
    }
}
