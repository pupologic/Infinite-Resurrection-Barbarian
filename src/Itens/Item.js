class Item extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, extra = {}) {
        // Generate texture if not exists
        let color = 0xffffff;
        if (type === 'HEALTH') color = 0xff0000;
        else if (type === 'SPEED') color = 0x0000ff;
        else if (type === 'COIN') color = 0xffff00;
        else if (type === 'STRENGTH') color = 0x800080;
        else if (type === 'STAMINA') color = 0x00ffff;
        else if (type === 'MEAT') color = 0xff8844;
        else if (type === 'HAM') color = 0xff99aa;

        let key = `item_${type}`;
        if (type === 'HEALTH') key = 'heart_item';
        if (type === 'STAMINA') key = 'stamina_item';
        if (type === 'COIN') key = 'coin_item';
        if (type === 'STRENGTH') key = 'force_item';
        if (type === 'SPEED') key = 'speed_item';
        if (type === 'KEY') key = 'key_item';
        if (type === 'TORCH') key = 'torch_item';
        if (type === 'MEAT') key = 'meat_item';
        if (type === 'HAM') key = 'ham_item';

        if (!scene.textures.exists(key)) {
            // Procedural fallback only for truly missing textures (should rarely happen now)
            const graphics = scene.make.graphics();
            graphics.fillStyle(color);
            graphics.fillRect(4, 4, 8, 12);
            graphics.generateTexture(key, 16, 16);
        }

        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type = type;
        this.extra = extra;
        this.setDepth(y);

        // --- GLOW EFFECT ---
        const glowKey = 'item_glow';
        if (!scene.textures.exists(glowKey)) {
            const glowGraphics = scene.make.graphics();
            glowGraphics.fillStyle(0xffffff, 1);
            glowGraphics.fillCircle(16, 16, 14);
            // Apply a slight gradient or blur could be nice, but simple circle for now
            glowGraphics.generateTexture(glowKey, 32, 32);
        }

        this.glow = scene.add.image(x, y, glowKey);
        this.glow.setTint(color);
        this.glow.setAlpha(0.4);
        this.glow.setBlendMode('ADD');
        this.glow.setScale(1.2);
        this.glow.setDepth(this.depth - 1);

        // Glow pulsing animation
        scene.tweens.add({
            targets: this.glow,
            scale: 1.2,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Random value for coin
        if (type === 'COIN') {
            this.value = Phaser.Math.Between(1, 10);
        } else {
            this.value = 0;
        }

        // Bobbing animation?
        if (!extra.noInitialBob) {
            this.startFloating();
        }

        // Registrar como fonte de luz (raio pequeno de 1.5 tiles)
        if (typeof scene.addLightSource === 'function') {
            this.lightSource = scene.addLightSource(this, 1.5);
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.glow) {
            this.glow.setPosition(this.x, this.y);
            this.glow.setVisible(this.visible);
            this.glow.setDepth(this.depth - 1);
        }
    }

    startFloating() {
        this.startY = this.y;
        this.scene.tweens.add({
            targets: [this, this.glow],
            y: this.y - 12, // Increased bobbing height
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    destroy(fromScene) {
        if (this.glow) {
            this.glow.destroy();
        }
        super.destroy(fromScene);
    }
}
