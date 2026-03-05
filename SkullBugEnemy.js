class SkullBugEnemy extends Enemy {
    static createAnimations(scene) {
        const walkTexture = scene.textures.get('skullbug_walk_full');
        const idleTexture = scene.textures.get('skullbug_idle_full');
        const attackTexture = scene.textures.get('skullbug_attack_full');
        const deadTexture = scene.textures.get('skullbug_dead_full');
        const hurtTexture = scene.textures.get('skullbug_hurt_full');

        // All sheets seem to follow the 8x8 pattern (8 directions, 8 frames each)
        // Except hurt which is usually 1x3 or similar for 3 rows
        const walkFW = walkTexture.source[0].width / 8;
        const walkFH = walkTexture.source[0].height / 8;
        const idleFW = idleTexture.source[0].width / 8;
        const idleFH = idleTexture.source[0].height / 8;
        const attackFW = attackTexture.source[0].width / 8;
        const attackFH = attackTexture.source[0].height / 8;
        const deadFW = deadTexture.source[0].width / 8;
        const deadFH = deadTexture.source[0].height / 8;

        // Hurt usually has one frame per direction, in 3x3 or similar?
        // Let's assume 3x3 for hurt (like Skeleton/Demon)
        const hurtFW = hurtTexture.source[0].width / 3;
        const hurtFH = hurtTexture.source[0].height / 3;

        scene.textures.addSpriteSheet('skullbug_walk', walkTexture.source[0].image, { frameWidth: walkFW, frameHeight: walkFH });
        scene.textures.addSpriteSheet('skullbug_idle', idleTexture.source[0].image, { frameWidth: idleFW, frameHeight: idleFH });
        scene.textures.addSpriteSheet('skullbug_attack', attackTexture.source[0].image, { frameWidth: attackFW, frameHeight: attackFH });
        scene.textures.addSpriteSheet('skullbug_dead', deadTexture.source[0].image, { frameWidth: deadFW, frameHeight: deadFH });
        scene.textures.addSpriteSheet('skullbug_hurt', hurtTexture.source[0].image, { frameWidth: hurtFW, frameHeight: hurtFH });

        const directions = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
        directions.forEach((dir, rowIndex) => {
            // Walk animation
            scene.anims.create({
                key: `skullbug-walk-${dir}`,
                frames: scene.anims.generateFrameNumbers('skullbug_walk', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 15, repeat: -1
            });
            // Idle
            scene.anims.create({
                key: `skullbug-idle-${dir}`,
                frames: scene.anims.generateFrameNumbers('skullbug_idle', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 10, repeat: -1
            });
            // Attack animation
            scene.anims.create({
                key: `skullbug-attack-${dir}`,
                frames: scene.anims.generateFrameNumbers('skullbug_attack', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 15, repeat: 0
            });
            // Dead animation
            scene.anims.create({
                key: `skullbug-dead-${dir}`,
                frames: scene.anims.generateFrameNumbers('skullbug_dead', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: 0
            });
            // Hurt animation
            scene.anims.create({
                key: `skullbug-hurt-${dir}`,
                frames: scene.anims.generateFrameNumbers('skullbug_hurt', { start: rowIndex, end: rowIndex }),
                frameRate: 1, repeat: 0
            });
        });
    }

    constructor(scene, x, y) {
        // SkullBug shadow control
        const shadowWidth = 55;
        const shadowHeight = 25;
        const shadowYOffset = 0; // Default offset is 15 in Enemy class, adjusted here

        super(scene, x, y, 'skullbug_walk', shadowWidth, shadowHeight, shadowYOffset);

        this.animPrefix = 'skullbug';

        // SkullBug stats: Very fast, low HP, low damage
        this.hp = 10;
        this.maxHp = 10;
        this.speed = 130;  // High speed
        this.damage = 2;   // Low damage

        // Vision and interaction ranges
        this.baseVisionRange = 250; // Reduzido para não seguir de tão longe
        this.visionRange = this.baseVisionRange;
        this.minDistance = 45; // Closer range because it's small

        // Visual adjustment for SkullBug (likely smaller than DemonBull)
        // Original: this.body.setCircle(20, 32, 32)
        // We'll scale it down a bit
        this.body.setCircle(14, 34, 38);
        this.setScale(1); // Just in case it's too tiny, but usually bugs are small
    }

    update(time, delta, player, obstacles) {
        // Garantir que o visionRange não aumente (sobrescrevendo o comportamento da classe base)
        this.visionRange = this.baseVisionRange;
        super.update(time, delta, player, obstacles);
    }
}
