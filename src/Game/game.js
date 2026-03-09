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
    pixelArt: true,
    // Garantia extra: forçar nearest-neighbor no renderer WebGL/Canvas
    render: {
        antialias: false,
        antialiasGL: false,
        roundPixels: true,
        pixelArt: true
    }
};

// --- GLOBAL GAME & VOLUME SETTINGS ---
window.GameSettings = {
    ambientVolume: 0.4,
    sfxVolume: 0.6
};

// Global Sound Categorization & Interceptor
(function () {
    const ambientKeys = ['Ambient', 'Start_Menu', 'ambient', 'start_menu', 'StartMenu', 'Background'];

    Phaser.Sound.BaseSoundManager.prototype._original_play = Phaser.Sound.BaseSoundManager.prototype.play;
    Phaser.Sound.BaseSoundManager.prototype._original_add = Phaser.Sound.BaseSoundManager.prototype.add;

    const wrapSound = (key, config, originalMethod, context) => {
        const isAmbient = ambientKeys.includes(key);
        const multiplier = isAmbient ? window.GameSettings.ambientVolume : window.GameSettings.sfxVolume;
        const requestedVol = config.volume !== undefined ? config.volume : 1;
        config.volume = requestedVol * multiplier;
        const sound = originalMethod.call(context, key, config);
        if (sound) {
            sound._originalBaseVolume = requestedVol;
            sound._isAmbientCategory = isAmbient;
        }
        return sound;
    };

    Phaser.Sound.BaseSoundManager.prototype.play = function (key, config = {}) {
        return wrapSound(key, config, this._original_play, this);
    };
    Phaser.Sound.BaseSoundManager.prototype.add = function (key, config = {}) {
        return wrapSound(key, config, this._original_add, this);
    };
})();

// Helper to update ALL tracked sounds (playing + looping ambient)
const _ambientKeys = ['Ambient', 'Start_Menu', 'ambient', 'start_menu', 'StartMenu', 'Background'];
window.updateAllSoundVolumes = () => {
    if (!game || !game.sound) return;
    // Iterate over ALL sounds in the manager, not just playing ones.
    // Re-derive category from the sound key directly to be safe against
    // untagged sounds (e.g. added from other scenes before the interceptor ran).
    game.sound.sounds.forEach(sound => {
        const key = sound.key || '';
        const isAmbient = _ambientKeys.includes(key) || sound._isAmbientCategory === true;
        const multiplier = isAmbient ? window.GameSettings.ambientVolume : window.GameSettings.sfxVolume;
        const baseVol = sound._originalBaseVolume !== undefined ? sound._originalBaseVolume : 1;
        sound.setVolume(baseVol * multiplier);
    });
};

// --- PREVENT SOUND ACCUMULATION WHEN TAB LOSES FOCUS ---
// When the user switches away, mute Phaser. When they return, unmute.
// This prevents the game loop from queuing up SFX bursts off-screen.
window.addEventListener('blur', () => {
    if (game && game.sound) {
        game.sound.mute = true;
        // Also pause the game loop physics to prevent other side-effects
        // (Phaser handles this by default on blur if 'autoFocus' is on, but we ensure sound is muted)
    }
});
window.addEventListener('focus', () => {
    if (game && game.sound) {
        game.sound.mute = false;
    }
});
// Also handle the Page Visibility API for when tab is hidden (not just blurred)
document.addEventListener('visibilitychange', () => {
    if (!game || !game.sound) return;
    game.sound.mute = document.hidden;
});

const game = new Phaser.Game(config);

let player;
let currentLevel = 1; // Start at Level 1 (Tiled)
const MAX_LEVELS = 5;
const REBORN_SPRITE_OFFSET_Y = 30; // Adjusted offset for the reborn sprite marker
const REBORN_SAFE_ZONE_RADIUS = 200; // Adjustable safe zone radius around spawn Point (3x3 tiles is ~192-250px)
let isPaused = false;
let pauseContainer = null;
let firstTimeStart = true;

// --- PHASER TILEMAP: Mapeamento de tilesets Tiled → chaves Phaser ---
const TILESET_PHASER_KEY = {
    'Ground': 'ground_sheet',
    'GroundSlice': 'ground_slice',
    'GroundSlice2': 'ground_slice',
    'CornerSlice': 'inner_corner_sheet',
    'Corner_Slice': 'inner_corner_sheet',
};

// Mapeamento nível → chave de mapa Tiled (preenchido com os arquivos exportados)
const LEVEL_TILED_MAP = {
    0: 'tutorial',
    1: 'level_1',
    2: 'level_2',
    3: 'level_3',
};

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
    this.load.image('skullbug_idle_full', 'Asset/SkullBug/skullbug_idle_tilesheet.png');
    this.load.image('skullbug_attack_full', 'Asset/SkullBug/skullbug_attack_tilesheet.png');
    this.load.image('skullbug_dead_full', 'Asset/SkullBug/skullbug_dead_tilesheet.png');
    this.load.image('skullbug_hurt_full', 'Asset/SkullBug/skullbug_hurt_tilesheet.png');
    // VamBat
    this.load.image('vambat_walk_full', 'Asset/VamBat/vambat_walk_tilesheet.png');
    this.load.image('vambat_attack_full', 'Asset/VamBat/vambat_attack_tilesheet.png');
    this.load.image('vambat_dead_full', 'Asset/VamBat/vambat_dead_tilesheet.png');
    this.load.image('vambat_hurt_full', 'Asset/VamBat/vambat_hurt_tilesheet.png');

    // Lich King Assets
    this.load.image('lichking_idle_full', 'Asset/LickKing/lichking_idle_tilesheet.png');
    this.load.image('lichking_walk_full', 'Asset/LickKing/lichking_walk_tilesheet.png');
    this.load.image('lichking_hurt_full', 'Asset/LickKing/lichking_hurt_tilesheet.png');
    this.load.image('lichking_dead_full', 'Asset/LickKing/lichking_dead_tilesheet.png');
    this.load.image('lichking_attack1_full', 'Asset/LickKing/lichking_attack1_tilesheet.png');
    this.load.image('lichking_attack2_full', 'Asset/LickKing/lichking_attack2_tilesheet.png');
    this.load.image('lichking_attack3_full', 'Asset/LickKing/lichking_attack3_tilesheet.png');
    this.load.image('lichking_shield_full', 'Asset/LickKing/lichking_shield_tilesheet.png');
    this.load.image('lichking_teleport_full', 'Asset/LickKing/lichking_teleport_tilesheet.png');
    this.load.image('lich_energy_1_full', 'Asset/LickKing/lich_energy_1_tilesheet.png');
    this.load.image('lich_energy_2_full', 'Asset/LickKing/lich_energy_2_tilesheet.png');

    this.load.image('portal_full', 'Asset/Misc/portal.png');
    this.load.image('chest_multi', 'Asset/Misc/chest_tilesheet_multi.png');
    this.load.image('spike_trap_full', 'Asset/Misc/spike_trap.png');
    this.load.image('lock_trap_full', 'Asset/Misc/lock_trap.png');
    this.load.spritesheet('rock', 'Asset/Misc/rock_tile.png', { frameWidth: 96, frameHeight: 96 });
    this.load.image('fire_hazard_full', 'Asset/Misc/fire_tilesheet.png');
    this.load.image('energy_hazard_full', 'Asset/Misc/energy_tilesheet.png');
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
    this.load.image('torch_item', 'Asset/Misc/torch_item.png');
    this.load.image('torch_ui', 'Asset/Misc/torch_UI.png');
    this.load.image('meat_item', 'Asset/Misc/meat_item.png');
    this.load.image('meat_ui', 'Asset/Misc/meat_UI.png');
    this.load.image('ham_item', 'Asset/Misc/ham_item.png');
    this.load.image('ham_ui', 'Asset/Misc/ham_UI.png');
    this.load.image('reborn_place', 'Asset/Misc/reborn_place.png');
    this.load.image('warrior_reborn_full', 'Asset/Warrior/warrior_reborn_tilesheet.png');
    this.load.image('runes_full', 'Asset/Misc/runes_tilesheet.png');

    // --- Registrar TileMaps Tiled (exportados do MapManager) no cache do Phaser ---
    if (window.TileMaps) {

        /**
         * Converte o formato "infinite" com chunks do Tiled para um formato plano
         * que o Phaser 3 consegue processar corretamente.
         */
        function convertTiledInfiniteToFlat(mapData) {
            // Se não é infinite, retorna sem alterar
            if (!mapData.infinite) return mapData;

            const cloned = JSON.parse(JSON.stringify(mapData));

            cloned.layers = cloned.layers.map(layer => {
                // Apenas tilelayers com chunks precisam de conversão
                if (layer.type !== 'tilelayer' || !layer.chunks) return layer;

                // 1. Descobrir os bounds reais de todos os chunks desta layer
                let maxX = 0, maxY = 0;
                layer.chunks.forEach(chunk => {
                    maxX = Math.max(maxX, chunk.x + chunk.width);
                    maxY = Math.max(maxY, chunk.y + chunk.height);
                });

                // Usar os bounds da layer ou os bounds calculados, o que for maior
                const flatW = Math.max(layer.width || 0, maxX);
                const flatH = Math.max(layer.height || 0, maxY);

                // 2. Criar array plano preenchido com 0
                const flat = new Array(flatW * flatH).fill(0);

                // 3. Copiar dados de cada chunk para o array plano
                layer.chunks.forEach(chunk => {
                    for (let row = 0; row < chunk.height; row++) {
                        for (let col = 0; col < chunk.width; col++) {
                            const srcIdx = row * chunk.width + col;
                            const dstX = chunk.x + col;
                            const dstY = chunk.y + row;
                            if (dstX < flatW && dstY < flatH) {
                                flat[dstY * flatW + dstX] = chunk.data[srcIdx] || 0;
                            }
                        }
                    }
                });

                // 4. Substituir chunks pelo array plano
                delete layer.chunks;
                layer.data = flat;
                layer.width = flatW;
                layer.height = flatH;
                layer.x = 0;
                layer.y = 0;
                return layer;
            });

            // Ajustar dimensões do mapa raiz com os maiores valores encontrados
            let rootMaxW = 0, rootMaxH = 0;
            cloned.layers.forEach(l => {
                if (l.type === 'tilelayer') {
                    rootMaxW = Math.max(rootMaxW, (l.width || 0));
                    rootMaxH = Math.max(rootMaxH, (l.height || 0));
                }
            });
            cloned.width = Math.max(cloned.width || 0, rootMaxW);
            cloned.height = Math.max(cloned.height || 0, rootMaxH);
            cloned.infinite = false;

            return cloned;
        }

        Object.entries(window.TileMaps).forEach(([name, data]) => {
            console.log("Injecting Tiled Map into Cache:", name);
            const flatData = convertTiledInfiniteToFlat(data);
            // Phaser espera { data: {...}, format: 1 } no cache de tilemaps
            this.cache.tilemap.add(name, { data: flatData, format: 1 });

            // Forçar carregamento das imagens dos tilesets se presentes no JSON
            if (data.tilesets) {
                data.tilesets.forEach(ts => {
                    const tsKey = TILESET_PHASER_KEY[ts.name] || ts.name;

                    // Se já estivermos carregando como spritesheet manual, não tente carregar como imagem simples
                    if (['ground_sheet', 'ground_slice', 'inner_corner_sheet'].includes(tsKey)) return;

                    // Tileset 'System' é só para o editor (colisão visual), sem imagem real — ignorar no preload
                    if (ts.name === 'System' || (ts.image && ts.image.startsWith('data:'))) return;

                    if (!this.textures.exists(tsKey) && ts.image) {
                        // Tentar carregar a imagem baseada no nome do arquivo se não estiver no manual keys
                        const imgPath = ts.image.startsWith('Asset/') ? ts.image : `Asset/Map/${ts.image}`;
                        this.load.image(tsKey, imgPath);
                    }
                });
            }
        });
    }
}

function create() {
    // Fade in HTML overlay when the scene starts
    const overlay = document.getElementById('global-fade-overlay');
    if (overlay) overlay.classList.remove('active');

    // 1. Process Textures and Animations via Player class
    const { frameWidth, frameHeight } = Player.createAnimations(this);
    Enemy.createAnimations(this);
    RangedEnemy.createAnimations(this);
    SkeletonEnemy.createAnimations(this);
    SkullBugEnemy.createAnimations(this);
    VamBatEnemy.createAnimations(this);
    LichKing.createAnimations(this);
    Portal.createAnimations(this);
    Chest.createAnimations(this);
    Trap.createAnimations(this);
    HoldingTrap.createAnimations(this);
    Rune.createAnimations(this);

    // --- Hazard Animations (Fire & Energy ground hazards) ---
    if (this.textures.exists('fire_hazard_full') && !this.textures.exists('fire_hazard_sheet')) {
        const fireTex = this.textures.get('fire_hazard_full');
        const fW = fireTex.source[0].width / 3;
        const fH = fireTex.source[0].height / 3;
        this.textures.addSpriteSheet('fire_hazard_sheet', fireTex.source[0].image, { frameWidth: fW, frameHeight: fH });
        this.anims.create({
            key: 'fire-hazard-burn',
            frames: this.anims.generateFrameNumbers('fire_hazard_sheet', { start: 0, end: 8 }),
            frameRate: 24,
            repeat: -1
        });
    }
    if (this.textures.exists('energy_hazard_full') && !this.textures.exists('energy_hazard_sheet')) {
        const energyTex = this.textures.get('energy_hazard_full');
        const eW = energyTex.source[0].width / 3;
        const eH = energyTex.source[0].height / 3;
        this.textures.addSpriteSheet('energy_hazard_sheet', energyTex.source[0].image, { frameWidth: eW, frameHeight: eH });
        this.anims.create({
            key: 'energy-hazard-pulse',
            frames: this.anims.generateFrameNumbers('energy_hazard_sheet', { start: 0, end: 8 }),
            frameRate: 24,
            repeat: -1
        });
    }

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

    // --- SETUP VOLUME CONTROLS ---
    const ambientSlider = document.getElementById('slider-ambient');
    const sfxSlider = document.getElementById('slider-sfx');

    if (ambientSlider) {
        ambientSlider.addEventListener('input', (e) => {
            window.GameSettings.ambientVolume = e.target.value / 100;
            window.updateAllSoundVolumes();
        });
    }

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            window.GameSettings.sfxVolume = e.target.value / 100;
            window.updateAllSoundVolumes();
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
    this.rocks = this.physics.add.group({ classType: Rock });
    this.portals = this.physics.add.group();
    this.dirtDecorations = this.add.group();
    this.wallSprites = this.add.group();   // Wall Sprite visuals (not zones)
    this.debugShapes = this.add.group();   // Debug rects from Wall.js
    this.runes = this.physics.add.staticGroup(); // Tutorial rune objects
    this.poundFxGroup = this.add.group(); // Track ground pound FX for rune destruction
    this.hazards = this.add.group();      // Ground hazards (fire / energy pools)
    this.lightSources = [];               // Track dynamic light sources

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
    this.physics.add.collider(player, this.rocks);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.enemies, this.rocks);
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
            // Se estiver com o escudo de energia ativo (Skill), bloqueio total (sem fogo)
            if (p.energyShieldActive) {
                proj.spawnHazards = false;
                this.sound.play('AutoPunch', { volume: 0.6, detune: -500 });
                this.showDamagePopup("BLOCKED", p.x, p.y - 40, "#ffffff");
                proj.destroy();
            } else if (p.isDefending) {
                // Defesa comum com F: Reduz dano (no Player.js) mas GERA fogo normalmente
                p.takeDamage(10);
                this.sound.play('Explosion');
                proj.destroy();
            } else {
                // Sem defesa: Dano total + Fogo
                p.takeDamage(10);
                this.sound.play('Explosion');
                proj.destroy();
            }
        }
    });
    this.physics.add.collider(this.projectiles, this.obstacles, (p, o) => p.destroy());
    this.physics.add.collider(this.projectiles, this.rocks, (p, o) => p.destroy());
    this.physics.add.collider(this.projectiles, this.walls, (p, w) => p.destroy());
    this.physics.add.collider(this.projectiles, this.innerWalls, (p, w) => p.destroy());
    this.physics.add.collider(this.projectiles, this.interactables, (p, i) => {
        if (!(i instanceof Door) || !i.isOpen) p.destroy();
    });

    // Helper para outros objetos registrarem fontes de luz (Runes, Tochas, etc.)
    this.addLightSource = (obj, radius = 2) => {
        const sourceData = { source: obj, radius: radius, active: true };
        this.lightSources.push(sourceData);
        // Garantir que a fonte de luz seja removida se o objeto for destruído
        obj.on('destroy', () => {
            const idx = this.lightSources.indexOf(sourceData);
            if (idx !== -1) this.lightSources.splice(idx, 1);
        });
        return sourceData;
    };

    // GENERATE LEVEL 1
    generateLevel(this);
    player.triggerSpawnEffect();

    // Rune interaction: overlap for destruction, collider for solidity
    this.physics.add.overlap(player, this.runes, (p, rune) => {
        if (!p.isDead) rune.tryBreak(p);
    });
    this.physics.add.collider(player, this.runes);

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
                case 'TORCH':
                    p.inventory.torch = (p.inventory.torch || 0) + 1;
                    updateInventoryUI('torch', p.inventory.torch);
                    this.showPopup("Tocha coletada!", p.x, p.y - 50);
                    break;
                case 'MEAT':
                    p.inventory.meat = (p.inventory.meat || 0) + 1;
                    updateInventoryUI('meat', p.inventory.meat);
                    break;
                case 'HAM':
                    p.inventory.ham = (p.inventory.ham || 0) + 1;
                    updateInventoryUI('ham', p.inventory.ham);
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
        // Renderizar em 2× e reduzir com setScale(0.5) para texto nítido
        let text = this.add.text(x, y, `${amount}`, {
            fontSize: '20px',          // 2× de 10px visual
            fontFamily: '"Press Start 2P"',
            fill: color,
            stroke: '#000000',
            strokeThickness: 4,        // 2× proporcional
            resolution: 2
        }).setOrigin(0.5).setScale(0.5);
        text.setDepth(99999);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    };

    this.showPopup = (text, x, y, color = '#fff') => {
        // Reduzi para 16px (visual 8px) para ficar mais sutil como pedido
        let t = this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: '"Press Start 2P"',
            color: color,
            stroke: '#000',
            strokeThickness: 3,
            align: 'center',
            resolution: 2
        }).setOrigin(0.5).setScale(0.5);
        t.setDepth(100000);
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
    const invTypes = ['health', 'speed', 'strength', 'stamina', 'coin', 'key', 'meat', 'ham'];
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
    // P and ESC to Pause, ENTER to Toggle (Pause/Unpause)
    this.input.keyboard.on('keydown-P', () => { if (!isPaused) togglePause(this); });
    this.input.keyboard.on('keydown-ESC', () => { if (isPaused) togglePause(this); });
    this.input.keyboard.on('keydown-ENTER', () => togglePause(this));
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // --- START MENU / LOADING LOGIC ---
    // Handled by StartScene now
    const loadingScreen = document.getElementById('loading-screen');
    // Hide Loading Screen (Assets loaded & Scene created)
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        loadingScreen.style.display = 'none';
    }

    firstTimeStart = false;

    // --- SISTEMA DE LUZ BASEADO EM TILES (estilo Tibia) ---
    this.lightGfx = this.add.graphics();
    this.lightGfx.setScrollFactor(0);
    this.lightGfx.setDepth(99998);

    // Raio base da luz do player em tiles. Altere este valor para mudar o alcance padrão.
    this.playerLightRadius = 5;

    // API para boost temporário de luz (ex: item Tocha)
    // Uso: this.setLightBoost(extraTiles, durationMs)
    this.setLightBoost = (extraTiles, duration) => {
        this.playerLightRadius = 5 + extraTiles;
        if (this._lightBoostTimer) this._lightBoostTimer.remove();
        this._lightBoostTimer = this.time.addEvent({
            delay: duration,
            callback: () => { this.playerLightRadius = 5; }
        });
    };
}

// Item Definitions
const ITEM_METADATA = {
    health: { icon: '<img src="Asset/Misc/heart_UI.png" title="Health Heart">', title: 'Health Heart', usable: true },
    speed: { icon: '<img src="Asset/Misc/speed_UI.png" title="Speed Potion">', title: 'Speed Potion', usable: true },
    strength: { icon: '<img src="Asset/Misc/force_UI.png" title="Strength Potion">', title: 'Strength Potion', usable: true },
    stamina: { icon: '<img src="Asset/Misc/stamina_UI.png" title="Stamina Potion">', title: 'Stamina Potion', usable: true },
    meat: { icon: '<img src="Asset/Misc/meat_UI.png" title="Meat">', title: 'Meat', usable: true },
    ham: { icon: '<img src="Asset/Misc/ham_UI.png" title="Ham">', title: 'Ham', usable: true },
    coin: { icon: '<img src="Asset/Misc/coin_UI.png" title="Coins">', title: 'Coins', usable: false },
    key: { icon: '<img src="Asset/Misc/key_UI.png" title="Keys">', title: 'Keys', usable: false },
    torch: {
        icon: '<img src="Asset/Misc/torch_UI.png" title="Torch">',
        title: 'Torch',
        usable: true,        // Agora pode ser usada pela mochila
        consumeOnPickup: false // Entra na mochila primeiro
    }
};

// --- SISTEMA DE TOCHA ---
function triggerTorchBoost(scene) {
    if (!scene.playerLightRadius) scene.playerLightRadius = 5;

    // Se já tiver uma tocha ativa, o usuário pode pedir para não resetar ou apenas avisar.
    // Por simplicidade, vamos permitir apenas uma ativa por vez (limpa o HUD anterior)
    const TORCH_DURATION = 30000;
    const TORCH_EXTRA_TILES = 5;
    scene.setLightBoost(TORCH_EXTRA_TILES, TORCH_DURATION);
    scene.showPopup('Tocha acesa! (+30s)', player.x, player.y - 50);

    // Salvar o timer ID na cena para limpeza se necessário
    if (scene._torchInterval) clearInterval(scene._torchInterval);

    // UI de contador da tocha (HUD no canto inferior da sidebar)
    let torchHUD = document.getElementById('torch-hud');
    if (!torchHUD) {
        torchHUD = document.createElement('div');
        torchHUD.id = 'torch-hud';
        torchHUD.style.cssText = [
            'position:absolute', 'bottom:12px', 'right:12px',
            'display:flex', 'align-items:center', 'gap:6px',
            'background:rgba(0,0,0,0.7)', 'border:2px solid #b8860b',
            'padding:4px 10px', 'border-radius:4px',
            'font-family:"Press Start 2P",monospace', 'font-size:10px',
            'color:#ffd700', 'z-index:9999', 'pointer-events:none'
        ].join(';');
        const sidebar = document.getElementById('inventory-sidebar') || document.body;
        sidebar.style.position = 'relative';
        sidebar.appendChild(torchHUD);
    }

    torchHUD.innerHTML = '<img src="Asset/Misc/torch_UI.png" style="height:20px;image-rendering:pixelated;"> <span id="torch-timer">30s</span>';

    let remaining = TORCH_DURATION / 1000;
    scene._torchInterval = setInterval(() => {
        remaining--;
        const timerEl = document.getElementById('torch-timer');
        if (timerEl) timerEl.textContent = remaining + 's';

        if (remaining <= 0) {
            clearInterval(scene._torchInterval);
            scene._torchInterval = null;
            if (torchHUD.parentNode) torchHUD.parentNode.removeChild(torchHUD);
        }
    }, 1000);
}

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

    const pauseUI = document.getElementById('pause-settings-ui');
    if (isPaused) {
        scene.physics.pause();
        scene.anims.pauseAll();
        scene.tweens.pauseAll();
        scene.time.paused = true; // Pausa eventos temporais (ex: burns, poisons)
        if (player && player.fireParticles) player.fireParticles.pause(); // Pausa o sistema de partículas
        createPauseScreen(scene);

        if (pauseUI) {
            pauseUI.style.display = 'block';
            // Sync sliders with current settings
            const sAmbient = document.getElementById('slider-ambient');
            const sSFX = document.getElementById('slider-sfx');
            if (sAmbient) sAmbient.value = Math.round(window.GameSettings.ambientVolume * 100);
            if (sSFX) sSFX.value = Math.round(window.GameSettings.sfxVolume * 100);
        }
    } else {
        if (pauseContainer) {
            pauseContainer.destroy();
            pauseContainer = null;
        }
        if (pauseUI) pauseUI.style.display = 'none';
        scene.physics.resume();
        scene.anims.resumeAll();
        scene.tweens.resumeAll();
        scene.time.paused = false; // Retoma os eventos temporais
        if (player && player.fireParticles) player.fireParticles.resume(); // Retoma o sistema de partículas
    }
}

function createPauseScreen(scene) {
    const { width, height } = scene.scale;

    pauseContainer = scene.add.container(0, 0).setDepth(200000).setScrollFactor(0);

    // 1. Dark Transparent Overlay
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
    pauseContainer.add(overlay);

    // 2. Pause Title
    const title = scene.add.text(width / 2, 100, 'GAME PAUSED', {
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

    const startY = 170;
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

    // Manual per-frame tile collision (avoids stale persistent colliders across level transitions)
    if (this.tileCollisionLayers && this.tileCollisionLayers.length) {
        this.tileCollisionLayers.forEach(layer => {
            if (!layer || !layer.active) return;
            this.physics.world.collide(player, layer);
            this.physics.world.collide(this.enemies, layer);
            this.physics.world.collide(this.projectiles, layer, (proj) => proj.destroy());
        });
    }

    if (player) {
        if (!player.inventory) {
            player.inventory = { health: 0, speed: 0, strength: 0, stamina: 0, meat: 0, ham: 0, torch: 0 };
        }
        player.update(time, delta);
        if (this.hazards) {
            this.hazards.getChildren().forEach(h => h.update(delta, player));
        }
        this.punchSoundPlayedThisFrame = -1; // Reset sound tracker for this update

        // --- LUZ BASEADA EM TILES (estilo Tibia retro) ---
        if (this.lightGfx) {
            const cam = this.cameras.main;
            const TILE = 64;

            // Oscilação de borda: dois senos lentos (respira, não pisca)
            const breathe = Math.sin(time * 0.00028) * 0.18
                + Math.sin(time * 0.00012) * 0.07;

            const startTX = Math.floor(cam.worldView.left / TILE) - 1;
            const startTY = Math.floor(cam.worldView.top / TILE) - 1;
            const endTX = Math.ceil(cam.worldView.right / TILE) + 1;
            const endTY = Math.ceil(cam.worldView.bottom / TILE) + 1;

            this.lightGfx.clear();

            const getAlphaValue = (nd) => {
                if (nd <= 0.60) return 0;    // raios internos: totalmente iluminados
                if (nd <= 0.73) return 0.30;
                if (nd <= 0.86) return 0.62;
                if (nd <= 1.00) return 0.88; // borda
                return 0.96;                 // preto/escuridão
            };

            // Prepare current positions of all light sources for this frame
            const activeLights = [];

            // Player Light
            if (player && player.active) {
                activeLights.push({
                    tx: Math.floor(player.x / TILE),
                    ty: Math.floor(player.y / TILE),
                    radius: this.playerLightRadius || 5
                });
            }

            // Other Lights (Runes, Objects)
            if (this.lightSources) {
                this.lightSources.forEach(src => {
                    if (src.active && src.source && src.source.active) {
                        activeLights.push({
                            tx: Math.floor(src.source.x / TILE),
                            ty: Math.floor(src.source.y / TILE),
                            radius: src.radius
                        });
                    }
                });
            }

            for (let ty = startTY; ty <= endTY; ty++) {
                for (let tx = startTX; tx <= endTX; tx++) {
                    let bestAlpha = 0.96; // Base darkness

                    activeLights.forEach(light => {
                        // Distância baseada em índices de tiles (restaura o visual "stepping")
                        const dist = Math.sqrt((tx - light.tx) ** 2 + (ty - light.ty) ** 2);
                        const normDist = dist / light.radius;

                        // Breathe afeta apenas as bordas da luz
                        const edgeFactor = Math.max(0, normDist - 0.60) / 0.40;
                        const adjustedND = normDist + breathe * edgeFactor;

                        const alpha = getAlphaValue(adjustedND);
                        if (alpha < bestAlpha) bestAlpha = alpha;
                    });

                    if (bestAlpha > 0.01) {
                        const sx = tx * TILE - cam.worldView.left;
                        const sy = ty * TILE - cam.worldView.top;
                        this.lightGfx.fillStyle(0x000000, bestAlpha);
                        this.lightGfx.fillRect(sx, sy, TILE, TILE);
                    }
                }
            }
        }
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

        // Update Runes (for hint text and proximity-based destruction)
        if (this.runes) {
            this.runes.getChildren().forEach(rune => {
                if (rune instanceof Rune) rune.update(player);
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
                    const currentFrame = player.anims.currentFrame ? player.anims.currentFrame.index : -1;

                    // Trigger hits on Frame 1 and Frame 4
                    if ((currentFrame === 1 || currentFrame === 4) &&
                        (enemy.lastHitPunchId !== player.punchId || enemy.lastHitPunchFrame !== currentFrame)) {

                        enemy.takeDamage(2, null); // Whole number damage
                        enemy.lastHitPunchId = player.punchId;
                        enemy.lastHitPunchFrame = currentFrame;
                        player.lastPunchTime = time;

                        // Play impact sound once per hit frame (even if hitting multiple enemies)
                        if (this.punchSoundPlayedThisFrame !== currentFrame) {
                            this.sound.play('Punch');
                            this.punchSoundPlayedThisFrame = currentFrame;
                        }
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

            // Damage Rocks
            if (this.rocks && player.isAttacking) {
                this.rocks.getChildren().forEach(rock => {
                    if (rock.isBroken) return;

                    const dist = Phaser.Math.Distance.Between(player.x, player.y, rock.x, rock.y);
                    const reach = 40 + player.attackReach + 10;

                    if (dist < reach) {
                        const currentFrame = player.anims.currentFrame ? player.anims.currentFrame.index : -1;
                        // Trigger hits on Frame 1 and Frame 4
                        if ((currentFrame === 1 || currentFrame === 4) &&
                            (rock.lastHitPunchId !== player.punchId || rock.lastHitPunchFrame !== currentFrame)) {

                            rock.takeDamage(1);
                            rock.lastHitPunchId = player.punchId;
                            rock.lastHitPunchFrame = currentFrame;
                            player.lastPunchTime = time;

                            if (this.punchSoundPlayedThisFrame !== currentFrame) {
                                this.sound.play('Punch');
                                this.punchSoundPlayedThisFrame = currentFrame;
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
    scene.lichTeleportPoints = [];
    scene.groundPositions = [];

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
                    const randomFrame = Phaser.Math.Between(0, 4);
                    const rock = new Rock(scene, tx, ty, randomFrame);
                    scene.rocks.add(rock);
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

    // --- Level Data (Manual vs Tiled vs Procedural) ---
    const tiledKey = LEVEL_TILED_MAP[currentLevel];
    const hasTiledMap = !!(tiledKey && scene.cache.tilemap.has(tiledKey));

    if (hasTiledMap) {
        console.log("Loading Tiled Level " + currentLevel);
        const map = scene.make.tilemap({ key: tiledKey });

        // Use (0,0) as origin for Tiled maps to match editor coordinates
        const originX = 0;
        const originY = 0;
        const mapPxW = map.widthInPixels;
        const mapPxH = map.heightInPixels;

        // Reset world & camera bounds
        scene.cameras.main.setBounds(originX, originY, mapPxW, mapPxH);
        scene.physics.world.setBounds(originX, originY, mapPxW, mapPxH);

        // Register tilesets.
        // 'System' tileset is editor-only. Phaser needs it to resolve GIDs, so we create a
        // 1x1 transparent texture on-the-fly if it doesn't exist, then register it normally.
        if (!scene.textures.exists('System')) {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            scene.textures.addCanvas('System', canvas);
        }
        const phaserTilesets = map.tilesets.map(ts => {
            const phaserKey = TILESET_PHASER_KEY[ts.name] || ts.name;
            const result = map.addTilesetImage(ts.name, phaserKey);
            if (!result) {
                console.warn(`[Tiled] Could not register tileset: ${ts.name} (key: ${phaserKey})`);
            }
            return result;
        }).filter(ts => ts !== null && ts !== undefined);

        scene.activeTiledLayers = [];
        scene.activeTiledMap = map;
        scene.tiledColliders = []; // fresh list for this level's tile layer colliders

        // 1. Tile Layers
        map.layers.forEach(layerData => {
            const layer = map.createLayer(layerData.name, phaserTilesets, originX, originY);
            if (!layer) return;

            const props = layerData.properties || [];
            const isCollision = props.some(p => p.name === 'collision' && p.value === true);
            const depth = props.find(p => p.name === 'depth')?.value ?? -20000;
            layer.setDepth(depth);

            if (isCollision) {
                layer.setCollisionByExclusion([-1]);
                // Store the layer for per-frame manual collision (avoids persistent stale colliders)
                if (!scene.tileCollisionLayers) scene.tileCollisionLayers = [];
                scene.tileCollisionLayers.push(layer);
            }

            // Register ground for dirt
            if (!isCollision) {
                layer.forEachTile(t => {
                    if (t.index !== -1) {
                        scene.groundPositions.push({
                            x: t.pixelX + map.tileWidth / 2,
                            y: t.pixelY + map.tileHeight / 2
                        });
                    }
                });
            }
            scene.activeTiledLayers.push(layer);
        });

        // 2. Object Layers (Enemies, Portal, etc.)
        map.getObjectLayerNames().forEach(layerName => {
            const objects = map.getObjectLayer(layerName).objects;
            objects.forEach(obj => {
                const ox = obj.x;
                const oy = obj.y;

                // Check case-insensitive since MapManager exports 'playerStart' (lowercase p)
                const objTypeLower = (obj.type || '').toLowerCase();
                const objNameLower = (obj.name || '').toLowerCase();
                if (objTypeLower === 'playerstart' || objNameLower === 'playerstart') {
                    player.setPosition(ox, oy);
                    player.spawnPoint = { x: ox, y: oy };
                    scene.rebornSprite = scene.add.sprite(ox, oy + REBORN_SPRITE_OFFSET_Y, 'reborn_place_sheet', 0).setDepth(-19998);
                    scene.rebornSprite.play('reborn-activate');
                } else if (['enemy', 'lichking', 'vambat', 'skeleton', 'skullbug', 'ranged', 'enemy_melee', 'enemy_ranged', 'enemy_skeleton', 'enemy_vambat', 'enemy_skullbug', 'enemy_lichking'].includes(objTypeLower)) {
                    let e;
                    const cleanType = objTypeLower.replace('enemy_', '');
                    switch (cleanType) {
                        case 'lichking': e = new LichKing(scene, ox, oy); break;
                        case 'vambat': e = new VamBatEnemy(scene, ox, oy); break;
                        case 'skeleton': e = new SkeletonEnemy(scene, ox, oy); break;
                        case 'skullbug': e = new SkullBugEnemy(scene, ox, oy); break;
                        case 'ranged': e = new RangedEnemy(scene, ox, oy); break;
                        default: e = new Enemy(scene, ox, oy); break;
                    }
                    scene.enemies.add(e);
                } else if (objTypeLower === 'portal') {
                    const portal = new Portal(scene, ox, oy);
                    const target = obj.properties?.find(p => p.name === 'targetLevel')?.value;
                    if (target !== undefined) portal.targetLevel = target;
                    scene.portals.add(portal);
                } else if (objTypeLower.startsWith('chest')) {
                    // Handle chest, chest_up, chest_down, chest_left, chest_right
                    let dir = 'down';
                    if (objTypeLower.includes('up')) dir = 'up';
                    if (objTypeLower.includes('left')) dir = 'left';
                    if (objTypeLower.includes('right')) dir = 'right';
                    const loot = obj.properties?.find(p => p.name === 'loot')?.value || 'COIN';
                    scene.interactables.add(new Chest(scene, ox, oy, { type: loot }, { direction: dir }));
                } else if (objTypeLower === 'rock') {
                    const randomFrame = Phaser.Math.Between(0, 4); // 5 frames [0,1,2,3,4]
                    // Pass obj to allow custom radius/offsetX/offsetY from Tiled properties
                    const rock = new Rock(scene, ox, oy, randomFrame, obj);
                    scene.rocks.add(rock);
                } else if (objTypeLower.startsWith('rune_')) {
                    // rune_0 to rune_5
                    const runeIdx = parseInt(objTypeLower.split('_')[1]) || 0;
                    const rune = new Rune(scene, ox, oy, runeIdx);
                    scene.runes.add(rune);
                } else if (objTypeLower === 'teleport_point' || objTypeLower === 'lich_teleport') {
                    scene.lichTeleportPoints.push({ x: ox, y: oy });
                }
            });
        });

        // Fallback if no PlayerStart found in Tiled
        if (!player.spawnPoint || player.spawnPoint.x === 0) {
            const start = currentLevelData?.playerStart || { x: 300, y: 300 };
            player.setPosition(start.x, start.y);
            player.spawnPoint = start;
        }

    } else if (currentLevelData && !currentLevelData.isProcedural) {
        console.log("Loading Manual Level " + currentLevel);
        // ... (Manual Loading Logic - Keep for levels without Tiled)
        const worldSize = 2048;
        const levelBounds = currentLevelData.groundBounds || { startX: -worldSize / 2, startY: -worldSize / 2, endX: worldSize / 2, endY: worldSize / 2 };
        scene.cameras.main.setBounds(levelBounds.startX, levelBounds.startY, levelBounds.endX - levelBounds.startX, levelBounds.endY - levelBounds.startY);
        scene.physics.world.setBounds(levelBounds.startX, levelBounds.startY, levelBounds.endX - levelBounds.startX, levelBounds.endY - levelBounds.startY);

        if (currentLevelData.playerStart) {
            const px = currentLevelData.playerStart.x;
            const py = currentLevelData.playerStart.y;
            player.setPosition(px, py);
            player.spawnPoint = { x: px, y: py };
            scene.rebornSprite = scene.add.sprite(px, py + REBORN_SPRITE_OFFSET_Y, 'reborn_place_sheet', 0).setDepth(-19998);
            scene.rebornSprite.play('reborn-activate');
        }

        if (currentLevelData.rooms) {
            currentLevelData.rooms.forEach(r => createStructure(r.x, r.y, r.w, r.h, r.keyId, { addChest: r.addChest, addGuards: r.addGuards }));
        }

        if (currentLevelData.enemies) {
            currentLevelData.enemies.forEach(e => {
                let ent;
                switch (e.type) {
                    case 'lichking': ent = new LichKing(scene, e.x, e.y); break;
                    case 'vambat': ent = new VamBatEnemy(scene, e.x, e.y); break;
                    case 'skeleton': ent = new SkeletonEnemy(scene, e.x, e.y); break;
                    case 'skullbug': ent = new SkullBugEnemy(scene, e.x, e.y); break;
                    case 'ranged': ent = new RangedEnemy(scene, e.x, e.y); break;
                    default: ent = new Enemy(scene, e.x, e.y); break;
                }
                scene.enemies.add(ent);
            });
        }

        // Manual Tiles
        const textureKeyMap = { 'GroundSlice': 'ground_slice', 'GroundSlice2': 'ground_slice', 'Ground': 'ground_sheet', 'CornerSlice': 'inner_corner_sheet' };
        const decorativeTextures = new Set(['Ground']);
        const colDefs = currentLevelData.collisionDefinitions;

        const spawnTile = (wx, wy, frame, rot, texName, depth) => {
            const resTex = textureKeyMap[texName] || texName;
            if (decorativeTextures.has(texName)) {
                const img = scene.add.image(wx, wy, resTex, frame).setDepth(depth);
                if (rot) img.setAngle(rot * 90);
                scene.groundLayer.add(img);
                scene.groundPositions.push({ x: wx, y: wy });
            } else {
                const wall = new Wall(scene, wx, wy, resTex, frame, {
                    collisionGroup: scene.walls,
                    rotation: rot,
                    collisionDefinition: colDefs ? (colDefs[texName] || colDefs[resTex])?.[frame] : null
                }).setDepth(depth);
                scene.walls.add(wall);
            }
        };

        const iterTiles = (data, defDepth) => {
            if (!data) return;
            if (Array.isArray(data)) data.forEach(t => spawnTile(t.x, t.y, t.frame || 0, t.rotation || 0, t.texture, t.depth ?? defDepth));
            else Object.values(data).forEach(g => g.tiles.forEach(t => spawnTile(t[0], t[1], t[2] || 0, t[3] || 0, g.texture, g.depth ?? defDepth)));
        };

        iterTiles(currentLevelData.walls, -40000);
        iterTiles(currentLevelData.visualTiles, -35000);

        if (currentLevelData.portal) scene.portals.add(new Portal(scene, currentLevelData.portal.x, currentLevelData.portal.y));

    } else {
        console.warn("Level " + currentLevel + " missing data or is procedural (logic for procedural pending).");
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

    // Shield UI: Drains while active, recharges during cooldown
    const shieldBar = document.getElementById('bar-shield');
    if (shieldBar) {
        if (player.energyShieldActive) {
            const pct = Math.max(0, (player.energyShieldTimer / player.energyShieldDuration) * 100);
            shieldBar.style.width = `${pct}%`;
            shieldBar.style.backgroundColor = '#88ccff'; // cyan bright while active
            shieldBar.classList.add('charging');
            shieldBar.classList.remove('ready');
        } else {
            shieldBar.style.backgroundColor = ''; // Reset to default CSS
            updateBar('bar-shield', player.energyShieldCooldownTimer, player.energyShieldCooldown);
        }
    }

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
            currentLevel = 1; // Reset to Level 1 (Tutorial deleted)
            console.log("Resetting to Level 1");
        } else {
            currentLevel++;
        }
    }

    // --- SEGURANÇA: Resetar estados de movimentação do Player ao trocar de fase ---
    if (player) {
        player.isGroundDashing = false;
        player.isJumpKicking = false;
        player.isAttacking = false;
        player.hasJumpKicked = false;
        player.actionLockTimer = 300; // Trava movimentação por 1 segundo na entrada
        if (player.body) player.setVelocity(0, 0);
    }

    // Destruir tilemap Phaser ativo (se houver)
    scene.tileCollisionLayers = [];
    scene.tiledColliders = [];
    if (scene.activeTiledLayers) {
        scene.activeTiledLayers.forEach(l => l.destroy());
        scene.activeTiledLayers = [];
    }
    if (scene.activeTiledMap) {
        scene.activeTiledMap.destroy();
        scene.activeTiledMap = null;
    }

    // Clear Level
    scene.groundLayer.clear(true, true);
    scene.walls.clear(true, true);
    scene.innerWalls.clear(true, true);
    scene.obstacles.clear(true, true);
    scene.rocks.clear(true, true);
    scene.hazards.clear(true, true);
    scene.enemies.clear(true, true);
    scene.projectiles.clear(true, true);
    scene.interactables.clear(true, true);
    scene.items.clear(true, true);
    scene.traps.clear(true, true);
    scene.holdingTraps.clear(true, true);
    scene.portals.clear(true, true);
    scene.runes.clear(true, true);
    scene.dirtDecorations.clear(true, true);
    scene.wallSprites.clear(false, false);  // Wall objects already destroyed by walls.clear above — only remove refs
    scene.debugShapes.clear(true, true);

    if (scene._torchInterval) {
        clearInterval(scene._torchInterval);
        scene._torchInterval = null;
        const torchHUD = document.getElementById('torch-hud');
        if (torchHUD && torchHUD.parentNode) torchHUD.parentNode.removeChild(torchHUD);
    }

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

