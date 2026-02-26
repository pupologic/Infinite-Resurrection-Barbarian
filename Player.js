class Player extends Phaser.Physics.Arcade.Sprite {
    static createAnimations(scene) {
        const texture = scene.textures.get('warrior_full');
        const idleTexture = scene.textures.get('warrior_idle_full');
        const punchTexture = scene.textures.get('warrior_punch_full');
        const punchIdleTexture = scene.textures.get('warrior_punch_idle_full');
        const jumpTexture = scene.textures.get('warrior_jump_full');
        const jumpKickTexture = scene.textures.get('warrior_jump_kick_full');
        const dashTexture = scene.textures.get('warrior_dash_full');
        const shieldTexture = scene.textures.get('warrior_shield_full');
        const roarTexture = scene.textures.get('warrior_roar_full');
        const poundTexture = scene.textures.get('warrior_pound_full');

        // All sheets are 8x8
        const frameWidth = texture.source[0].width / 8;
        const frameHeight = texture.source[0].height / 8;
        const idleFrameWidth = idleTexture.source[0].width / 8;
        const idleFrameHeight = idleTexture.source[0].height / 8;
        const punchFrameWidth = punchTexture.source[0].width / 8;
        const punchFrameHeight = punchTexture.source[0].height / 8;
        const punchIdleFrameWidth = punchIdleTexture.source[0].width / 8;
        const punchIdleFrameHeight = punchIdleTexture.source[0].height / 8;
        const jumpFrameWidth = jumpTexture.source[0].width / 8;
        const jumpFrameHeight = jumpTexture.source[0].height / 8;
        const jumpKickFrameWidth = jumpKickTexture.source[0].width / 8;
        const jumpKickFrameHeight = jumpKickTexture.source[0].height / 8;

        const dashFrameWidth = dashTexture.source[0].width / 8;
        const dashFrameHeight = dashTexture.source[0].height / 8;
        const shieldFrameWidth = shieldTexture.source[0].width / 8;
        const shieldFrameHeight = shieldTexture.source[0].height / 8;
        const roarFrameWidth = roarTexture.source[0].width / 8;
        const roarFrameHeight = roarTexture.source[0].height / 8;
        const poundFrameWidth = poundTexture.source[0].width / 8;
        const poundFrameHeight = poundTexture.source[0].height / 8;

        const hurtTexture = scene.textures.get('warrior_hurt_full');
        const hurtFrameWidth = hurtTexture.source[0].width / 3;
        const hurtFrameHeight = hurtTexture.source[0].height / 3;

        const deadTexture = scene.textures.get('warrior_dead_full');
        const deadFrameWidth = deadTexture.source[0].width / 8;
        const deadFrameHeight = deadTexture.source[0].height / 8;

        scene.textures.addSpriteSheet('warrior', texture.source[0].image, { frameWidth, frameHeight });
        scene.textures.addSpriteSheet('warrior_idle', idleTexture.source[0].image, { frameWidth: idleFrameWidth, frameHeight: idleFrameHeight });
        scene.textures.addSpriteSheet('warrior_punch', punchTexture.source[0].image, { frameWidth: punchFrameWidth, frameHeight: punchFrameHeight });
        scene.textures.addSpriteSheet('warrior_punch_idle', punchIdleTexture.source[0].image, { frameWidth: punchIdleFrameWidth, frameHeight: punchIdleFrameHeight });
        scene.textures.addSpriteSheet('warrior_jump', jumpTexture.source[0].image, { frameWidth: jumpFrameWidth, frameHeight: jumpFrameHeight });
        scene.textures.addSpriteSheet('warrior_jump_kick', jumpKickTexture.source[0].image, { frameWidth: jumpKickFrameWidth, frameHeight: jumpKickFrameHeight });
        scene.textures.addSpriteSheet('warrior_dash', dashTexture.source[0].image, { frameWidth: dashFrameWidth, frameHeight: dashFrameHeight });
        scene.textures.addSpriteSheet('warrior_shield', shieldTexture.source[0].image, { frameWidth: shieldFrameWidth, frameHeight: shieldFrameHeight });
        scene.textures.addSpriteSheet('warrior_roar', roarTexture.source[0].image, { frameWidth: roarFrameWidth, frameHeight: roarFrameHeight });
        scene.textures.addSpriteSheet('warrior_pound', poundTexture.source[0].image, { frameWidth: poundFrameWidth, frameHeight: poundFrameHeight });
        scene.textures.addSpriteSheet('warrior_hurt', hurtTexture.getSourceImage(), { frameWidth: hurtFrameWidth, frameHeight: hurtFrameHeight });
        scene.textures.addSpriteSheet('warrior_dead', deadTexture.source[0].image, { frameWidth: deadFrameWidth, frameHeight: deadFrameHeight });

        const directions = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
        directions.forEach((dir, rowIndex) => {
            scene.anims.create({
                key: `walk-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: -1
            });
            scene.anims.create({
                key: `idle-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_idle', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 8, repeat: -1
            });
            scene.anims.create({
                key: `punch-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_punch', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 15, repeat: 0
            });
            scene.anims.create({
                key: `punch-idle-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_punch_idle', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 15, repeat: 0
            });
            scene.anims.create({
                key: `jump-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_jump', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 24, repeat: 0
            });
            scene.anims.create({
                key: `jump-kick-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_jump_kick', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 24, repeat: 0
            });
            scene.anims.create({
                key: `dash-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_dash', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 24, repeat: 0
            });
            scene.anims.create({
                key: `shield-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_shield', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: -1
            });
            scene.anims.create({
                key: `roar-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_roar', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 15, repeat: 0
            });
            scene.anims.create({
                key: `pound-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_pound', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 15, repeat: 0
            });
            scene.anims.create({
                key: `hurt-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_hurt', { start: rowIndex, end: rowIndex }),
                frameRate: 1, repeat: 0
            });
            scene.anims.create({
                key: `dead-${dir}`,
                frames: scene.anims.generateFrameNumbers('warrior_dead', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: 0
            });
        });

        // Pound FX Animation
        if (scene.textures.exists('warrior_pound_fx_full')) {
            const pfxTexture = scene.textures.get('warrior_pound_fx_full');
            const pfxFW = pfxTexture.source[0].width / 2;
            const pfxFH = pfxTexture.source[0].height / 2;

            scene.textures.addSpriteSheet('warrior_pound_fx', pfxTexture.source[0].image, { frameWidth: pfxFW, frameHeight: pfxFH });

            scene.anims.create({
                key: 'pound-fx-anim',
                frames: scene.anims.generateFrameNumbers('warrior_pound_fx', { start: 0, end: 3 }),
                frameRate: 12,
                repeat: 0,
                yoyo: true,
                hold: 3000 // Hold last frame for ~10 game frames before reversing
            });
        }

        // Shield FX Animation (3x3)
        if (scene.textures.exists('warrior_shield_fx_full')) {
            const sfxTexture = scene.textures.get('warrior_shield_fx_full');
            const sfxFW = sfxTexture.source[0].width / 3;
            const sfxFH = sfxTexture.source[0].height / 3;

            scene.textures.addSpriteSheet('warrior_shield_fx', sfxTexture.source[0].image, { frameWidth: sfxFW, frameHeight: sfxFH });

            scene.anims.create({
                key: 'shield-fx-anim',
                frames: scene.anims.generateFrameNumbers('warrior_shield_fx', { start: 0, end: 8 }),
                frameRate: 12,
                repeat: -1
            });
        }

        return { frameWidth, frameHeight };
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'warrior');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setPushable(false);
        this.spawnPoint = { x: x, y: y }; // Store spawn point

        this.hp = 100;
        this.hp = 100;
        this.maxHp = 100;
        this.stamina = 50;
        this.maxStamina = 50;
        this.staminaRegenAccumulator = 0;

        // Core Properties
        this.baseSpeed = 200;
        this.currentSpeed = this.baseSpeed;
        this.speed = this.currentSpeed; // Keeping this for compatibility if referenced directly
        this.coins = 0;

        // Power-up States
        this.speedBoostTimer = 0;
        this.strengthBoostTimer = 0;
        this.damageMultiplier = 2;

        this.lastDirection = 'down';
        this.isAttacking = false;
        this.attackReach = 20; // Increased range for player attacks
        this.attackAngle = 145; // Adjustable angle in degrees
        this.punchGraceFrames = 1; // Increased for better hit detection
        this.graceCounter = 0;
        this.punchPressed = false;
        this.lastPunchTime = 0;

        // Inventory
        this.keys = [];

        // Death / Respawn Status
        this.isDead = false;
        this.respawnDelay = 2000;

        // Negative Status
        this.isTrapped = false;
        this.isHurt = false;
        this.isRoaring = false;
        this.isPounding = false;
        this.isDefending = false;
        this.isPickingUp = false;
        this.pickupTimer = null;

        this.lastDamageTime = -1000;

        // Jump Properties
        this.altitude = 0;
        this.zVelocity = 0;
        this.gravity = 0.4;
        this.jumpStrength = -6;
        this.jumpStartupFrames = 12;
        this.jumpStartupCounter = 0;
        this.isJumpStartup = false;

        // Jump Kick Properties
        this.isJumpKicking = false;
        this.jumpKickTimer = 0;
        this.jumpKickDashPower = 600;
        this.jumpKickDashDuration = 24;
        this.jumpKickEndBoost = -2;
        this.hasJumpKicked = false;
        this.jumpKickEaseIn = 0.15;
        this.kickPushForce = 400; // Force applied to enemies on kick impact
        this.kickHitGroup = new Set(); // To track enemies hit during current jump kick

        this.jumpKickCooldown = 6000;
        this.jumpKickCooldownTimer = 0;

        // Ground Dash Properties
        this.isGroundDashing = false;
        this.groundDashTimer = 0;
        this.groundDashDuration = 18;
        this.groundDashPower = 700;
        this.groundDashEaseIn = 0.2;

        this.dashCooldown = 2000;
        this.dashCooldownTimer = 0;

        // Dash Ghost Trail
        this.ghostTimer = 0;
        this.ghostInterval = 50; // Spawns a ghost every 50ms during dash

        // Defense
        this.isDefending = false;
        this.shieldFx = null;
        this.shieldFxActive = false;

        // Roar State
        this.isRoaring = false;
        this.roarDamageDealt = false;

        // Ground Pound State
        this.isPounding = false;
        this.poundDamageDealt = false;

        // Spawn Effect
        this.spawnEffectTimer = 0;

        // Roar Ability
        this.roarCooldown = 20000;
        this.roarTimer = 0;
        this.roarRadius = 300;

        // Ground Pound Ability
        this.poundCooldown = 14000;
        this.poundTimer = 0;
        this.poundWidth = 60;
        this.poundLength = 150;

        // Global Action Lock (Stun/Recovery)
        this.actionLockTimer = 0;

        // Diagonal Snapping
        this.diagonalPersistenceDelay = 100;
        this.lastDiagonalTime = 0;
        this.lastDiagonalDir = '';

        // Physics Body Setup
        this.setCollideWorldBounds(true);
        // Assuming frame dimensions are available or fixed. 
        // We'll use the current frame width/height once animations are set.
        // For now, we'll set it after the first update or in a post-init.
        this.baseFrameWidth = this.width;
        this.baseFrameHeight = this.height;

        // Visuals
        this.shadow = scene.add.ellipse(0, 0, 50, 25, 0x000000, 1.5);
        this.shadow.setDepth(-19997); // Above reborn place (-19998)
        this.shadow.resetPipeline(); // Shadows should not use Light2D pipeline

        // --- SOUND EVENTS ---
        this.on('animationupdate', (anim, frame) => {
            if (anim.key.startsWith('punch-') || anim.key.startsWith('punch-idle-')) {
                // Play AutoPunch every 4 frames (frame 4, 8...)
                if (frame.index % 4 === 0) {
                    this.scene.sound.play('AutoPunch', { volume: 0.5 });
                }
            }
        });

        this.walkSound = scene.sound.add('WalkPlayer', { loop: true, volume: 0.5 });

        // Input Setup
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.roarKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.groundPoundKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.dashKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.defenseKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }

    setupPhysics(frameWidth, frameHeight) {
        this.baseFrameWidth = frameWidth;
        this.baseFrameHeight = frameHeight;

        // Switch to Circular Body
        // Previous size was 0.4 * frameWidth. Radius should be half of that (0.2).
        const radius = frameWidth * 0.2;
        // Offset remains similar to center it at the feet (0.5Y)
        this.body.setCircle(radius, frameWidth * 0.3, frameHeight * 0.5);
    }

    update(time, delta) {
        if (this.isDead) {
            if (this.shieldFx) this.shieldFx.setVisible(false);
            // Update shadow position even when dead so it stays under the body
            if (this.shadow) {
                this.shadow.setPosition(this.x, this.y + 40);
            }
            return;
        }

        // Update shadow
        if (this.shadow) {
            this.shadow.setPosition(this.x, this.y + (this.body.height / 2) - 5);
            this.shadow.setDepth(-19997);
        }

        let moveX = 0;
        let moveY = 0;
        const scene = this.scene;
        const pointer = scene.input.activePointer;
        // Only consider mouse input if it's directly on the game canvas (ignores DOM UI)
        const isPointerOnCanvas = pointer.event && pointer.event.target === scene.game.canvas;
        const attackJustPressed = Phaser.Input.Keyboard.JustDown(this.attackKey) || (pointer.isDown && !this.punchPressed && isPointerOnCanvas);
        const currentPointerDown = pointer.isDown && isPointerOnCanvas;

        // Update Cooldowns / Timers
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= delta;
        if (this.jumpKickCooldownTimer > 0) this.jumpKickCooldownTimer -= delta;
        if (this.roarTimer > 0) this.roarTimer -= delta;
        if (this.poundTimer > 0) this.poundTimer -= delta;
        if (this.actionLockTimer > 0) this.actionLockTimer -= delta;
        if (this.spawnEffectTimer > 0) this.spawnEffectTimer -= delta;

        // Dash Ghost Trail Logic
        if (this.isGroundDashing || this.isJumpKicking) {
            this.ghostTimer -= delta;
            if (this.ghostTimer <= 0) {
                this.spawnGhost();
                this.ghostTimer = this.ghostInterval;
            }
        }

        // Stamina Regen
        this.staminaRegenAccumulator += delta;
        if (this.staminaRegenAccumulator >= 2000) {
            if (this.stamina < this.maxStamina) {
                this.stamina = Math.min(this.stamina + 5, this.maxStamina);
            }
            this.staminaRegenAccumulator = 0;
        }

        // Reset roar/pound damage dealt flags when not in animation
        if (this.isRoaring && !this.anims.isPlaying || (this.anims.currentAnim && !this.anims.currentAnim.key.startsWith('roar-'))) {
            this.isRoaring = false;
        }
        if (this.isPounding && !this.anims.isPlaying || (this.anims.currentAnim && !this.anims.currentAnim.key.startsWith('pound-'))) {
            this.isPounding = false;
        }

        // Damage frame activation
        if (this.isRoaring && this.anims.currentFrame && this.anims.currentFrame.index === 5 && !this.roarDamageDealt) {
            this.applyRoarDamage();
            this.roarDamageDealt = true;
        }
        if (this.isPounding && this.anims.currentFrame && this.anims.currentFrame.index === 4 && !this.poundDamageDealt) {
            this.applyPoundDamage();
            this.poundDamageDealt = true;
        }

        // Handle Speed Boost
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= delta;
            if (this.speedBoostTimer <= 0) {
                this.currentSpeed = this.baseSpeed;
                this.speed = this.baseSpeed;
                this.clearTint();
                this.anims.globalTimeScale = 1; // Reset animation speed
            } else {
                // Flashing blue tint or steady? User said "sutil tint azulado"
                this.setTint(0xaaaaff);
            }
        }

        // Handle Strength Boost
        if (this.strengthBoostTimer > 0) {
            this.strengthBoostTimer -= delta;
            if (this.strengthBoostTimer <= 0) {
                this.damageMultiplier = 1;
                this.clearTint();
                this.alpha = 1;
            }
        }

        // Tint Logic (Priority: Strength > Speed)
        if (this.strengthBoostTimer > 0) {
            const t = scene.time.now / 100;
            this.setTint(0xffd700);
            this.alpha = 0.8 + Math.sin(t) * 0.2;
        } else if (this.hasJumpKicked || this.isGroundDashing) {
            this.setTint(0xffffc5); // Soft Gold tint for action
            this.alpha = 1;
        } else if (this.speedBoostTimer > 0) {
            this.setTint(0x88ccff);
            this.alpha = 1;
        } else {
            if (this.hp > 0 && !this.isDead) {
                if (time > this.lastDamageTime + 200) {
                    this.clearTint();
                    this.alpha = 1;
                }
            }
        }

        // 1. Input Logic
        // Detect Ground Dash (SHIFT)
        // Detect Ground Dash (SHIFT)
        if (Phaser.Input.Keyboard.JustDown(this.dashKey) && this.altitude === 0 && !this.isJumpStartup && !this.isGroundDashing && this.dashCooldownTimer <= 0 && this.actionLockTimer <= 0 && !this.isTrapped) {
            if (this.stamina >= 10) {
                this.stamina -= 10;
                this.isGroundDashing = true;
                this.groundDashTimer = this.groundDashDuration;
                this.dashCooldownTimer = this.dashCooldown;
                this.isAttacking = false;
                this.scene.sound.play('Dash');
            }
        }

        // Handle Defense Input
        this.isDefending = this.defenseKey.isDown && this.altitude === 0 && !this.isAttacking && !this.isJumpStartup && !this.isGroundDashing && !this.isJumpKicking && this.actionLockTimer <= 0 && !this.isTrapped;
        this.updateShieldFx();


        // Detect Jump (SPACE)
        if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && this.altitude === 0 && !this.isJumpStartup && !this.isTrapped && this.actionLockTimer <= 0) {
            this.isJumpStartup = true;
            this.jumpStartupCounter = 0;
            this.isAttacking = false;
        }

        // Detect Jump Kick (Attack while in the air)
        if (this.altitude > 0 && attackJustPressed && !this.isJumpKicking && !this.isJumpStartup && !this.hasJumpKicked && this.jumpKickCooldownTimer <= 0 && this.actionLockTimer <= 0) {
            if (this.stamina >= 20) {
                this.stamina -= 20;
                this.isJumpKicking = true;
                this.hasJumpKicked = true;
                this.jumpKickCooldownTimer = this.jumpKickCooldown;
                this.kickHitGroup.clear(); // Reset hit tracking for new kick
                this.jumpKickTimer = this.jumpKickDashDuration;
                this.scene.sound.play('Kick');

                let dashX = 0, dashY = 0;
                if (this.lastDirection.includes('left')) dashX = -1;
                if (this.lastDirection.includes('right')) dashX = 1;
                if (this.lastDirection.includes('up')) dashY = -1;
                if (this.lastDirection.includes('down')) dashY = 1;

                if (dashX !== 0 || dashY !== 0) {
                    let dashVec = new Phaser.Math.Vector2(dashX, dashY).normalize().scale(this.jumpKickDashPower);
                    this.setVelocity(dashVec.x, dashVec.y);
                }
            }
        }

        // Detect Roar (R)
        if (Phaser.Input.Keyboard.JustDown(this.roarKey) && this.roarTimer <= 0 && !this.isDead && this.actionLockTimer <= 0 && !this.isTrapped) {
            if (this.stamina >= 40) {
                this.stamina -= 40;
                this.performRoar();
            }
        }

        // Detect Ground Pound (Q)
        if (Phaser.Input.Keyboard.JustDown(this.groundPoundKey) && this.poundTimer <= 0 && !this.isDead && this.actionLockTimer <= 0 && !this.isTrapped) {
            if (this.stamina >= 30) {
                this.stamina -= 30;
                this.performGroundPound();
            }
        }

        // 2. Physics & States
        // Process jump startup
        // CANNOT Jump if Trapped
        if (this.isJumpStartup && !this.isTrapped) {
            this.jumpStartupCounter++;
            this.setVelocity(0);
            if (this.jumpStartupCounter >= this.jumpStartupFrames) {
                this.zVelocity = this.jumpStrength;
                this.isJumpStartup = false;
                this.jumpStartupCounter = 0;
            }
        }

        // Process Jump Kick
        if (this.isJumpKicking) {
            this.jumpKickTimer--;
            let elapsed = this.jumpKickDashDuration - this.jumpKickTimer;
            let t = elapsed / this.jumpKickDashDuration;
            let currentPower = Phaser.Math.Linear(0, this.jumpKickDashPower, Math.min(t / this.jumpKickEaseIn, 1));

            let dashX = 0, dashY = 0;
            if (this.lastDirection.includes('left')) dashX = -1;
            if (this.lastDirection.includes('right')) dashX = 1;
            if (this.lastDirection.includes('up')) dashY = -1;
            if (this.lastDirection.includes('down')) dashY = 1;

            if (dashX !== 0 || dashY !== 0) {
                let dashVec = new Phaser.Math.Vector2(dashX, dashY).normalize().scale(currentPower);
                this.setVelocity(dashVec.x, dashVec.y);
            }

            if (this.jumpKickTimer <= 0) {
                this.isJumpKicking = false;
                this.setVelocity(0);
                this.zVelocity = this.jumpKickEndBoost;
            }
        } else if (this.isGroundDashing) {
            this.groundDashTimer--;
            let elapsed = this.groundDashDuration - this.groundDashTimer;
            let t = elapsed / this.groundDashDuration;
            let currentPower = Phaser.Math.Linear(0, this.groundDashPower, Math.min(t / this.groundDashEaseIn, 1));

            let dashX = 0, dashY = 0;
            if (this.lastDirection.includes('left')) dashX = -1;
            if (this.lastDirection.includes('right')) dashX = 1;
            if (this.lastDirection.includes('up')) dashY = -1;
            if (this.lastDirection.includes('down')) dashY = 1;

            if (dashX !== 0 || dashY !== 0) {
                let dashVec = new Phaser.Math.Vector2(dashX, dashY).normalize().scale(currentPower);
                this.setVelocity(dashVec.x, dashVec.y);
            }

            if (this.groundDashTimer <= 0) {
                this.isGroundDashing = false;
                this.setVelocity(0);
            }
        } else {
            // Normal Gravity
            if (this.altitude > 0 || this.zVelocity < 0) {
                this.zVelocity += this.gravity;
                this.altitude -= this.zVelocity;
                if (this.altitude <= 0) {
                    this.altitude = 0;
                    this.zVelocity = 0;
                    this.hasJumpKicked = false;
                    this.kickHitGroup.clear();
                }
            }
        }

        // 3. Movement Velocity
        // Player locked in direction during jump kick (and after dash until landing)
        // Also locked if Trapped
        if (this.isTrapped) {
            this.setVelocity(0); // Cannot move

            // Allow changing direction in place
            if (this.cursors.left.isDown || this.wasd.left.isDown) moveX = -1;
            else if (this.cursors.right.isDown || this.wasd.right.isDown) moveX = 1;

            if (this.cursors.up.isDown || this.wasd.up.isDown) moveY = -1;
            else if (this.cursors.down.isDown || this.wasd.down.isDown) moveY = 1;

            if (moveX !== 0 || moveY !== 0) {
                // Logic to set lastDirection (copied/simplified from below)
                let newDir = this.lastDirection;
                if (moveY === 1 && moveX === 0) newDir = 'down';
                else if (moveY === 1 && moveX === -1) newDir = 'down-left';
                else if (moveY === 0 && moveX === -1) newDir = 'left';
                else if (moveY === -1 && moveX === -1) newDir = 'up-left';
                else if (moveY === -1 && moveX === 0) newDir = 'up';
                else if (moveY === -1 && moveX === 1) newDir = 'up-right';
                else if (moveY === 0 && moveX === 1) newDir = 'right';
                else if (moveY === 1 && moveX === 1) newDir = 'down-right';
                this.lastDirection = newDir;
            }
        }
        else if (this.actionLockTimer > 0 || this.isHurt) {
            this.setVelocity(0); // Locked by action (Roar/Pound) or Hurt status
        }
        else if (!this.isJumpStartup && !this.isJumpKicking && !this.isGroundDashing && !this.hasJumpKicked) {
            this.setVelocity(0);
            if (this.cursors.left.isDown || this.wasd.left.isDown) moveX = -1;
            else if (this.cursors.right.isDown || this.wasd.right.isDown) moveX = 1;

            if (this.cursors.up.isDown || this.wasd.up.isDown) moveY = -1;
            else if (this.cursors.down.isDown || this.wasd.down.isDown) moveY = 1;

            if (this.isDefending) {
                moveX = 0; moveY = 0;
            }


            if (moveX !== 0 || moveY !== 0) {
                let vec = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(this.currentSpeed);
                this.setVelocity(vec.x, vec.y);

                let isDiagonal = (moveX !== 0 && moveY !== 0);
                let newDir = this.lastDirection;
                if (moveY === 1 && moveX === 0) newDir = 'down';
                else if (moveY === 1 && moveX === -1) newDir = 'down-left';
                else if (moveY === 0 && moveX === -1) newDir = 'left';
                else if (moveY === -1 && moveX === -1) newDir = 'up-left';
                else if (moveY === -1 && moveX === 0) newDir = 'up';
                else if (moveY === -1 && moveX === 1) newDir = 'up-right';
                else if (moveY === 0 && moveX === 1) newDir = 'right';
                else if (moveY === 1 && moveX === 1) newDir = 'down-right';

                if (isDiagonal) {
                    this.lastDiagonalTime = time;
                    this.lastDiagonalDir = newDir;
                    this.lastDirection = newDir;
                } else {
                    if (time < this.lastDiagonalTime + this.diagonalPersistenceDelay) {
                        this.lastDirection = this.lastDiagonalDir;
                    } else {
                        this.lastDirection = newDir;
                    }
                }
            }
        }

        // 4. Attack State
        if (this.isJumpKicking) {
            this.isAttacking = false;
        } else {
            const isCurrentlyPressing = this.attackKey.isDown || (pointer.isDown && isPointerOnCanvas);
            if (isCurrentlyPressing && this.altitude === 0 && this.actionLockTimer <= 0 && !this.isDefending) {
                if (!this.isAttacking) {
                    this.scene.sound.play('Punch');
                }
                this.isAttacking = true;
                this.graceCounter = this.punchGraceFrames;
            } else if (this.isAttacking) {
                if (this.graceCounter > 0) {
                    this.graceCounter -= 0.1;
                } else {
                    this.isAttacking = false;
                }
            }
        }

        // 5. Animations
        this.handleAnimations(moveX, moveY);

        // Walk Sound Logic
        const isMovingOnGround = (Math.abs(this.body.velocity.x) > 5 || Math.abs(this.body.velocity.y) > 5) &&
            this.altitude === 0 && !this.isDead && !this.isDying && !this.isTrapped;
        if (isMovingOnGround) {
            if (!this.walkSound.isPlaying) {
                this.walkSound.play();
            }
        } else {
            if (this.walkSound.isPlaying) {
                this.walkSound.stop();
            }
        }

        // 6. Visual Updates
        this.setDisplayOrigin(this.width / 2, (this.height / 2) + this.altitude);
        this.setDepth(this.y);

        if (!this.isJumpKicking && !this.isJumpStartup && Math.abs(this.zVelocity) < 0.1 && this.altitude < 1) {
            this.altitude = 0;
        }

        this.shadow.x = this.x;
        this.shadow.y = this.y + 40;
        this.shadow.setDepth(-19997);
        const shadowScale = 1 - (this.altitude / 100);
        this.shadow.setScale(Phaser.Math.Clamp(shadowScale, 0.4, 1));
        this.shadow.setAlpha(Phaser.Math.Clamp(shadowScale * 0.4, 0.1, 0.9));

        this.punchPressed = currentPointerDown;
    }

    handleAnimations(moveX, moveY) {
        if (this.isHurt) {
            const targetHurt = `hurt-${this.lastDirection}`;
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== targetHurt) {
                this.play(targetHurt, true);
            }
            return;
        }

        if (this.isRoaring) {
            const targetRoar = `roar-${this.lastDirection}`;
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== targetRoar) {
                this.play(targetRoar, true);
            }
        } else if (this.isPounding) {
            const targetPound = `pound-${this.lastDirection}`;
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== targetPound) {
                this.play(targetPound, true);
            }
        } else if (this.hasJumpKicked) {
            const targetKick = `jump-kick-${this.lastDirection}`;
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== targetKick) {
                this.play(targetKick, true);
            }
        } else if (this.isGroundDashing) {
            const targetDash = `dash-${this.lastDirection}`;
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== targetDash) {
                this.play(targetDash, true);
            }
        } else if (this.altitude > 0 || this.isJumpStartup) {
            const targetJump = `jump-${this.lastDirection}`;
            if (!this.anims.currentAnim || (!this.anims.currentAnim.key.startsWith('jump-') && !this.anims.currentAnim.key.startsWith('jump-kick-'))) {
                this.play(targetJump);
            } else if (this.anims.currentAnim.key !== targetJump && !this.anims.currentAnim.key.startsWith('jump-kick-')) {
                const currentFrame = this.anims.currentFrame.index;
                this.play(targetJump);
                if (this.anims.currentAnim.frames[currentFrame - 1]) {
                    this.anims.setCurrentFrame(this.anims.currentAnim.frames[currentFrame - 1]);
                }
            }
        } else if (this.isDefending) {
            const targetShield = `shield-${this.lastDirection}`;
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== targetShield) {
                this.play(targetShield, true);
            }
        } else if (this.isAttacking) {
            const isMoving = (moveX !== 0 || moveY !== 0);
            const animPrefix = isMoving ? 'punch' : 'punch-idle';
            const targetPunch = `${animPrefix}-${this.lastDirection}`;

            if (this.anims.currentAnim && this.anims.currentAnim.key !== targetPunch && (this.anims.currentAnim.key.startsWith('punch-') || this.anims.currentAnim.key.startsWith('punch-idle-'))) {
                const currentFrame = this.anims.currentFrame.index;
                this.play(targetPunch);
                if (this.anims.currentAnim.frames[currentFrame - 1]) {
                    this.anims.setCurrentFrame(this.anims.currentAnim.frames[currentFrame - 1]);
                }
            } else {
                this.play(targetPunch, true);
            }
        } else {
            if (moveX !== 0 || moveY !== 0) {
                this.play(`walk-${this.lastDirection}`, true);
            } else {
                this.play(`idle-${this.lastDirection}`, true);
            }
        }
    }

    takeDamage(amount, pushbackVector) {
        if (this.isDead) return false;
        if (this.hasJumpKicked) return false; // Immunity during Jump Kick until landing

        if (this.isDefending) amount = amount / 2;
        amount = Math.round(amount);

        this.hp -= amount;
        console.log("Player HP:", this.hp);

        if (this.scene.showDamagePopup) {
            this.scene.showDamagePopup(amount, this.x, this.y, '#ff0000');
        }

        if (this.hp <= 0) {
            this.die();
            return false;
        }

        this.lastDamageTime = this.scene.time.now;

        // When defending: don't move to hurt state (keeps shield anim), weaker tint, weaker shake
        if (!this.isDefending) {
            this.isHurt = true;
            this.setTint(0xff0000);
            this.scene.cameras.main.shake(100, 0.005);
        } else {
            // Defending: no isHurt flag (so no hurt animation)
            this.setTint(0xffaaaa); // Lighter red
            this.scene.cameras.main.shake(100, 0.002); // Weaker shake
        }

        this.isAttacking = false;
        this.graceCounter = 0;

        this.scene.time.delayedCall(100, () => {
            if (this.active && !this.isDead) {
                this.clearTint();
                this.isHurt = false;
            }
        });

        return true;
    }

    shake() {
        this.scene.tweens.add({
            targets: this,
            x: '+=3',
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.isAttacking = false;
        this.isJumpKicking = false;
        this.isGroundDashing = false;
        this.isRoaring = false;
        this.isPounding = false;
        this.graceCounter = 0;

        this.setVelocity(0);
        this.disableBody(false, false);
        this.scene.sound.play('Die');

        // Play death animation
        this.play(`dead-${this.lastDirection}`, true);

        // Wait for animation to finish before delay and fade
        this.once('animationcomplete', (anim) => {
            if (anim.key.startsWith('dead-')) {
                // Wait 1 second before starting fade (stays on last frame)
                this.scene.time.delayedCall(1000, () => {
                    if (!this.scene) return;

                    // Fade out player and shadow over 1 second
                    this.scene.tweens.add({
                        targets: this.shadow ? [this, this.shadow] : [this],
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            this.setActive(false);
                            this.setVisible(false);
                            if (this.shadow) this.shadow.setVisible(false);

                            this.scene.time.delayedCall(this.respawnDelay, () => {
                                this.respawn();
                            });
                        }
                    });
                });
            }
        });
    }

    respawn() {
        this.isDead = false;
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.body.checkCollision.none = false;
        this.body.moves = true;
        this.shadow.setVisible(true);

        this.hp = this.maxHp;
        this.stamina = this.maxStamina;
        this.setPosition(this.spawnPoint.x, this.spawnPoint.y); // Respawn at saved start point
        this.lastDamageTime = 0;
        this.alpha = 1; // Reset alpha after fade out

        // Reset states
        this.altitude = 0;
        this.zVelocity = 0;
        this.isJumpKicking = false;
        this.isGroundDashing = false;
        this.isAttacking = false;
        this.isTrapped = false;
        this.isHurt = false;

        // Reset Cooldowns
        this.dashCooldownTimer = 0;
        this.jumpKickCooldownTimer = 0;
        this.roarTimer = 0;
        this.poundTimer = 0;
        this.actionLockTimer = 0;

        // Trigger Spawn Effect
        this.triggerSpawnEffect();

        // Notify scene to trigger reborn effects
        this.scene.events.emit('player-respawned');
    }

    triggerSpawnEffect(duration = 1000) {
        this.spawnEffectTimer = duration;

        // Use Brightness FX for a smooth "white-to-normal" transition
        if (this.postFX) {
            const colorMatrix = this.postFX.addColorMatrix();
            colorMatrix.brightness(4); // Start intense white

            this.scene.tweens.addCounter({
                from: 4,
                to: 1,
                duration: duration,
                onUpdate: (tween) => {
                    if (this.active && colorMatrix) {
                        colorMatrix.brightness(tween.getValue());
                    }
                },
                onComplete: () => {
                    if (this.active && this.postFX) {
                        this.postFX.remove(colorMatrix);
                    }
                }
            });
        }
    }

    spawnGhost() {
        // Create a ghost sprite at current position and frame
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);

        // Match player visuals
        ghost.setDepth(this.depth - 0.1);
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlip(this.flipX, this.flipY);
        ghost.setAlpha(0.6);
        ghost.setTint(0xff8800); // Orange Tint
        ghost.setBlendMode('ADD'); // Energy glow effect

        // Match player display offset (altitude handling)
        ghost.setDisplayOrigin(this.displayOriginX, this.displayOriginY);

        // Fade out and destroy
        this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: 400,
            ease: 'Power1',
            onComplete: () => {
                ghost.destroy();
            }
        });
    }

    triggerPickupExpression() {
        if (this.pickupTimer) this.scene.time.removeEvent(this.pickupTimer);
        this.isPickingUp = true;
        this.pickupTimer = this.scene.time.delayedCall(1000, () => {
            this.isPickingUp = false;
            this.pickupTimer = null;
        });
    }

    getFacingAngle() {
        switch (this.lastDirection) {
            case 'right': return 0;
            case 'down-right': return Math.PI / 4;
            case 'down': return Math.PI / 2;
            case 'down-left': return 3 * Math.PI / 4;
            case 'left': return Math.PI;
            case 'up-left': return -3 * Math.PI / 4;
            case 'up': return -Math.PI / 2;
            case 'up-right': return -Math.PI / 4;
            default: return Math.PI / 2;
        }
    }

    // Power-up Methods
    heal(amount) {
        this.hp = Math.min(this.hp + amount, 100);
        console.log("Healed. HP:", this.hp);
    }

    addCoin(amount) {
        this.coins += amount;
        console.log("Coins:", this.coins);
    }

    applySpeedBoost(duration) {
        this.speedBoostTimer = duration;
        this.currentSpeed = this.baseSpeed * 1.5;
        this.speed = this.currentSpeed;
        this.anims.globalTimeScale = 1.5; // Speed up animations
    }

    applyStrengthBoost(duration) {
        this.strengthBoostTimer = duration;
        this.damageMultiplier = 2; // Double damage?
    }

    getDamage(baseDamage) {
        return baseDamage * this.damageMultiplier;
    }

    addKey(keyId) {
        if (!this.keys.includes(keyId)) {
            this.keys.push(keyId);
        }
    }

    hasKey(keyId) {
        return this.keys.includes(keyId);
    }

    useKey(keyId) {
        const index = this.keys.indexOf(keyId);
        if (index > -1) {
            this.keys.splice(index, 1);
            return true;
        }
        return false;
    }

    useItem(type) {
        console.log("Using Item:", type);
        this.scene.sound.play('Item');
        switch (type) {
            case 'health':
                if (this.hp < this.maxHp) {
                    this.heal(30);
                    if (this.hp > this.maxHp) this.hp = this.maxHp;
                    return true;
                }
                return false;
            case 'stamina':
                if (this.stamina < this.maxStamina) {
                    this.stamina = this.maxStamina;
                    console.log("Stamina Restored");
                    return true;
                }
                return false;
            case 'speed':
                this.applySpeedBoost(5000);
                return true;
            case 'strength':
                this.applyStrengthBoost(5000);
                return true;
            default:
                return false;
        }
    }


    updateShieldFx() {
        if (this.isDefending && !this.shieldFxActive) {
            this.shieldFxActive = true;

            // Create shield if it doesn't exist
            if (!this.shieldFx) {
                this.shieldFx = this.scene.add.sprite(this.x, this.y, 'warrior_shield_fx');
                this.shieldFx.setBlendMode('ADD');
                this.shieldFx.setDepth(this.depth + 1);
                this.shieldFx.play('shield-fx-anim');
            }

            // Cancel any current fade-out tween
            if (this.shieldFadeTween) this.shieldFadeTween.stop();

            // Fade In
            this.shieldFadeTween = this.scene.tweens.add({
                targets: this.shieldFx,
                alpha: { from: this.shieldFx.alpha, to: 1 },
                duration: 100,
                onStart: () => {
                    this.shieldFx.setVisible(true);
                }
            });
        }
        else if (!this.isDefending && this.shieldFxActive) {
            this.shieldFxActive = false;

            if (this.shieldFx) {
                // Cancel any current fade-in tween
                if (this.shieldFadeTween) this.shieldFadeTween.stop();

                // Fade Out
                this.shieldFadeTween = this.scene.tweens.add({
                    targets: this.shieldFx,
                    alpha: 0,
                    duration: 50,
                    onComplete: () => {
                        if (this.shieldFx) {
                            this.shieldFx.setVisible(false);
                        }
                    }
                });
            }
        }

        // Keep following player while visible
        if (this.shieldFx && this.shieldFx.visible) {
            this.shieldFx.setPosition(this.x, this.y + 5); // Slightly up to center on torso
            this.shieldFx.setDepth(this.depth + 1);
        }
    }

    performRoar() {
        if (this.isRoaring) return;
        this.isRoaring = true;
        this.roarDamageDealt = false;
        this.roarTimer = this.roarCooldown;
        this.actionLockTimer = 800; // Lock for ~0.8s during animation
        this.scene.sound.play('Roar');
        console.log("ROAR START!");
    }

    applyRoarDamage() {
        console.log("ROAR ACTIVATED!");

        // Visual Effect
        const circle = this.scene.add.circle(this.x, this.y, 10, 0xffffff, 0.5);
        this.scene.tweens.add({
            targets: circle,
            scale: { from: 1, to: this.roarRadius / 10 }, // Scale to radius
            alpha: { from: 0.5, to: 0 },
            duration: 500,
            onComplete: () => circle.destroy()
        });

        // Apply Effect
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemy => {
                if (!enemy.active || enemy.isDead) return;

                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.roarRadius) {
                    enemy.paralyze(5000);
                }
            });
        }

        // Camera Shake
        this.scene.cameras.main.shake(200, 0.01);
    }

    performGroundPound() {
        if (this.isPounding) return;
        this.isPounding = true;
        this.poundDamageDealt = false;
        this.poundTimer = this.poundCooldown;
        this.actionLockTimer = 1000; // Lock for ~1s during animation
        this.scene.sound.play('Pound');
        console.log("GROUND POUND START!");
    }

    applyPoundDamage() {
        console.log("GROUND POUND ACTIVATED!");

        const angle = this.getFacingAngle();
        // Adjust start position slightly lower to match feet
        const startX = this.x;
        const startY = this.y + 10;

        const poundDir = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));

        // Camera Shake once at start
        this.scene.cameras.main.shake(150, 0.02);

        // Create 3-step cascade
        for (let i = 0; i < 5; i++) {
            // 2 frames ~ 33ms delay per step
            this.scene.time.delayedCall(i * 40, () => {
                const stepDist = (i + 1) * (this.poundLength / 3.5); // Spread over length
                const px = startX + poundDir.x * stepDist;
                const py = startY + poundDir.y * stepDist;

                // Visual FX
                const fx = this.scene.add.sprite(px, py, 'warrior_pound_fx');
                fx.setDepth(py); // Depth sort
                fx.setRotation(0); // Keeping angle zero as requested
                fx.play('pound-fx-anim');
                fx.once('animationcomplete', () => fx.destroy());

                // Damage Logic (Local area check)
                if (this.scene.enemies) {
                    const hitRadius = this.poundWidth; // Use pound width as radius for each blast
                    this.scene.enemies.getChildren().forEach(enemy => {
                        if (!enemy.active || enemy.isDead) return;

                        // Avoid hitting same enemy multiple times? 
                        // The original logic hit once. The visual is a wave. 
                        // If an enemy is large, it might get hit by multiple waves. 
                        // Let's add a temporary immunity or just allow multi-hit for flair (or limit it).
                        // For now, simple distance check.
                        const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);

                        // We use a property to track if this specific pound action already hit the enemy?
                        // Or just let the wave hit them.
                        // Given it's a "cascade", the wave travels.
                        if (dist < hitRadius) {
                            // Calculate knockback
                            const knockDir = poundDir.clone().scale(100);
                            enemy.takeDamage(5, knockDir);
                        }
                    });
                }
            });
        }
    }
}
