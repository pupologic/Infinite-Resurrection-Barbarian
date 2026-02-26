const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down, no gravity
            debug: false
        }
    },
    scene: [StartScene, {
        key: 'GameScene',
        preload: preload,
        create: create,
        update: update
    }],
    pixelArt: true
};

const game = new Phaser.Game(config);

let player;
let currentLevel = 0; // Start at Tutorial Level
const MAX_LEVELS = 5;
const REBORN_SPRITE_OFFSET_Y = 30; // Adjusted offset for the reborn sprite marker
const REBORN_SAFE_ZONE_RADIUS = 200; // Adjustable safe zone radius around spawn Point (3x3 tiles is ~192-250px)
let isPaused = false;
let pauseContainer = null;
let firstTimeStart = true;

function preload() {
    this.load.image('warrior_full', 'Asset/Warrior/warrior_tilesheet.png');
    this.load.image('warrior_idle_full', 'Asset/Warrior/warrior_idle_tilesheet.png');
    this.load.image('warrior_punch_full', 'Asset/Warrior/warrior_punch_tilesheet.png');
    this.load.image('warrior_punch_idle_full', 'Asset/Warrior/warrior_punch_idle_tilesheet.png');
    this.load.image('warrior_jump_full', 'Asset/Warrior/warrior_jump_tilesheet.png');
    this.load.image('warrior_jump_kick_full', 'Asset/Warrior/warrior_jump_kick_tilesheet.png');
    this.load.image('warrior_dash_full', 'Asset/Warrior/warrior_dash_tilesheet.png');
    this.load.image('warrior_shield_full', 'Asset/Warrior/warrior_tilesheet_shield.png');
    this.load.image('warrior_roar_full', 'Asset/Warrior/warrior_tilesheet_roar.png');
    this.load.image('warrior_pound_full', 'Asset/Warrior/warrior_tilesheet_pound.png');
    this.load.image('warrior_hurt_full', 'Asset/Warrior/warrior_tilesheet_hurt.png');
    this.load.image('warrior_dead_full', 'Asset/Warrior/warrior_tilesheet_dead.png');
    this.load.image('warrior_pound_fx_full', 'Asset/Warrior/pound_fx_tilesheet.png');
    this.load.image('warrior_shield_fx_full', 'Asset/Warrior/shield_fx_tilesheet.png');

    // New Environment Assets
    this.load.image('ground_fill', 'Asset/Map/Ground.png');
    this.load.spritesheet('ground_sheet', 'Asset/Map/Ground.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('ground_slice', 'Asset/Map/GroundSlice2.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('inner_corner_sheet', 'Asset/Map/CornerSlice.png', { frameWidth: 64, frameHeight: 64 });

    // Keeping door info for now but walls are changing
    this.load.spritesheet('wall_tile_sheet', 'Asset/Map/wall_tile.png', { frameWidth: 112, frameHeight: 112 });
    this.load.image('door_closed', 'Asset/Map/wall_door.png');
    this.load.image('door_open', 'Asset/Map/wall_doorOpen.png');

    // Demon Bull Assets
    this.load.image('demonBull_Walk_full', 'Asset/DemonBull/demonBull_Walk.png');
    this.load.image('demonBull_Attack_full', 'Asset/DemonBull/demonBull_Attack.png');
    this.load.image('demonBull_Dead_full', 'Asset/DemonBull/demonBull_Dead.png');
    this.load.image('demonBull_Idle_full', 'Asset/DemonBull/demonBull_Idle.png');
    this.load.image('demonBull_Hurt_full', 'Asset/DemonBull/demonBull_Hurt.png');

    // Demon Imp Assets
    this.load.image('demonImp_Walk_full', 'Asset/DemonImp/demon_Imp_Walk.png');
    this.load.image('demonImp_Idle_full', 'Asset/DemonImp/demon_Imp_Idle.png');
    this.load.image('fireball_sheet_img', 'Asset/DemonImp/fireball_tilesheet.png');
    this.load.image('demonImp_Attack_full', 'Asset/DemonImp/demon_Imp_Attack.png');
    this.load.image('demonImp_Dead_full', 'Asset/DemonImp/demon_Imp_Dead.png');

    // Skeleton Assets
    this.load.image('skeleton_walk_full', 'Asset/Skeleton/skeleton_walk_tilesheet.png');
    this.load.image('skeleton_idle_full', 'Asset/Skeleton/skeleton_idle_tilesheet.png');
    this.load.image('skeleton_attack_full', 'Asset/Skeleton/skeleton_attack_tilesheet.png');
    this.load.image('skeleton_hurt_full', 'Asset/Skeleton/skeleton_hurt_tilesheet.png');
    this.load.image('skeleton_dead_full', 'Asset/Skeleton/skeleton_dead_tilesheet.png');

    // SkullBug Assets
    this.load.image('skullbug_walk_full', 'Asset/SkullBug/skullbug_walk_tilesheet.png');
    this.load.image('skullbug_attack_full', 'Asset/SkullBug/skullbug_attack_tilesheet.png');
    this.load.image('skullbug_dead_full', 'Asset/SkullBug/skullbug_dead_tilesheet.png');
    this.load.image('skullbug_hurt_full', 'Asset/SkullBug/skullbug_hurt_tilesheet.png');
    // VamBat
    this.load.image('vambat_walk_full', 'Asset/VamBat/vambat_walk_tilesheet.png');
    this.load.image('vambat_attack_full', 'Asset/VamBat/vambat_attack_tilesheet.png');
    this.load.image('vambat_dead_full', 'Asset/VamBat/vambat_dead_tilesheet.png');
    this.load.image('vambat_hurt_full', 'Asset/VamBat/vambat_hurt_tilesheet.png');

    this.load.image('portal_full', 'Asset/Misc/portal.png');
    this.load.image('chest_multi', 'Asset/Misc/chest_tilesheet_multi.png');
    this.load.image('spike_trap_full', 'Asset/Misc/spike_trap.png');
    this.load.image('lock_trap_full', 'Asset/Misc/lock_trap.png');
    this.load.spritesheet('rock', 'Asset/Misc/rock_tile.png', { frameWidth: 96, frameHeight: 96 });
    this.load.image('dirt', 'Asset/Misc/dirt.png');
    this.load.image('heart_item', 'Asset/Misc/heart_item.png');
    this.load.image('heart_ui', 'Asset/Misc/heart_UI.png');
    this.load.image('stamina_item', 'Asset/Misc/stamina_item.png');
    this.load.image('stamina_ui', 'Asset/Misc/stamina_UI.png');
    this.load.image('coin_item', 'Asset/Misc/coin_item.png');
    this.load.image('coin_ui', 'Asset/Misc/coin_UI.png');
    this.load.image('force_item', 'Asset/Misc/force_item.png'); // Strength
    this.load.image('force_ui', 'Asset/Misc/force_UI.png'); // Strength
    this.load.image('speed_item', 'Asset/Misc/speed_item.png');
    this.load.image('speed_ui', 'Asset/Misc/speed_UI.png');
    this.load.image('key_item', 'Asset/Misc/key_item.png');
    this.load.image('key_ui', 'Asset/Misc/key_UI.png');
    this.load.image('reborn_place', 'Asset/Misc/reborn_place.png');
}

function create() {
    // 1. Process Textures and Animations via Player class
    const { frameWidth, frameHeight } = Player.createAnimations(this);
    Enemy.createAnimations(this);
    RangedEnemy.createAnimations(this);
    SkeletonEnemy.createAnimations(this);
    SkullBugEnemy.createAnimations(this);
    VamBatEnemy.createAnimations(this);
    Portal.createAnimations(this);
    Chest.createAnimations(this);
    Trap.createAnimations(this);
    HoldingTrap.createAnimations(this);

    // Create Reborn Place Animation
    if (this.textures.exists('reborn_place')) {
        const rebornTex = this.textures.get('reborn_place').getSourceImage();
        this.textures.addSpriteSheet('reborn_place_sheet', rebornTex, {
            frameWidth: rebornTex.width / 2,
            frameHeight: rebornTex.height / 2
        });
        this.anims.create({
            key: 'reborn-activate',
            frames: this.anims.generateFrameNumbers('reborn_place_sheet', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: 0
        });
    }

    // Initialize Groups
    this.groundLayer = this.add.group();
    this.walls = this.physics.add.staticGroup();
    this.innerWalls = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.projectiles = this.physics.add.group();
    this.interactables = this.physics.add.staticGroup();
    this.items = this.physics.add.group();
    this.traps = this.physics.add.staticGroup();
    this.holdingTraps = this.physics.add.staticGroup();
    this.portals = this.physics.add.group();
    this.dirtDecorations = this.add.group();
    this.wallSprites = this.add.group();   // Wall Sprite visuals (not zones)
    this.debugShapes = this.add.group();   // Debug rects from Wall.js

    // 2. World Bounds
    this.cameras.main.setBounds(-1024, -1024, 2048, 2048);
    this.physics.world.setBounds(-1024, -1024, 2048, 2048);

    // 3. Create Player (using the new Player class)
    // 3. Create Player (using the new Player class)
    player = new Player(this, 0, 0);
    player.setupPhysics(frameWidth, frameHeight);
    this.cameras.main.startFollow(player);

    // Colliders (Persistent)
    this.physics.add.collider(player, this.walls);
    this.physics.add.collider(player, this.innerWalls);
    this.physics.add.collider(player, this.obstacles);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.innerWalls);
    this.physics.add.collider(this.enemies, this.enemies, null, (e1, e2) => {
        if (e1.isDead || e1.isDying || e2.isDead || e2.isDying) return false;
        // Allow VamBats to pass through other bats (and potentially other enemies if desired)
        if (e1 instanceof VamBatEnemy || e2 instanceof VamBatEnemy) return false;
        return true;
    });
    this.physics.add.collider(player, this.enemies, null, (player, enemy) => !player.isGroundDashing && !player.isJumpKicking && !enemy.isDead && !enemy.isDying && !enemy.isDashing);

    // Projectile Collisions
    this.physics.add.overlap(player, this.projectiles, (p, proj) => {
        if (!p.isDead && !p.isGroundDashing && !p.isJumpKicking) {
            p.takeDamage(10);
            this.sound.play('Explosion');
            proj.destroy();
        }
    });
    this.physics.add.collider(this.projectiles, this.obstacles, (p, o) => p.destroy());
    this.physics.add.collider(this.projectiles, this.walls, (p, w) => p.destroy());
    this.physics.add.collider(this.projectiles, this.innerWalls, (p, w) => p.destroy());
    this.physics.add.collider(this.projectiles, this.interactables, (p, i) => {
        if (!(i instanceof Door) || !i.isOpen) p.destroy();
    });

    // Helper to spawn items
    this.spawnItem = (x, y, type, extra = {}) => {
        let item = new Item(this, x, y, type, extra);
        this.items.add(item);
        item.setVelocity(Phaser.Math.Between(-50, 50), -150);
        item.setDrag(50);
    };

    // GENERATE LEVEL 1
    generateLevel(this);
    player.triggerSpawnEffect();

    // Play Ambient Background Music
    this.bgMusic = this.sound.add('Ambient', { loop: true, volume: 0.4 });
    this.bgMusic.play();

    this.events.on('player-respawned', () => {
        this.sound.play('Reborn');
        if (this.rebornSprite) {
            this.rebornSprite.play('reborn-activate', true);
        }
    });

    // Overlaps for dynamic items
    this.physics.add.overlap(player, this.traps, (p, trap) => {
        if (!p.isDead && !p.isGroundDashing && !p.isJumpKicking) {
            trap.onUnitOverlap(p);
        }
    });

    // Enemy Trap Interaction
    this.physics.add.overlap(this.enemies, this.traps, (enemy, trap) => {
        if (!enemy.isDead) {
            trap.onUnitOverlap(enemy);
        }
    });
    this.physics.add.overlap(player, this.holdingTraps, (p, trap) => {
        if (!trap.triggered && !p.isDead) trap.trigger(p);
    });
    this.physics.add.overlap(player, this.items, (p, item) => {
        if (item.active) {
            switch (item.type) {
                case 'HEALTH':
                    // Store in inventory, use on click
                    p.inventory.health++;
                    updateInventoryUI('health', p.inventory.health);
                    break;
                case 'SPEED':
                    // Store in inventory
                    p.inventory.speed++;
                    updateInventoryUI('speed', p.inventory.speed);
                    break;
                case 'COIN':
                    p.addCoin(item.value);
                    updateInventoryUI('coin', p.coins);
                    break;
                case 'STRENGTH':
                    // Store in inventory
                    p.inventory.strength++;
                    updateInventoryUI('strength', p.inventory.strength);
                    break;
                case 'STAMINA':
                    p.inventory.stamina++;
                    updateInventoryUI('stamina', p.inventory.stamina);
                    break;
                case 'KEY':
                    p.addKey(item.extra.keyId || 'GENERIC');
                    updateInventoryUI('key', p.keys.length);
                    this.showPopup(`Got Key: ${item.extra.keyId || 'Key'}!`, p.x, p.y - 50);
                    break;
            }
            p.triggerPickupExpression();
            this.sound.play('Item');
            item.destroy();
        }
    });
    this.physics.add.overlap(player, this.portals, (p, portal) => {
        nextLevel(this, portal.targetLevel);
    });
    this.physics.add.collider(player, this.interactables);

    // Item Spawning Helper
    this.spawnItem = (x, y, type, extra = {}) => {
        if (!this.items) this.items = this.physics.add.group();
        const item = new Item(this, x, y, type, extra);
        this.items.add(item);
        return item;
    };

    // Floating Text Popup Helper
    this.showDamagePopup = (amount, x, y, color = '#ff0000') => {
        let text = this.add.text(x, y, `-${amount}`, {
            fontSize: '10px',
            fontFamily: '"Press Start 2P"', // Assuming this font is loaded, otherwise defaults
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        text.setDepth(99999);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    };

    this.showPopup = (text, x, y) => {
        let t = this.add.text(x, y, text, {
            fontSize: '16px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        t.setDepth(100000); // Ensure it's above everything
        this.tweens.add({
            targets: t, y: y - 50, alpha: 0, duration: 1500, onComplete: () => t.destroy()
        });
    };

    // Debug Attack Graphics
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(9999);

    // 7. Simple UI
    // Old text cooldowns removed in favor of sidebar UI

    // Initialize Inventory Click Listeners
    setupInventoryClicks();

    // Initial UI Sync
    const invTypes = ['health', 'speed', 'strength', 'stamina', 'coin', 'key'];
    invTypes.forEach(t => {
        let count = 0;
        if (t === 'coin') count = player.coins || 0;
        else if (t === 'key') count = (player.keys ? player.keys.length : 0);
        else if (player.inventory && player.inventory[t]) count = player.inventory[t];
        updateInventoryUI(t, count);
    });

    /*
    // 8. Mouse Wheel Zoom
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        const zoomSpeed = 0.001;
        let newZoom = this.cameras.main.zoom - deltaY * zoomSpeed;

        // Clamp zoom between 0.5 (further away) and 2.0 (closer)
        newZoom = Phaser.Math.Clamp(newZoom, 0.5, 2.0);

        this.cameras.main.setZoom(newZoom);
    });
    */

    // --- PAUSE SYSTEM ---
    this.input.keyboard.on('keydown-P', () => togglePause(this));
    this.input.keyboard.on('keydown-ESC', () => togglePause(this));
    this.input.keyboard.on('keydown-ENTER', () => togglePause(this));
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // --- START MENU / LOADING LOGIC ---
    // Handled by StartScene now
    const loadingScreen = document.getElementById('loading-screen');
    // Hide Loading Screen (Assets loaded & Scene created)
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        loadingScreen.style.display = 'none';
    }

    // Initial Instruction (Fade In -> 3s -> Fade Out)
    if (firstTimeStart && currentLevel === 0) {
        this.introText = this.add.text(400, 300, 'PRESS ENTER', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P"',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300000).setAlpha(0);

        this.introTween = this.tweens.add({
            targets: this.introText,
            alpha: 1,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    if (this.introText && this.introText.active) {
                        this.tweens.add({
                            targets: this.introText,
                            alpha: 0,
                            duration: 600,
                            ease: 'Power2',
                            onComplete: () => {
                                if (this.introText) this.introText.destroy();
                                this.introText = null;
                            }
                        });
                    }
                });
            }
        });
        firstTimeStart = false;
    }
}

// Item Definitions
const ITEM_METADATA = {
    health: { icon: '<img src="Asset/Misc/heart_UI.png" title="Health Heart">', title: 'Health Heart', usable: true },
    speed: { icon: '<img src="Asset/Misc/speed_UI.png" title="Speed Potion">', title: 'Speed Potion', usable: true },
    strength: { icon: '<img src="Asset/Misc/force_UI.png" title="Strength Potion">', title: 'Strength Potion', usable: true },
    stamina: { icon: '<img src="Asset/Misc/stamina_UI.png" title="Stamina Potion">', title: 'Stamina Potion', usable: true },
    coin: { icon: '<img src="Asset/Misc/coin_UI.png" title="Coins">', title: 'Coins', usable: false },
    key: { icon: '<img src="Asset/Misc/key_UI.png" title="Keys">', title: 'Keys', usable: false }
};

// --- PAUSE LOGIC ---
function togglePause(scene) {
    if (!player || player.isDead) return;

    // Destroy initial instruction if active
    if (scene.introText) {
        scene.introText.destroy();
        scene.introText = null;
        if (scene.introTween) scene.introTween.stop();
    }

    // Play Pause Sound
    scene.sound.play('Pause');

    isPaused = !isPaused;

    if (isPaused) {
        scene.physics.pause();
        scene.anims.pauseAll();
        scene.tweens.pauseAll();
        createPauseScreen(scene);
    } else {
        if (pauseContainer) {
            pauseContainer.destroy();
            pauseContainer = null;
        }
        scene.physics.resume();
        scene.anims.resumeAll();
        scene.tweens.resumeAll();
    }
}

function createPauseScreen(scene) {
    const { width, height } = scene.scale;

    pauseContainer = scene.add.container(0, 0).setDepth(200000).setScrollFactor(0);

    // 1. Dark Transparent Overlay
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => togglePause(scene));
    pauseContainer.add(overlay);

    // 2. Pause Title
    const title = scene.add.text(width / 2, 120, 'GAME PAUSED', {
        fontSize: '32px',
        fontFamily: '"Press Start 2P"',
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 6
    }).setOrigin(0.5);
    pauseContainer.add(title);

    // 3. Controls List (Centralized)
    const controls = [
        { key: 'W,A,S,D', action: 'DIRECTIONS' },
        { key: 'J / MOUSE', action: 'MAIN ATTACK' },
        { key: 'SPACE', action: 'JUMP KICK' },
        { key: 'SHIFT', action: 'GROUND DASH' },
        { key: 'Q', action: 'GROUND POUND' },
        { key: 'R', action: 'ROAR' },
        { key: 'F', action: 'SHIELD' },
        { key: 'E', action: 'INTERACT' }
    ];

    const startY = 200;
    const spacing = 35;

    controls.forEach((item, i) => {
        const controlText = scene.add.text(width / 2, startY + i * spacing, `${item.key} : ${item.action}`, {
            fontSize: '12px',
            fontFamily: '"Press Start 2P"',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        pauseContainer.add(controlText);
    });

}

// Helper to update HTML UI
function updateInventoryUI(type, count) {
    if (!player) return;
    if (!player.inventoryOrder) player.inventoryOrder = [];

    const typeLower = type.toLowerCase();

    // Manage acquisition order
    if (count > 0) {
        if (!player.inventoryOrder.includes(typeLower)) {
            player.inventoryOrder.push(typeLower);
        }
    } else {
        player.inventoryOrder = player.inventoryOrder.filter(t => t !== typeLower);
    }

    renderBackpack();
}

function renderBackpack() {
    if (!player) return;

    for (let i = 0; i < 10; i++) {
        const slotEl = document.getElementById(`slot-${i}`);
        if (!slotEl) continue;

        const itemType = player.inventoryOrder[i];
        if (itemType && ITEM_METADATA[itemType]) {
            const meta = ITEM_METADATA[itemType];
            let count = 0;
            if (itemType === 'coin') count = player.coins;
            else if (itemType === 'key') count = player.keys.length;
            else count = player.inventory[itemType] || 0;

            if (count > 0) {
                slotEl.classList.remove('empty');
                slotEl.title = meta.title;
                slotEl.dataset.type = itemType;
                slotEl.innerHTML = `
                    <div class="inventory-icon">${meta.icon}</div>
                    <div class="item-count">${count}</div>
                `;
                continue;
            }
        }

        // Default empty state
        slotEl.classList.add('empty');
        slotEl.title = "";
        slotEl.dataset.type = "";
        slotEl.innerHTML = "";
    }
}

function update(time, delta) {
    if (isPaused) return;

    if (player) {
        if (!player.inventory) {
            player.inventory = { health: 0, speed: 0, strength: 0, stamina: 0 };
        }
        player.update(time, delta);

        // Update player light position
        // Update player light position

        // Interaction Check
        if (Phaser.Input.Keyboard.JustDown(player.interactKey)) {
            // Find nearest interactable
            let nearest = null;
            let minDist = 60; // Interaction range

            this.interactables.children.iterate((child) => {
                if (!child.active) return;
                let dist = Phaser.Math.Distance.Between(player.x, player.y, child.x, child.y);

                // Check if object has a specific required facing direction (like 'up' for a chest)
                let angleMatch = true;
                if (child.interactionDirection) {
                    // Be more forgiving: if looking for 'up', 'up-left' and 'up-right' also work
                    angleMatch = (player.lastDirection === child.interactionDirection) ||
                        (player.lastDirection.includes(child.interactionDirection));
                } else {
                    // Default fallback: generic facing check
                    const angleToObj = Phaser.Math.Angle.Between(player.x, player.y, child.x, child.y);
                    const facingAngle = player.getFacingAngle();
                    const angleDiff = Phaser.Math.Angle.Wrap(angleToObj - facingAngle);
                    angleMatch = Math.abs(angleDiff) < Math.PI / 3;
                }

                if (dist < minDist && angleMatch) {
                    nearest = child;
                    minDist = dist;
                }
            });

            if (nearest && nearest.interact) {
                nearest.interact(player);
            }
        }

        // Update Status Sidebar (Health & Cooldowns)
        updateStatusUI();


        // Clear and draw debug graphics only if physics debug is enabled
        if (this.debugGraphics) {
            this.debugGraphics.clear();

            if (this.physics.config.debug && player.active) {
                // Draw Player Attack Range (Cyan Slice)
                const playerBodyRadius = 16;
                const radius = playerBodyRadius + player.attackReach;
                const startAngle = player.getFacingAngle() - Phaser.Math.DegToRad(player.attackAngle / 2);
                const endAngle = player.getFacingAngle() + Phaser.Math.DegToRad(player.attackAngle / 2);

                this.debugGraphics.lineStyle(1, 0x00ffff, 0.5);
                this.debugGraphics.slice(player.x, player.y, radius, startAngle, endAngle).strokePath();
            }
        }

        // Update Enemies
        if (this.enemies) {
            const allObstacles = [this.obstacles, this.walls, this.innerWalls, this.interactables];
            this.enemies.getChildren().forEach(enemy => {
                enemy.update(time, delta, player, allObstacles);
            });
        }

        // Combat Interactions
        if (this.enemies) {
            // Check collisions/overlaps manually using enemy damage radius
            this.enemies.getChildren().forEach(enemy => {
                // Check if enemy is alive/active
                if (enemy.isDead || enemy.isDying || !enemy.active) return;

                // If player is dead, skip interactions
                if (player.isDead) return;

                player.setDepth(player.y);
                const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);

                // Update enemy depth
                enemy.setDepth(enemy.y);
                // Update enemy depth
                enemy.setDepth(enemy.y);
                const combinedRadius = enemy.damageRadius + 16; // player radius approx 16

                // Interaction Check (for attacking players/enemies)
                const inRange = dist < combinedRadius;
                const inDistance = dist < (combinedRadius + player.attackReach);

                const angleToEnemy = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
                const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - player.getFacingAngle());
                const angleLimit = Phaser.Math.DegToRad(player.attackAngle / 2);
                const inAngle = Math.abs(angleDiff) <= angleLimit;

                const inPlayerAttackRange = inDistance && inAngle;

                // 1. Kick Damage (Player -> Enemy)
                if (player.isJumpKicking && inPlayerAttackRange) {
                    // Only hit each enemy once per jump kick
                    if (player.kickHitGroup.has(enemy)) return;

                    if (enemy.invulnerableTimer > 0) return;
                    if (time > enemy.lastDamageTime + 500) {
                        let kickDir = new Phaser.Math.Vector2(enemy.x - player.x, enemy.y - player.y).normalize().scale(player.kickPushForce);
                        enemy.takeDamage(8, kickDir);
                        enemy.lastDamageTime = time;
                        player.kickHitGroup.add(enemy); // Mark as hit
                        player.zVelocity = -2;
                    }
                }

                // 2. Dash Damage (Player -> Enemy)
                else if (player.isGroundDashing && inPlayerAttackRange) {
                    if (time > enemy.lastDamageTime + 500) {
                        let dashDir = new Phaser.Math.Vector2(player.body.velocity).normalize().scale(200);
                        enemy.takeDamage(2, dashDir);
                        enemy.lastDamageTime = time;
                    }
                }

                // 3. Punch Damage (Player -> Enemy) - NO PUSHBACK for punch
                else if (player.isAttacking && inPlayerAttackRange) {
                    if (time > player.lastPunchTime + 500) {
                        enemy.takeDamage(2, null);
                        player.lastPunchTime = time;
                        enemy.lastDamageTime = time;
                        this.sound.play('Punch');
                    }
                }

                // 4. Enemy Damages Player (Now handled by Enemy Attack Animation Logic)
                /*
                if (inRange && !player.isGroundDashing && !player.isJumpKicking) {
                    if (!player.lastDamageTime || time > player.lastDamageTime + 1000) {
                        const knockback = new Phaser.Math.Vector2(player.x - enemy.x, player.y - enemy.y).normalize().scale(200);
                        player.takeDamage(5, knockback);
                    }
                }
                */
            });
            // Damage Holding Traps
            if (this.holdingTraps && player.isAttacking) {
                this.holdingTraps.getChildren().forEach(trap => {
                    if (!trap.active || !trap.triggered) return;

                    // IF player is the one trapped, distance doesn't matter, just hit it.
                    let canHit = false;
                    if (trap.trappedPlayer === player) {
                        canHit = true;
                    } else {
                        // External hit (from outside)
                        const dist = Phaser.Math.Distance.Between(player.x, player.y, trap.x, trap.y);
                        const reach = (trap.damageRadius || 40) + player.attackReach + 10;
                        if (dist < reach) canHit = true;
                    }

                    if (canHit) {
                        if (time > player.lastPunchTime + 200) {
                            if (trap.takeDamage(1)) {
                                player.lastPunchTime = time;
                            }
                        }
                    }
                });
            }
        }
    }
}

function generateLevel(scene) {
    console.log("Generating Level " + currentLevel);
    if (scene.levelText) scene.levelText.setText("LEVEL: " + currentLevel);

    const currentLevelData = window.LevelManifest ? window.LevelManifest[currentLevel] : null;

    // Initialize room boundary tracker
    scene.rooms = [];

    // 1. Ground - Full Image Tiling with Rotation
    const worldSize = 2048;

    // Get full image size
    const groundTexture = scene.textures.get('ground_fill');
    const groundImg = groundTexture.getSourceImage();
    const gWidth = groundImg.width;
    // Fill Ground decorativo (Preenchimento de fundo removido - o fundo agora será preto onde não houver tiles)
    /*
    let startXGround = -worldSize / 2;
    ...
    */

    // Coletamos posições de chão para espalhar dirt depois
    scene.groundPositions = [];

    if (currentLevelData && currentLevelData.groundBounds) {
        startXGround = currentLevelData.groundBounds.startX;
        startYGround = currentLevelData.groundBounds.startY;
        endXGround = currentLevelData.groundBounds.endX;
        endYGround = currentLevelData.groundBounds.endY;
    } else if (currentLevel === 0) {
        // Fallback: corridor bounds para o Tutorial (768x2048) - usado só se não há groundBounds
        startXGround = -768 / 2;
        startYGround = -2048 / 2;
        endXGround = 768 / 2;
        endYGround = 2048 / 2;
    }

    /*
    for (let y = startYGround; y < endYGround; y += gHeight) {
        ...
    }
    */

    // Update World & Camera Bounds baseados nos limites definidos do ground
    const levelBounds = currentLevelData && currentLevelData.groundBounds ? currentLevelData.groundBounds : { startX: -worldSize / 2, startY: -worldSize / 2, endX: worldSize / 2, endY: worldSize / 2 };
    const levelWidthFull = levelBounds.endX - levelBounds.startX;
    const levelHeightFull = levelBounds.endY - levelBounds.startY;
    scene.cameras.main.setBounds(levelBounds.startX, levelBounds.startY, levelWidthFull, levelHeightFull);
    scene.physics.world.setBounds(levelBounds.startX, levelBounds.startY, levelWidthFull, levelHeightFull);

    // 2. Borders (Walls)
    const tileSize = 64;

    // Se o nível atual tem walls manuais definidas no LevelManifest (ex: exportadas do MapManager),
    // pule a geração procedural de bordas - as paredes serão criadas pela seção de 'Manual Walls' abaixo.
    const hasManualWalls = currentLevelData && !currentLevelData.isProcedural &&
        ((currentLevelData.walls && currentLevelData.walls.length > 0) ||
            (currentLevelData.visualTiles && currentLevelData.visualTiles.length > 0));

    if (!hasManualWalls) {
        if (currentLevel === 0) {
            // Tutorial Corridor Generation (fallback se não há walls manuais)
            const corridorWidth = 768;
            const corridorHeight = 2048;
            const startX = -corridorWidth / 2;
            const startY = -corridorHeight / 2;
            const tilesX = Math.ceil(corridorWidth / tileSize);
            const tilesY = Math.ceil(corridorHeight / tileSize);

            for (let x = 0; x < tilesX; x++) {
                for (let y = 0; y < tilesY; y++) {
                    if (x === 0 || x === tilesX - 1 || y === 0 || y === tilesY - 1) {
                        let rx = startX + x * tileSize + tileSize / 2;
                        let ry = startY + y * tileSize + tileSize / 2;

                        let frameIndex = 4;
                        if (y === 0) {
                            if (x === 0) frameIndex = 0;
                            else if (x === tilesX - 1) frameIndex = 2;
                            else frameIndex = 1;
                        } else if (y === tilesY - 1) {
                            if (x === 0) frameIndex = 6;
                            else if (x === tilesX - 1) frameIndex = 8;
                            else frameIndex = 7;
                        } else {
                            if (x === 0) frameIndex = 3;
                            else if (x === tilesX - 1) frameIndex = 5;
                        }

                        let wr = new Wall(scene, rx, ry, 'ground_slice', frameIndex, {
                            collisionWidth: tileSize,
                            collisionHeight: tileSize
                        }).setDepth(-10000);
                        scene.walls.add(wr);
                    } else {
                        if (Phaser.Math.Between(1, 100) <= 10) {
                            let rx = startX + x * tileSize + tileSize / 2;
                            let ry = startY + y * tileSize + tileSize / 2;
                            rx += Phaser.Math.Between(-10, 10);
                            ry += Phaser.Math.Between(-10, 10);
                            scene.groundLayer.add(
                                scene.add.image(rx, ry, 'dirt')
                                    .setAngle(Phaser.Math.Between(0, 360))
                                    .setScale(Phaser.Math.FloatBetween(0.8, 1.2))
                                    .setDepth(-35000)
                            );
                        }
                    }
                }
            }
        } else {
            // Standard Arena Generation
            const startX = -worldSize / 2;
            const startY = -worldSize / 2;
            const tilesX = Math.ceil(worldSize / tileSize);
            const tilesY = Math.ceil(worldSize / tileSize);

            for (let x = 0; x < tilesX; x++) {
                for (let y = 0; y < tilesY; y++) {
                    if (x === 0 || x === tilesX - 1 || y === 0 || y === tilesY - 1) {
                        let rx = startX + x * tileSize + tileSize / 2;
                        let ry = startY + y * tileSize + tileSize / 2;
                        let frameIndex = 4;

                        if (y === 0) {
                            if (x === 0) frameIndex = 0;
                            else if (x === tilesX - 1) frameIndex = 2;
                            else frameIndex = 1;
                        } else if (y === tilesY - 1) {
                            if (x === 0) frameIndex = 6;
                            else if (x === tilesX - 1) frameIndex = 8;
                            else frameIndex = 7;
                        } else {
                            if (x === 0) frameIndex = 3;
                            else if (x === tilesX - 1) frameIndex = 5;
                        }

                        let wr = new Wall(scene, rx, ry, 'ground_slice', frameIndex, {
                            collisionWidth: tileSize,
                            collisionHeight: tileSize
                        }).setDepth(-10000);
                        scene.walls.add(wr);
                    }
                }
            }
        }
    }

    // --- Room/Structure Generator Helper ---
    const createStructure = (x, y, w, h, keyId, options = {}) => {
        const tileSize = 112;
        const startX = x - (w * tileSize) / 2;
        const startY = y - (h * tileSize) / 2;
        const totalWidth = w * tileSize;
        const totalHeight = h * tileSize;

        if (scene.rooms) {
            scene.rooms.push(new Phaser.Geom.Rectangle(startX, startY, totalWidth, totalHeight));
        }

        // Iterate over the grid
        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                const tx = startX + col * tileSize + tileSize / 2;
                const ty = startY + row * tileSize + tileSize / 2;

                let frameIndex = -1;

                // Determine Frame based on position
                if (row === 0) {
                    if (col === 0) frameIndex = 0; // TL
                    else if (col === w - 1) frameIndex = 2; // TR
                    else frameIndex = 1; // TM
                } else if (row === h - 1) {
                    if (col === 0) frameIndex = 6; // BL
                    else if (col === w - 1) frameIndex = 8; // BR
                    else frameIndex = 7; // BM

                    // Place door in bottom-center
                    if (col === Math.floor(w / 2)) {
                        let door = new Door(scene, tx, ty, {
                            keyRequired: keyId,
                            collisionGroup: scene.innerWalls
                        });
                        door.setDepth(ty);
                        scene.interactables.add(door);
                        frameIndex = -1; // Don't place wall if door is there
                    }
                } else {
                    if (col === 0) frameIndex = 3; // L
                    else if (col === w - 1) frameIndex = 5; // R
                }

                if (frameIndex !== -1) {
                    let wall = new Wall(scene, tx, ty, 'wall_tile_sheet', frameIndex, {
                        collisionGroup: scene.innerWalls
                    });
                    scene.innerWalls.add(wall);
                }
            }
        }

        const centerX = startX + (w * tileSize) / 2;
        const centerY = startY + (h * tileSize) / 2;

        // Inside Loot (Optional)
        if (options.addChest !== false) {
            const lootRoll = Phaser.Math.Between(0, 2);
            let lootType = 'COIN';
            if (lootRoll === 1) lootType = 'HEALTH';
            else if (lootRoll === 2) lootType = 'STAMINA';

            scene.interactables.add(new Chest(scene, centerX, centerY, { type: 'ITEM', itemType: lootType, extraDrops: options.extraDrops }, { direction: 'down' }));
        }

        // Add Rocks inside the room (using rock_tile collision system)
        // Iterate internally again to place random rocks, avoiding center and door path
        for (let row = 1; row < h - 1; row++) {
            for (let col = 1; col < w - 1; col++) {
                // Avoid center (chest/guards usually here)
                const tx = startX + col * tileSize + tileSize / 2;
                const ty = startY + row * tileSize + tileSize / 2;

                // Simple distance check from center
                const dist = Phaser.Math.Distance.Between(tx, ty, centerX, centerY);
                if (dist < 100) continue;

                // Chance to place rock
                if (Phaser.Math.Between(0, 100) < 15) { // 15% chance per tile
                    const randomFrame = Phaser.Math.Between(0, 3);
                    const rock = scene.add.image(tx, ty, 'rock', randomFrame);
                    rock.setDepth(ty);

                    // Custom Collision System (same as random level rocks)
                    const baseY = ty + 12;
                    const baseX = tx - 8;
                    const rockBase = scene.obstacles.create(baseX, baseY, null);
                    rockBase.setVisible(false);
                    const radius = 24;
                    rockBase.body.setCircle(radius);
                }
            }
        }

        // Guards (Optional) - placed relative to room size
        if (options.addGuards !== false) {
            // Place guards dynamically based on room size to avoid walls
            const offset = (Math.min(w, h) * tileSize) / 4;

            const spawnGuard = (gx, gy) => {
                const isSkeleton = Math.random() > 0.4; // Slightly more skeletons for variety
                scene.enemies.add(isSkeleton ? new SkeletonEnemy(scene, gx, gy) : new Enemy(scene, gx, gy));
            };

            spawnGuard(centerX - offset, centerY - offset);
            spawnGuard(centerX + offset, centerY + offset);
        }
    };

    // 3. Level Data (Manual vs Procedural)
    if (currentLevelData && !currentLevelData.isProcedural) {
        console.log("Loading Manual Level " + currentLevel);

        // Player Start
        if (currentLevelData.playerStart) {
            const px = currentLevelData.playerStart.x;
            const py = currentLevelData.playerStart.y;
            player.setPosition(px, py); // Player at original position
            player.spawnPoint = { x: px, y: py }; // Update respawn point
            scene.rebornSprite = scene.add.sprite(px, py + REBORN_SPRITE_OFFSET_Y, 'reborn_place_sheet', 0).setDepth(-19998);
            scene.rebornSprite.play('reborn-activate');
        }

        // Rooms (Manual definition using the helper)
        if (currentLevelData.rooms) {
            currentLevelData.rooms.forEach(r => {
                createStructure(r.x, r.y, r.w, r.h, r.keyId, { addChest: r.addChest, addGuards: r.addGuards });
            });
        }

        // Enemies
        if (currentLevelData.enemies) {
            currentLevelData.enemies.forEach(e => {
                switch (e.type) {
                    case 'ranged':
                        scene.enemies.add(new RangedEnemy(scene, e.x, e.y));
                        break;
                    case 'skeleton':
                        scene.enemies.add(new SkeletonEnemy(scene, e.x, e.y));
                        break;
                    case 'vambat':
                        scene.enemies.add(new VamBatEnemy(scene, e.x, e.y));
                        break;
                    case 'skullbug':
                        scene.enemies.add(new SkullBugEnemy(scene, e.x, e.y));
                        break;
                    default:
                        scene.enemies.add(new Enemy(scene, e.x, e.y));
                        break;
                }
            });
        }

        // --- Helper: resolve nome de textura p/ chave Phaser ---
        const textureKeyMap = {
            'GroundSlice': 'ground_slice',
            'GroundSlice2': 'ground_slice',
            'Ground': 'ground_sheet',
            'Inner Corner': 'inner_corner_sheet',
            'Corner_Slice': 'inner_corner_sheet',
            'CornerSlice': 'inner_corner_sheet',
        };
        // Texturas puramente decorativas (sem colisão física)
        const decorativeTextures = new Set(['Ground']);

        // --- Helper: instancia um tile (wall ou visual) a partir de dados normalizados ---
        // wx, wy = posição center; frame, rot = frame e rotação; texName = nome original do tileset;
        // depth = profundidade; isWallLayer = se a camada é de colisão; colDefs = collisionDefinitions
        const spawnTile = (wx, wy, frame, rot, texName, depth, isWallLayer, colDefs) => {
            const resolvedTexture = textureKeyMap[texName] || texName || 'ground_slice';
            const isDecorative = decorativeTextures.has(texName);

            // Busca definição de colisão customizada
            let colDef = null;
            if (!isDecorative && colDefs) {
                const frameDefs = colDefs[texName] || colDefs[resolvedTexture];
                if (frameDefs && frameDefs[frame] !== undefined) colDef = frameDefs[frame];
            }

            // Verifica registro fixo (hardcoded)
            const registry = Wall.TILE_COLLISION_REGISTRY[resolvedTexture];
            const hasHardcoded = registry && registry[frame];

            // Decide se monta como Wall com colisão ou como imagem decorativa
            const needsPhysics = !isDecorative && (colDef || hasHardcoded);

            if (needsPhysics) {
                const wall = new Wall(scene, wx, wy, resolvedTexture, frame || 0, {
                    collisionWidth: 64,
                    collisionHeight: 64,
                    collisionGroup: scene.walls,
                    collisionDefinition: colDef,
                    rotation: rot,
                    tileSize: 64
                }).setDepth(depth);
                scene.walls.add(wall);
            } else {
                const img = scene.add.image(wx, wy, resolvedTexture, frame || 0);
                if (rot) img.setAngle(rot * 90);
                img.setDepth(depth);
                scene.groundLayer.add(img);
                if (texName === 'Ground' || resolvedTexture === 'ground_sheet') {
                    scene.groundPositions.push({ x: wx, y: wy });
                }
            }
        };

        // --- Helper: itera sobre walls ou visualTiles suportando AMBOS os formatos ---
        // Formato antigo: Array de objetos { x, y, frame, texture, depth, rotation }
        // Formato novo:   Objeto { "tex|depth:N": { texture, depth, collision, tiles:[[x,y,f] ou [x,y,f,r]] } }
        const iterTileData = (data, defaultDepth, isWallLayer, colDefs) => {
            if (!data) return;
            if (Array.isArray(data)) {
                // --- FORMATO LEGADO ---
                data.forEach(w => {
                    spawnTile(w.x, w.y, w.frame || 0, w.rotation || 0,
                        w.texture, w.depth !== undefined ? w.depth : defaultDepth,
                        isWallLayer, colDefs);
                });
            } else {
                // --- FORMATO OTIMIZADO (novo) ---
                Object.values(data).forEach(group => {
                    const { texture, depth, tiles } = group;
                    const d = depth !== undefined ? depth : defaultDepth;
                    tiles.forEach(t => {
                        // t = [x, y, frame] ou [x, y, frame, rotation]
                        spawnTile(t[0], t[1], t[2] || 0, t[3] || 0,
                            texture, d, isWallLayer, colDefs);
                    });
                });
            }
        };

        const colDefs = currentLevelData.collisionDefinitions;

        // Manual Walls (camada com colisão ativa)
        iterTileData(currentLevelData.walls, -40000, true, colDefs);

        // Manual Visual Tiles (camada decorativa / sem colisão de layer)
        iterTileData(currentLevelData.visualTiles, -35000, false, colDefs);

        // Obstacles (Rocks)
        if (currentLevelData.obstacles) {
            currentLevelData.obstacles.forEach(o => {
                if (o.type === 'rock') {
                    // Visual part
                    const randomFrame = Phaser.Math.Between(0, 3);
                    const rock = scene.add.image(o.x, o.y, 'rock', randomFrame);
                    rock.setDepth(o.y);

                    // CRITICAL: Add visuals to cleanup group
                    scene.dirtDecorations.add(rock);

                    // Collision part (Invisible Circle)
                    const baseY = o.y + 12;
                    const baseX = o.x - 8;
                    const rockBase = scene.obstacles.create(baseX, baseY, null);
                    rockBase.setVisible(false);
                    const radius = 24;
                    rockBase.body.setCircle(radius);
                }
            });
        }

        // Traps
        if (currentLevelData.traps) {
            currentLevelData.traps.forEach(t => {
                scene.traps.add(new Trap(scene, t.x, t.y));
            });
        }

        // Interactables
        if (currentLevelData.interactables) {
            currentLevelData.interactables.forEach(i => {
                if (i.type === 'chest') {
                    scene.interactables.add(new Chest(scene, i.x, i.y, {
                        type: i.loot || 'COIN',
                        value: i.value,
                        itemType: i.itemType,
                        extraDrops: i.extraDrops
                    }, { direction: i.direction || 'up' }));
                } else if (i.type === 'door') {
                    scene.interactables.add(new Door(scene, i.x, i.y, i.extra)); // extra could be { keyRequired: '...' }
                }
            });
        }

        // --- Espalhar Dirt apenas nos tiles de chão authored ---
        if (scene.groundPositions && scene.groundPositions.length > 0) {
            const dirtCount = Math.min(600, scene.groundPositions.length * 2); // Quantidade proporcional ao tamanho do chão
            for (let i = 0; i < dirtCount; i++) {
                const pos = Phaser.Math.RND.pick(scene.groundPositions);
                const rx = pos.x + Phaser.Math.Between(-30, 30);
                const ry = pos.y + Phaser.Math.Between(-30, 30);

                scene.groundLayer.add(
                    scene.add.image(rx, ry, 'dirt')
                        .setAngle(Phaser.Math.Between(0, 360))
                        .setScale(Phaser.Math.FloatBetween(0.6, 1.0))
                        .setDepth(-19999)
                );
            }
        }

        // Portal
        if (currentLevelData.portal) {
            const portal = new Portal(scene, currentLevelData.portal.x, currentLevelData.portal.y);
            if (currentLevelData.portal.targetLevel !== undefined) {
                portal.targetLevel = currentLevelData.portal.targetLevel;
            }
            scene.portals.add(portal);
        }

    } else {
        // PROCEDURAL GENERATION (Default)
        player.setPosition(0, 0); // Player at standard 0,0
        player.spawnPoint = { x: 0, y: 0 }; // Reset respawn point
        scene.rebornSprite = scene.add.sprite(player.spawnPoint.x, player.spawnPoint.y + REBORN_SPRITE_OFFSET_Y, 'reborn_place_sheet', 0).setDepth(-19998);
        scene.rebornSprite.play('reborn-activate');

        const roomKeysRequired = []; // Track keys needed
        const roomCount = Phaser.Math.Between(2, 3); // Guaranteed at least 2 rooms
        const tileSize = 112;
        let portalPosition = null;

        for (let i = 0; i < roomCount; i++) {
            let sx, sy, attempts = 0;
            // Larger rooms: 5x5 to 8x8
            let w = Phaser.Math.Between(5, 8);
            let h = Phaser.Math.Between(5, 8);
            const roomW = w * tileSize;
            const roomH = h * tileSize;

            do {
                attempts++;
                // Target inner map area (-600 to 600) to stay far from world borders
                sx = Phaser.Math.Between(-600, 600);
                sy = Phaser.Math.Between(-600, 400);

                const startX = sx - roomW / 2;
                const startY = sy - roomH / 2;
                // Buffer to keep rooms apart and walls accessible
                const newRoomRect = new Phaser.Geom.Rectangle(startX - 150, startY - 150, roomW + 300, roomH + 300);

                let overlaps = false;
                for (let establishedRoom of scene.rooms) {
                    if (Phaser.Geom.Intersects.RectangleToRectangle(newRoomRect, establishedRoom)) {
                        overlaps = true;
                        break;
                    }
                }

                const distFromSpawn = Phaser.Math.Distance.Between(sx, sy, player.spawnPoint.x, player.spawnPoint.y);
                // Ensure room center is far enough, PLUS check if any corner is too close would be better,
                // but for now let's just ensure the center is at least (safe_zone + room_radius) away.
                // approximating room radius as half width.
                const safeDist = REBORN_SAFE_ZONE_RADIUS + (Math.max(roomW, roomH) / 2) + 50;

                if (!overlaps && distFromSpawn > safeDist) {
                    const keyId = `KEY_ROOM_${i + 1}`;
                    roomKeysRequired.push(keyId);

                    // Designate one room as the portal room (typically the furthest or just the last one)
                    const isPortalRoom = (i === roomCount - 1);
                    if (isPortalRoom) {
                        portalPosition = { x: sx, y: sy };
                    }

                    createStructure(sx, sy, w, h, keyId, { addChest: !isPortalRoom });
                    break;
                }
            } while (attempts < 50);
        }

        // Helper: Check if position is safe (away from borders, rooms, and other objects)
        const isSafePos = (x, y, margin = 80) => {
            // Check Map Borders
            if (Math.abs(x) > 780 || Math.abs(y) > 780) return false;

            // Check Rooms
            for (let room of scene.rooms) {
                const expandedRoom = new Phaser.Geom.Rectangle(room.x - margin, room.y - margin, room.width + 2 * margin, room.height + 2 * margin);
                if (expandedRoom.contains(x, y)) return false;
            }

            // Check Spawn
            if (Phaser.Math.Distance.Between(x, y, player.spawnPoint.x, player.spawnPoint.y) < REBORN_SAFE_ZONE_RADIUS) return false;

            // Check against existing objects to prevent overlap
            // Helper to check group
            const checkGroup = (group, minDist) => {
                if (!group) return true;
                const children = group.getChildren();
                for (let child of children) {
                    if (child.active) {
                        if (Phaser.Math.Distance.Between(x, y, child.x, child.y) < minDist) return false;
                    }
                }
                return true;
            };

            // Check all critical groups
            // Rocks/Obstacles: Spread out (100px)
            if (!checkGroup(scene.obstacles, 100)) return false;
            // Traps: Well spread (150px)
            if (!checkGroup(scene.traps, 150)) return false;
            if (!checkGroup(scene.holdingTraps, 150)) return false;
            // Interactables/Chests: (100px)
            if (!checkGroup(scene.interactables, 100)) return false;
            // Enemies: (80px)
            if (!checkGroup(scene.enemies, 80)) return false;
            // Portals: (150px)
            if (!checkGroup(scene.portals, 150)) return false;

            return true;
        };

        if (!hasManualWalls) {
            // 4. Dirt Patches (Decorations)
            for (let i = 0; i < 200; i++) {
                let x, y, attempts = 0;
                do {
                    x = Phaser.Math.Between(-850, 850);
                    y = Phaser.Math.Between(-850, 850);
                    attempts++;
                } while (!isSafePos(x, y, 20) && attempts < 20);

                if (attempts < 20) {
                    const angle = Phaser.Math.Between(0, 3) * 90;
                    const dirt = scene.add.image(x, y, 'dirt')
                        .setAngle(angle)
                        .setDepth(-19999) // Above ground (-20000) but below reborn/shadows
                    //.setAlpha(0.6); // Subtle detail
                    scene.dirtDecorations.add(dirt);
                }
            }

            // 4. Rocks
            for (let i = 0; i < 12 + (currentLevel * 2); i++) {
                let x, y, attempts = 0;
                do {
                    x = Phaser.Math.Between(-850, 850);
                    y = Phaser.Math.Between(-850, 850);
                    attempts++;
                } while (!isSafePos(x, y, 40) && attempts < 20);

                if (attempts < 20) {
                    const randomFrame = Phaser.Math.Between(0, 3);
                    const rock = scene.add.image(x, y, 'rock', randomFrame);
                    rock.setDepth(y); // Profundidade correta
                    scene.dirtDecorations.add(rock); // Fix leak

                    // 2. Colisor Invisível na base
                    const baseY = y + 12;
                    const baseX = x - 8;
                    const rockBase = scene.obstacles.create(baseX, baseY, null); // Cria no grupo de obstáculos
                    rockBase.setVisible(false); // Invisível
                    const radius = 24;
                    rockBase.body.setCircle(radius); // Círculo de raio 15
                }
            }
        }

        // 5. Enemies (Scale with level)
        let keysAssigned = 0;
        for (let i = 0; i < 3 + currentLevel; i++) {
            let x, y, attempts = 0;
            do {
                x = Phaser.Math.Between(-850, 850);
                y = Phaser.Math.Between(-850, 850);
                attempts++;
            } while (!isSafePos(x, y, 100) && attempts < 20);
            if (attempts < 20) {
                // Randomly choose between types
                const rand = Math.random();
                let enemy;
                if (rand < 0.25) {
                    enemy = new SkeletonEnemy(scene, x, y);
                } else if (rand < 0.50) {
                    enemy = new Enemy(scene, x, y);
                } else if (rand < 0.75) {
                    enemy = new SkullBugEnemy(scene, x, y);
                } else {
                    enemy = new VamBatEnemy(scene, x, y);
                }

                if (keysAssigned < roomKeysRequired.length) {
                    enemy.forcedLoot = { type: 'KEY', extra: { keyId: roomKeysRequired[keysAssigned] } };
                    enemy.restoreTint(); // Apply gold tint immediately
                    keysAssigned++;
                }
                scene.enemies.add(enemy);
            }
        }

        // 5a. Swarms (SkullBugs and VamBats)
        for (let i = 0; i < 6 + (currentLevel * 2); i++) {
            let x, y, attempts = 0;
            do {
                x = Phaser.Math.Between(-850, 850);
                y = Phaser.Math.Between(-850, 850);
                attempts++;
            } while (!isSafePos(x, y, 100) && attempts < 20);
            if (attempts < 20) {
                const isBat = Math.random() > 0.5;
                const enemy = isBat ? new VamBatEnemy(scene, x, y) : new SkullBugEnemy(scene, x, y);
                scene.enemies.add(enemy);
            }
        }
        for (let i = 0; i < 2 + Math.floor(currentLevel / 2); i++) {
            let x, y, attempts = 0;
            do {
                x = Phaser.Math.Between(-850, 850);
                y = Phaser.Math.Between(-850, 850);
                attempts++;
            } while (!isSafePos(x, y, 100) && attempts < 20);
            if (attempts < 20) {
                scene.enemies.add(new RangedEnemy(scene, x, y));
            }
        }

        // 6. Interactables
        const randomDir = () => Phaser.Math.RND.pick(['up', 'down', 'left', 'right']);

        // Chest is placed at a fixed position, ensure it's safe
        let chestX = -200;
        let chestY = 200;
        if (isSafePos(chestX, chestY)) {
            scene.interactables.add(new Chest(scene, chestX, chestY, { type: 'COIN', value: 50 }, { direction: randomDir() }));
        } else {
            // Fallback if fixed chest position is unsafe
            let x, y, attempts = 0;
            do {
                x = Phaser.Math.Between(-850, 850);
                y = Phaser.Math.Between(-850, 850);
                attempts++;
            } while (!isSafePos(x, y) && attempts < 20);
            if (attempts < 20) {
                scene.interactables.add(new Chest(scene, x, y, { type: 'COIN', value: 50 }, { direction: randomDir() }));
            }
        }


        // Traps
        for (let i = 0; i < 3 + currentLevel; i++) {
            let x, y, attempts = 0;
            do {
                x = Phaser.Math.Between(-850, 850);
                y = Phaser.Math.Between(-850, 850);
                attempts++;
            } while (!isSafePos(x, y) && attempts < 20);
            if (attempts < 20) {
                scene.traps.add(new Trap(scene, x, y));
            }
        }

        let hx, hy, hatts = 0;
        do {
            hx = Phaser.Math.Between(-600, 600);
            hy = Phaser.Math.Between(-600, 600);
            hatts++;
        } while (!isSafePos(hx, hy) && hatts < 20);
        if (hatts < 20) {
            scene.holdingTraps.add(new HoldingTrap(scene, hx, hy));
        }

        // 7. PORTAL (Goal)
        if (portalPosition) {
            // Place portal in the center of the designated portal room
            scene.portals.add(new Portal(scene, portalPosition.x, portalPosition.y));
        } else {
            // Fallback: place far from center if no room was created
            let px, py, patts = 0;
            do {
                px = Phaser.Math.Between(600, 800) * (Math.random() > 0.5 ? 1 : -1);
                py = Phaser.Math.Between(600, 800) * (Math.random() > 0.5 ? 1 : -1);
                patts++;
            } while (!isSafePos(px, py) && patts < 20);
            if (patts < 20) {
                scene.portals.add(new Portal(scene, px, py));
            }
        }
    }
}


function setupInventoryClicks() {
    const grid = document.getElementById('backpack-grid');
    if (!grid) return;

    // Use event delegation for dynamic slots
    grid.addEventListener('click', (e) => {
        const slot = e.target.closest('.inventory-slot');
        if (!slot) return;

        const type = slot.dataset.type;
        if (type && ITEM_METADATA[type] && ITEM_METADATA[type].usable) {
            if (player.inventory[type] > 0) {
                // Determine usage logic based on type
                let used = false;
                if (type === 'health') {
                    // Logic inside player.useItem or handle here?
                    // Currently player.useItem handles generic boost.
                    // Let's defer to player.useItem but handle Stamina specifically here if player.useItem doesn't.
                    used = player.useItem(type);
                } else if (type === 'stamina') {
                    if (player.stamina < player.maxStamina) {
                        player.stamina = player.maxStamina;
                        player.scene.showPopup("Stamina Refilled!", player.x, player.y - 50);
                        used = true;
                    } else {
                        player.scene.showPopup("Full Stamina!", player.x, player.y - 50);
                    }
                } else {
                    used = player.useItem(type);
                }

                if (used) {
                    player.inventory[type]--;
                    updateInventoryUI(type, player.inventory[type]);
                }
            }
        }
    });
}

function updateStatusUI() {
    if (!player) return;

    // Health
    const hpPercent = Phaser.Math.Clamp((player.hp / player.maxHp) * 100, 0, 100);
    const hpBar = document.getElementById('bar-health');
    const hpText = document.getElementById('text-health');
    if (hpBar) hpBar.style.width = `${hpPercent}%`;
    if (hpText) hpText.innerText = `${Math.ceil(player.hp)}/${player.maxHp}`;

    // Stamina
    const stPercent = Phaser.Math.Clamp((player.stamina / player.maxStamina) * 100, 0, 100);
    const stBar = document.getElementById('bar-stamina');
    const stText = document.getElementById('text-stamina');
    if (stBar) stBar.style.width = `${stPercent}%`;
    if (stText) stText.innerText = `${Math.ceil(player.stamina)}/${player.maxStamina}`;

    // Helper for Cooldowns: (1 - timer/max) * 100
    const updateBar = (id, current, max) => {
        const bar = document.getElementById(id);
        if (bar) {
            const pct = Math.max(0, (1 - (current / max)) * 100);
            bar.style.width = `${pct}%`;

            // Visual tweak: change color if ready (optional via CSS class)
            if (pct >= 99) {
                bar.classList.add('ready');
                bar.classList.remove('charging');
            } else {
                bar.classList.add('charging');
                bar.classList.remove('ready');
            }
        }
    };

    updateBar('bar-dash', player.dashCooldownTimer, player.dashCooldown);
    updateBar('bar-kick', player.jumpKickCooldownTimer, player.jumpKickCooldown);
    updateBar('bar-roar', player.roarTimer, player.roarCooldown);
    updateBar('bar-pound', player.poundTimer, player.poundCooldown);

    // Update Portrait Expression
    const portrait = document.getElementById('player-profile-img');
    if (portrait) {
        // Reset all expression classes
        portrait.className = 'profile-img';

        if (player.isDead || player.hp <= 0) {
            portrait.classList.add('dead');
        } else if (player.isHurt) {
            portrait.classList.add('hurt');
        } else if (player.isAttacking || player.isJumpKicking || player.isGroundDashing || player.isRoaring || player.isPounding) {
            portrait.classList.add('action');
        } else if (player.isPickingUp) {
            portrait.classList.add('pickup');
        } else if (player.hp < player.maxHp / 2) {
            portrait.classList.add('low-hp');
        } else {
            portrait.classList.add('base');
        }
    }
}

function nextLevel(scene, targetLevelIndex = undefined) {
    scene.sound.play('NextLevel');
    if (targetLevelIndex !== undefined) {
        currentLevel = targetLevelIndex;
    } else {
        if (currentLevel >= MAX_LEVELS) {
            console.log("GAME VICTORY");
            // Reset to level 1 for endless loop or stop? User said "path of no return".
            // Let's loop for now or keep increasing difficulty
            currentLevel = 0; // Reset to Tutorial or Level 1?
            console.log("Resetting to Tutorial");
        } else {
            currentLevel++;
        }
    }

    // Clear Level
    scene.groundLayer.clear(true, true);
    scene.walls.clear(true, true);
    scene.innerWalls.clear(true, true);
    scene.obstacles.clear(true, true);
    scene.enemies.clear(true, true);
    scene.projectiles.clear(true, true);
    scene.interactables.clear(true, true);
    scene.items.clear(true, true);
    scene.traps.clear(true, true);
    scene.holdingTraps.clear(true, true);
    scene.portals.clear(true, true);
    scene.dirtDecorations.clear(true, true);
    scene.wallSprites.clear(false, false);  // Wall objects already destroyed by walls.clear above — only remove refs
    scene.debugShapes.clear(true, true);

    // Force Phaser physics debug renderer to clear stale body outlines
    if (scene.physics.world.debugGraphic) {
        scene.physics.world.debugGraphic.clear();
    }
    // Destroy spawn marker if exists
    if (scene.rebornSprite) {
        scene.rebornSprite.destroy();
        scene.rebornSprite = null;
    }

    // Reset Player state (position will be handled by generateLevel)
    player.heal(100);

    // Generate New
    generateLevel(scene);
    player.triggerSpawnEffect();
}
