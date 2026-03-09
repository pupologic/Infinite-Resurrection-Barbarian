class RangedEnemy extends Enemy {
    static createAnimations(scene) {
        const walkTexture = scene.textures.get('demonImp_Walk_full');
        const attackTexture = scene.textures.get('demonImp_Attack_full');
        const deadTexture = scene.textures.get('demonImp_Dead_full');

        // All sheets are 8x8 (8 directions, 8 frames each)
        // Assuming same layout as DemonBull
        const walkFW = walkTexture.source[0].width / 8;
        const walkFH = walkTexture.source[0].height / 8;
        const attackFW = attackTexture.source[0].width / 8;
        const attackFH = attackTexture.source[0].height / 8;
        const deadFW = deadTexture.source[0].width / 8;
        const deadFH = deadTexture.source[0].height / 8;

        scene.textures.addSpriteSheet('demonImp_walk', walkTexture.source[0].image, { frameWidth: walkFW, frameHeight: walkFH });
        scene.textures.addSpriteSheet('demonImp_attack', attackTexture.source[0].image, { frameWidth: attackFW, frameHeight: attackFH });
        scene.textures.addSpriteSheet('demonImp_dead', deadTexture.source[0].image, { frameWidth: deadFW, frameHeight: deadFH });

        const idleTexture = scene.textures.get('demonImp_Idle_full');
        // Assuming idle uses same dimensions if it's 8x8 squares, but let's check or assume standard
        // If it's the same layout as others:
        const idleFW = idleTexture.source[0].width / 8;
        const idleFH = idleTexture.source[0].height / 8;
        scene.textures.addSpriteSheet('demonImp_idle', idleTexture.source[0].image, { frameWidth: idleFW, frameHeight: idleFH });

        // Fireball Animation (3x3 tilesheet)
        if (!scene.textures.exists('fireball_sheet')) {
            const fireballImg = scene.textures.get('fireball_sheet_img');
            const fbFW = fireballImg.source[0].width / 3;
            const fbFH = fireballImg.source[0].height / 3;
            scene.textures.addSpriteSheet('fireball_sheet', fireballImg.source[0].image, { frameWidth: fbFW, frameHeight: fbFH });

            scene.anims.create({
                key: 'fireball-burn',
                frames: scene.anims.generateFrameNumbers('fireball_sheet', { start: 0, end: 8 }),
                frameRate: 15,
                repeat: -1
            });
        }

        const directions = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
        directions.forEach((dir, rowIndex) => {
            scene.anims.create({
                key: `demonImp-walk-${dir}`,
                frames: scene.anims.generateFrameNumbers('demonImp_walk', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: -1
            });
            scene.anims.create({
                key: `demonImp-attack-${dir}`,
                frames: scene.anims.generateFrameNumbers('demonImp_attack', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 15, repeat: 0
            });
            scene.anims.create({
                key: `demonImp-dead-${dir}`,
                frames: scene.anims.generateFrameNumbers('demonImp_dead', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: 0
            });
            scene.anims.create({
                key: `demonImp-idle-${dir}`,
                frames: scene.anims.generateFrameNumbers('demonImp_idle', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 6, repeat: -1
            });
        });
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'demonImp_walk', 40, 25); // Smaller shadow for Imp

        this.animPrefix = 'demonImp';
        this.damageColor = '#ffa500';

        this.hp = 15;
        this.maxHp = 15;
        this.speed = 40;
        this.visionRange = 450;
        this.keepDistance = 250;

        this.attackRate = 15000;
        this.nextAttackTime = 0;

        // Attack state handled by base class flags mostly, but we add custom cooldown
        this.projectileGroup = scene.projectiles;

        // Ajuste de corpo para o Imp (menor que o Bull)
        this.body.setCircle(15, 33, 33);
    }

    update(time, delta, player, obstacles) {
        if (this.isDead) {
            if (this.shadow) this.shadow.setVisible(false);
            return;
        }

        // Update shadow
        if (this.shadow) {
            this.shadow.setVisible(true);
            this.shadow.setPosition(this.x, this.y + (this.body.height / 2) - 5);
            this.shadow.setDepth(-19997); // Above reborn place
        }

        if (this.isDying) return;

        // Pushback / Hurt State from base class
        if (this.pushbackVelocity.length() > 5) {
            this.pushbackVelocity.scale(0.92);
            this.setVelocity(this.pushbackVelocity.x, this.pushbackVelocity.y);
            if (this.pushbackVelocity.length() < 20) {
                this.isHurt = false;
            } else {
                this.isHurt = true;
            }
            this.handleAnimations();
            return;
        } else {
            this.isHurt = false;
        }

        if (this.isParalyzed) {
            this.paralyzeTimer -= delta;
            this.setVelocity(0);
            if (this.paralyzeTimer <= 0) {
                this.isParalyzed = false;
                this.clearTint();
            }
            this.handleAnimations();
            return;
        }

        // Attacking State
        if (this.isAttacking) {
            this.setVelocity(0);

            // Fire projectile on specific frame (e.g., frame 4 or 5)
            // Use a flag to ensure single shot per attack
            if (this.anims.currentFrame && this.anims.currentFrame.index === 6 && !this.damageDealt) {
                this.shootFireball(player);
                this.damageDealt = true;
            }

            if (!this.anims.isPlaying || !this.anims.currentAnim.key.startsWith(`${this.animPrefix}-attack`)) {
                this.isAttacking = false;
            } else {
                return; // Wait for animation
            }
        }

        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const hasLineOfSight = !player.isDead && (distToPlayer < this.visionRange); // Simplified LOS check (distance only)

        if (hasLineOfSight) {
            // Face player
            // But moveTowards handles facing usually. 
            // If we are stationary (ready to attack), we should face player.

            // Attack Logic
            if (time > this.nextAttackTime) {
                // Determine direction to face before attacking
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.setDirectionFromAngle(Phaser.Math.RadToDeg(angle));

                this.performAttack(time);
                this.nextAttackTime = time + this.attackRate;
                return;
            }

            // Kiting Logic
            if (distToPlayer < this.keepDistance - 20) {
                // Too close, move away
                const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y); // Angle AWAY from player
                // Calculate discrete target to use moveTowards for smoothing
                const targetX = this.x + Math.cos(angle) * 100;
                const targetY = this.y + Math.sin(angle) * 100;
                this.moveTowards(targetX, targetY, this.speed, obstacles);
            } else if (distToPlayer > this.keepDistance + 20) {
                // Too far, move closer
                this.moveTowards(player.x, player.y, this.speed, obstacles);
            } else {
                // Good distance, maintain
                this.setVelocity(0);
                // Face player while idle
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.setDirectionFromAngle(Phaser.Math.RadToDeg(angle));
            }
        } else {
            // Idle / Patrol (Base behavior simplified)
            this.idleMoveTimer -= delta;
            if (this.idleMoveTimer <= 0) {
                const wanderRadius = 150;
                const targetX = this.startX + Phaser.Math.Between(-wanderRadius, wanderRadius);
                const targetY = this.startY + Phaser.Math.Between(-wanderRadius, wanderRadius);
                this.moveTowards(targetX, targetY, 40, obstacles); // Increased wander speed
                this.idleMoveDuration = Phaser.Math.Between(1000, 3000);
                this.idleMoveTimer = this.idleMoveDuration + Phaser.Math.Between(1000, 2000);
            } else if (this.idleMoveTimer < 1000) {
                this.setVelocity(0);
            }
        }

        this.handleAnimations();
        this.setDepth(this.y);
    }

    shootFireball(player) {
        if (!this.scene.projectiles) return;

        this.scene.sound.play('Bomb');

        const fireball = this.scene.physics.add.sprite(this.x, this.y, 'fireball_sheet');
        this.scene.projectiles.add(fireball);
        fireball.play('fireball-burn');
        fireball.setScale(0);

        // Quick scale up effect
        this.scene.tweens.add({
            targets: fireball,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Back.easeOut'
        });

        // Calculate accurate angle to player at moment of shot
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const speed = 250;
        fireball.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        fireball.setRotation(angle); // Rotate towards direction

        // Override destroy to spawn fire hazards
        fireball.spawnHazards = true;
        const originalDestroy = fireball.destroy;
        fireball.destroy = (...args) => {
            if (this.scene && this.scene.hazards && fireball.scene && fireball.spawnHazards) { // ensure scene is still valid
                const offsets = [
                    { dx: 0, dy: 0 },
                    { dx: 64, dy: 0 },
                    { dx: -64, dy: 0 },
                    { dx: 0, dy: 64 },
                    { dx: 0, dy: -64 }
                ];
                offsets.forEach(offset => {
                    const hazard = new HazardObject(this.scene, fireball.x + offset.dx, fireball.y + offset.dy, 'fire');
                    this.scene.hazards.add(hazard);
                });
            }
            originalDestroy.apply(fireball, args);
        };

        this.scene.time.delayedCall(2000, () => {
            if (fireball.active) fireball.destroy();
        });
    }

    takeDamage(amount, pushbackVector) {
        super.takeDamage(amount, pushbackVector);
        // Only slightly delay the next attack (preserve the schedule + tiny hiccup)
        this.nextAttackTime += 33;
    }
}
