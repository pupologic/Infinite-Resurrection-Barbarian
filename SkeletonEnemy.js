class SkeletonEnemy extends Enemy {
    static createAnimations(scene) {
        const walkTexture = scene.textures.get('skeleton_walk_full');
        const attackTexture = scene.textures.get('skeleton_attack_full');
        const deadTexture = scene.textures.get('skeleton_dead_full');
        const idleTexture = scene.textures.get('skeleton_idle_full');
        const hurtTexture = scene.textures.get('skeleton_hurt_full');

        // All sheets are 8x8 (8 directions, 8 frames each)
        const walkFW = walkTexture.source[0].width / 8;
        const walkFH = walkTexture.source[0].height / 8;
        const attackFW = attackTexture.source[0].width / 8;
        const attackFH = attackTexture.source[0].height / 8;
        const deadFW = deadTexture.source[0].width / 8;
        const deadFH = deadTexture.source[0].height / 8;
        const idleFW = idleTexture.source[0].width / 8;
        const idleFH = idleTexture.source[0].height / 8;
        const hurtFW = hurtTexture.source[0].width / 3;
        const hurtFH = hurtTexture.source[0].height / 3;

        scene.textures.addSpriteSheet('skeleton_walk', walkTexture.source[0].image, { frameWidth: walkFW, frameHeight: walkFH });
        scene.textures.addSpriteSheet('skeleton_attack', attackTexture.source[0].image, { frameWidth: attackFW, frameHeight: attackFH });
        scene.textures.addSpriteSheet('skeleton_dead', deadTexture.source[0].image, { frameWidth: deadFW, frameHeight: deadFH });
        scene.textures.addSpriteSheet('skeleton_idle', idleTexture.source[0].image, { frameWidth: idleFW, frameHeight: idleFH });
        scene.textures.addSpriteSheet('skeleton_hurt', hurtTexture.source[0].image, { frameWidth: hurtFW, frameHeight: hurtFH });

        const directions = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
        directions.forEach((dir, rowIndex) => {
            scene.anims.create({
                key: `skeleton-walk-${dir}`,
                frames: scene.anims.generateFrameNumbers('skeleton_walk', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 10, repeat: -1
            });
            scene.anims.create({
                key: `skeleton-attack-${dir}`,
                frames: scene.anims.generateFrameNumbers('skeleton_attack', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 10, repeat: 0
            });
            scene.anims.create({
                key: `skeleton-dead-${dir}`,
                frames: scene.anims.generateFrameNumbers('skeleton_dead', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: 0
            });
            scene.anims.create({
                key: `skeleton-idle-${dir}`,
                frames: scene.anims.generateFrameNumbers('skeleton_idle', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 6, repeat: -1
            });
            scene.anims.create({
                key: `skeleton-hurt-${dir}`,
                frames: scene.anims.generateFrameNumbers('skeleton_hurt', { start: rowIndex, end: rowIndex }),
                frameRate: 1, repeat: 0
            });
        });
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'skeleton_walk', 45, 20);

        this.animPrefix = 'skeleton';

        // Skeleton stats: slower, less HP, less damage
        this.hp = 10;
        this.maxHp = 10;
        this.speed = 55;
        this.damage = 3;

        // Visual adjustment for skeleton
        this.body.setCircle(18, 32, 40);
    }
}
