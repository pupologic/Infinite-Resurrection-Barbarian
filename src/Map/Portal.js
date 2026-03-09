class Portal extends Phaser.Physics.Arcade.Sprite {
    static createAnimations(scene) {
        if (scene.textures.exists('portal_sheet')) return;

        const texture = scene.textures.get('portal_full');
        const frameWidth = texture.source[0].width / 4;
        const frameHeight = texture.source[0].height / 4;

        scene.textures.addSpriteSheet('portal_sheet', texture.source[0].image, {
            frameWidth: frameWidth,
            frameHeight: frameHeight
        });

        scene.anims.create({
            key: 'portal_swirl',
            frames: scene.anims.generateFrameNumbers('portal_sheet', { start: 0, end: 15 }),
            frameRate: 12,
            repeat: -1
        });
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'portal_sheet');
        scene.add.existing(this);
        scene.physics.add.existing(this); // Dynamic Body allows offsets
        this.body.setImmovable(true);
        this.body.moves = false;

        // Circle collision with radius = half tile size (64/2 = 32)
        const radius = 32;
        const offsetX = 18;
        const offsetY = 16;
        this.body.setCircle(radius, offsetX, offsetY);

        this.setDepth(-15000);
        this.play('portal_swirl');

        // Optional: still keep a slight pulse or remove if animation is enough
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
    }
}
