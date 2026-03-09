class HoldingTrap extends Phaser.Physics.Arcade.Sprite {
    static createAnimations(scene) {
        if (scene.textures.exists('lock_trap_sheet')) return;

        const texture = scene.textures.get('lock_trap_full');
        // Image is 128x128, with 4 tiles in a 2x2 grid (64x64 each)
        const frameWidth = texture.source[0].width / 2;
        const frameHeight = texture.source[0].height / 2;

        scene.textures.addSpriteSheet('lock_trap_sheet', texture.source[0].image, {
            frameWidth: frameWidth,
            frameHeight: frameHeight
        });

        scene.anims.create({
            key: 'lock_trap_trigger',
            frames: scene.anims.generateFrameNumbers('lock_trap_sheet', { start: 0, end: 3 }),
            frameRate: 15,
            repeat: 0
        });
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'lock_trap_sheet', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.setImmovable(true);
        this.setDepth(-15000);
        // Hitbox slightly smaller than visual (64x64 -> 48x48)
        this.body.setSize(48, 48);

        this.hp = 3; // Hits to break
        this.triggered = false;
        this.damageRadius = 60; // Interaction/Overlap size

        // --- POSITION CONFIGURATION ---
        // Adjust these values to change where the player stands when trapped
        this.playerOffset = { x: 0, y: -15 };
    }

    trigger(player) {
        if (this.triggered) return;
        this.triggered = true;

        // Play the locking animation
        this.play('lock_trap_trigger');

        // Store player ref
        this.trappedPlayer = player;

        // Trap the player state
        player.isTrapped = true;
        player.setVelocity(0);
        // Important: We DON'T use player.setImmovable(true) anymore.
        // If the player is immovable, some collision/overlap checks might fail.
        // Movement is already blocked by 'isTrapped' inside Player.js.

        player.setPosition(this.x + this.playerOffset.x, this.y + this.playerOffset.y);

        // Trigger player shake visual
        if (player.shake) {
            player.shake();
        }
    }

    takeDamage(amount) {
        if (!this.triggered) return false;

        this.hp -= amount;
        console.log("HITTING TRAP! HP:", this.hp);

        // Visual feedback for being hit
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.hp <= 0) {
            this.breakTrap();
        }
        return true;
    }

    breakTrap() {
        // Release player from capture
        if (this.trappedPlayer) {
            this.trappedPlayer.isTrapped = false;
            this.trappedPlayer.setImmovable(false);
            this.trappedPlayer = null;
        }

        // Particle effect or simple destroy
        this.destroy();
    }
}
