class Rock extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, frameIndex, obj = null) {
        super(scene, x, y, 'rock', frameIndex);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // --- PHYSICS CONFIG (Frozen Dynamic Body) ---
        // This allows custom offsets to work reliably like in Portal.js
        this.body.setImmovable(true);
        this.body.moves = false;
        if (this.body.setAllowGravity) this.body.setAllowGravity(false);

        // --- ADJUSTABLE COLLISION PARAMETERS ---
        // Frame size is 96x96. Offsets are from top-left (0,0).
        let radius = 26;
        let setX = 22; // Default: centered horizontally (48 - 24)
        let setY = 45; // Default: slightly below center (48 - 24 + 12)

        // If properties exist in Tiled object, override defaults
        if (obj && obj.properties) {
            const pRadius = obj.properties.find(p => p.name === 'radius')?.value;
            const pSetX = obj.properties.find(p => p.name === 'offsetX')?.value;
            const pSetY = obj.properties.find(p => p.name === 'offsetY')?.value;

            if (pRadius !== undefined) radius = pRadius;
            if (pSetX !== undefined) setX = pSetX;
            if (pSetY !== undefined) setY = pSetY;
        }

        // Apply collision
        this.body.setCircle(radius, setX, setY);
        // --------------------------------------

        this.hp = 8;
        this.isBroken = false;
        this.originalFrame = frameIndex;

        // Depth based on Y for pseudo-3D overlap
        this.setDepth(y);

        // Hit tracking (same logic as enemies/traps)
        this.lastHitPunchId = -1;
        this.lastHitPunchFrame = -1;
    }

    takeDamage(amount) {
        if (this.isBroken) return;

        this.hp -= amount;

        if (this.hp > 0) {
            // Visual feedback (shake) - Only when hit but NOT broken
            this.scene.tweens.add({
                targets: this,
                x: this.x + (Math.random() - 0.5) * 4,
                duration: 50,
                yoyo: true,
                repeat: 2
            });
        } else {
            this.break();
        }
    }

    break() {
        if (this.isBroken) return;
        this.isBroken = true;

        // Keep collision enabled as per user request
        // Switch to the last frame (index 8 in a 3x3 sheet)
        this.setFrame(8);

        // Feedback sound
        if (this.scene.sound) {
            this.scene.sound.play('Explosion', { volume: 0.4 });
        }

        // Slight scale down effect for "crumbling"
        this.scene.tweens.add({
            targets: this,
            scale: 0.9,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }
}
