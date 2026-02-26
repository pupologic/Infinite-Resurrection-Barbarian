class Item extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, extra = {}) {
        // Generate texture if not exists
        let color = 0xffffff;
        if (type === 'HEALTH') color = 0xff0000;
        else if (type === 'SPEED') color = 0x0000ff;
        else if (type === 'COIN') color = 0xffff00;
        else if (type === 'STRENGTH') color = 0x800080;
        else if (type === 'STAMINA') color = 0x00ffff;

        let key = `item_${type}`;
        if (type === 'HEALTH') key = 'heart_item';
        if (type === 'STAMINA') key = 'stamina_item';
        if (type === 'COIN') key = 'coin_item';
        if (type === 'STRENGTH') key = 'force_item';
        if (type === 'SPEED') key = 'speed_item';
        if (type === 'KEY') key = 'key_item';

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
    }

    startFloating() {
        this.startY = this.y;
        this.scene.tweens.add({
            targets: this,
            y: this.y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }
}
