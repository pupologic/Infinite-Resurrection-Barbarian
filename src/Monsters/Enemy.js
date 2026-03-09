class Enemy extends Phaser.Physics.Arcade.Sprite {
    static createAnimations(scene) {
        const walkTexture = scene.textures.get('demonBull_Walk_full');
        const attackTexture = scene.textures.get('demonBull_Attack_full');
        const deadTexture = scene.textures.get('demonBull_Dead_full');
        const idleTexture = scene.textures.get('demonBull_Idle_full');

        // All sheets are 8x8 (8 directions, 8 frames each)
        const walkFW = walkTexture.source[0].width / 8;
        const walkFH = walkTexture.source[0].height / 8;
        const attackFW = attackTexture.source[0].width / 8;
        const attackFH = attackTexture.source[0].height / 8;
        const deadFW = deadTexture.source[0].width / 8;
        const deadFH = deadTexture.source[0].height / 8;
        const idleFW = idleTexture.source[0].width / 8;
        const idleFH = idleTexture.source[0].height / 8;

        scene.textures.addSpriteSheet('demon_walk', walkTexture.source[0].image, { frameWidth: walkFW, frameHeight: walkFH });
        scene.textures.addSpriteSheet('demon_attack', attackTexture.source[0].image, { frameWidth: attackFW, frameHeight: attackFH });
        scene.textures.addSpriteSheet('demon_dead', deadTexture.source[0].image, { frameWidth: deadFW, frameHeight: deadFH });
        scene.textures.addSpriteSheet('demon_idle', idleTexture.source[0].image, { frameWidth: idleFW, frameHeight: idleFH });

        const hurtTexture = scene.textures.get('demonBull_Hurt_full');
        const hurtFW = hurtTexture.source[0].width / 3;
        const hurtFH = hurtTexture.source[0].height / 3;
        scene.textures.addSpriteSheet('demon_hurt', hurtTexture.source[0].image, { frameWidth: hurtFW, frameHeight: hurtFH });

        const directions = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
        directions.forEach((dir, rowIndex) => {
            scene.anims.create({
                key: `demon-walk-${dir}`,
                frames: scene.anims.generateFrameNumbers('demon_walk', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: -1
            });
            scene.anims.create({
                key: `demon-attack-${dir}`,
                frames: scene.anims.generateFrameNumbers('demon_attack', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 10, repeat: 0
            });
            scene.anims.create({
                key: `demon-dead-${dir}`,
                frames: scene.anims.generateFrameNumbers('demon_dead', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: 0
            });
            scene.anims.create({
                key: `demon-idle-${dir}`,
                frames: scene.anims.generateFrameNumbers('demon_idle', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 6, repeat: -1
            });
            scene.anims.create({
                key: `demon-hurt-${dir}`,
                frames: scene.anims.generateFrameNumbers('demon_hurt', { start: rowIndex, end: rowIndex }),
                frameRate: 1, repeat: 0
            });
        });
    }

    constructor(scene, x, y, textureKey = 'demon_walk', shadowWidth = 50, shadowHeight = 25, shadowYOffset = 15) {
        super(scene, x, y, textureKey);

        this.animPrefix = 'demon';

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setPushable(false);
        // Use circular collision for enemies
        const radius = 20;
        this.body.setCircle(radius, 32, 32); // Adjust offset based on sprite center

        this.startX = x;
        this.startY = y;
        this.hp = 30; // Increased to whole number (compatible with 2 damage per hit)
        this.maxHp = 30;
        this.speed = 80; // Increased chase speed
        this.baseVisionRange = 300;
        this.visionRange = this.baseVisionRange;
        this.canChase = true;
        this.state = 'IDLE';
        this.searchTimer = 0;
        this.searchPos = new Phaser.Math.Vector2();

        this.idleMoveTimer = 0;
        this.idleMoveDuration = 0;

        this.lastDamageTime = 0;
        this.pushbackVelocity = new Phaser.Math.Vector2();

        this.damageRadius = 40;
        this.minDistance = 60; // Increased for attack range

        this.respawnDelay = 3000;
        this.isDead = false;
        this.isDying = false;

        this.isParalyzed = false;
        this.paralyzeTimer = 0;

        this.lastDirection = 'down';

        // Attack
        this.isAttacking = false;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.damage = 5;

        // Hurt State
        this.isHurt = false;

        // Shadow
        this.shadowYOffset = shadowYOffset;
        this.shadow = scene.add.ellipse(0, 0, shadowWidth, shadowHeight, 0x000000, 0.8);
        this.shadow.setDepth(-19997); // Above reborn place (-19998)
        this.shadow.resetPipeline(); // Shadows should not use Light2D pipeline
        this.forcedLoot = null;

        // Default Damage Popup Color (DemonBull: Red)
        this.damageColor = '#ff0000';
    }

    checkLineOfSight(player, obstacles) {
        if (!player || !player.active || !obstacles) return false;

        const ray = new Phaser.Geom.Line(this.x, this.y, player.x, player.y);
        let blocked = false;

        const checkBody = (go) => {
            if (!go.active) return;

            // Handle Zone Collision Objects (Walls/Doors)
            const body = go.collisionZone ? go.collisionZone.body : go.body;
            if (!body) return;

            // Simple Rectangle Check
            // We expand the rect slightly to ensure tight corners don't leak
            const rect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
            if (Phaser.Geom.Intersects.LineToRectangle(ray, rect)) {
                blocked = true;
            }
        };

        // Handle array of groups or single group
        if (Array.isArray(obstacles)) {
            obstacles.forEach(group => {
                if (group) group.children.iterate(checkBody);
            });
        } else if (obstacles) {
            obstacles.children.iterate(checkBody);
        }

        return !blocked;
    }

    update(time, delta, player, obstacles) {
        if (this.isDead) {
            if (this.shadow) this.shadow.setVisible(false);
            return;
        }

        // Update shadow position and depth
        this.setDepth(this.y); // Ensure enemy depth is set
        if (this.shadow) {
            this.shadow.setVisible(true);
            this.shadow.setPosition(this.x, this.y + (this.body.height / 2) + this.shadowYOffset);
            this.shadow.setDepth(-19997); // Above reborn place
        }

        if (this.isDying) return;


        // Hurt/Pushback Physics
        if (this.pushbackVelocity.length() > 5) {
            this.pushbackVelocity.scale(0.92); // Reduced friction for more slide
            this.setVelocity(this.pushbackVelocity.x, this.pushbackVelocity.y);

            // End hurt state when slow enough
            if (this.pushbackVelocity.length() < 20) {
                this.isHurt = false;
                this.pushbackVelocity.set(0, 0);
            } else {
                this.isHurt = true;
            }
            this.handleAnimations();
            this.setDepth(this.y); // Sync depth during knockback
            return;
        }

        if (this.isParalyzed) {
            this.paralyzeTimer -= delta;
            this.setVelocity(0);
            if (this.paralyzeTimer <= 0) {
                this.isParalyzed = false;
                this.restoreTint();
            }
            this.handleAnimations();
            return;
        }

        this.attackAngle = 120; // Cone angle in degrees

        // If currently playing attack animation
        if (this.isAttacking) {
            this.setVelocity(0);

            // 1. Continuously Face Player during attack
            if (!this.isDead && !player.isDead) { // Stop tracking if dead
                const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                const oldDir = this.lastDirection;
                this.setDirectionFromAngle(Phaser.Math.RadToDeg(angleToPlayer));

                // If direction changed, update animation smoothly
                if (this.lastDirection !== oldDir) {
                    const currentKey = this.anims.currentAnim ? this.anims.currentAnim.key : '';
                    const newKey = `${this.animPrefix}-attack-${this.lastDirection}`;

                    if (currentKey !== newKey) {
                        const progress = this.anims.getProgress();
                        this.play(newKey);
                        this.anims.setProgress(progress);
                    }
                }
            }

            // Damage frame logic (Frame 5 = index 4)
            if (this.anims.currentFrame && this.anims.currentFrame.index === 5 && !this.damageDealt) {
                const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

                // Attack Cone Logic
                const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                const facingAngle = this.getFacingAngle();
                const angleDiff = Phaser.Math.Angle.Wrap(angleToPlayer - facingAngle);
                const inCone = Math.abs(angleDiff) <= Phaser.Math.DegToRad(this.attackAngle / 2);

                if (distToPlayer <= this.minDistance + 20 && inCone && !player.isDead) {
                    // Calculate knockback away from enemy center
                    player.takeDamage(this.damage);
                    this.damageDealt = true;
                }
            }

            if (!this.anims.isPlaying || !this.anims.currentAnim.key.startsWith(`${this.animPrefix}-attack`)) {
                this.isAttacking = false;
            } else {
                return; // Wait for animation
            }
        }

        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const distToStart = Phaser.Math.Distance.Between(this.x, this.y, this.startX, this.startY);

        // Visibility Check
        let hasLineOfSight = false;
        if (!player.isDead && distToPlayer < this.visionRange) {
            hasLineOfSight = this.checkLineOfSight(player, obstacles);
        }

        // Force stop chase if player is dead
        if (player.isDead && (this.state === 'CHASE' || this.state === 'SEARCHING')) {
            this.state = 'RETURN';
        }

        // State Machine
        switch (this.state) {
            case 'IDLE':
                if (hasLineOfSight) {
                    this.state = 'CHASE';
                    this.visionRange = this.baseVisionRange * 1.5; // Expanded vision on alert
                    this.lastKnownPos = { x: player.x, y: player.y };
                    this.setVelocity(0);
                } else {
                    this.idleMoveTimer -= delta;
                    if (this.idleMoveTimer <= 0) {
                        const wanderRadius = 150;
                        const targetX = this.startX + Phaser.Math.Between(-wanderRadius, wanderRadius);
                        const targetY = this.startY + Phaser.Math.Between(-wanderRadius, wanderRadius);
                        this.moveTowards(targetX, targetY, 40);
                        this.idleMoveDuration = Phaser.Math.Between(1000, 3000);
                        this.idleMoveTimer = this.idleMoveDuration + Phaser.Math.Between(1000, 2000);
                    } else if (this.idleMoveTimer < 1000) {
                        this.setVelocity(0);
                    }
                }
                break;

            case 'CHASE':
                if (hasLineOfSight) {
                    // Chasing Logic
                    this.lastKnownPos = { x: player.x, y: player.y };

                    if (distToPlayer <= this.minDistance + 10) {
                        this.performAttack(time);
                    } else {
                        this.moveTowards(player.x, player.y, this.speed, obstacles);
                    }
                } else {
                    // Lost Sight -> Move to Last Known Position
                    if (this.lastKnownPos) {
                        const distToLast = Phaser.Math.Distance.Between(this.x, this.y, this.lastKnownPos.x, this.lastKnownPos.y);
                        if (distToLast > 20) {
                            this.moveTowards(this.lastKnownPos.x, this.lastKnownPos.y, this.speed, obstacles);
                        } else {
                            // Reached last known -> Search
                            this.state = 'SEARCHING';
                            this.searchTimer = Phaser.Math.Between(2000, 5000); // Wait 2-5s
                            this.visionRange = this.baseVisionRange; // Reset vision
                            this.setVelocity(0);
                        }
                    } else {
                        // Immediate search if no last pos
                        this.state = 'SEARCHING';
                        this.searchTimer = Phaser.Math.Between(2000, 5000); // Wait 2-5s
                        this.visionRange = this.baseVisionRange; // Reset vision
                        this.setVelocity(0);
                    }
                }
                break;

            case 'SEARCHING':
                // Wait at last known position
                this.searchTimer -= delta;
                if (hasLineOfSight) {
                    this.state = 'CHASE';
                    this.visionRange = this.baseVisionRange * 1.5;
                } else if (this.searchTimer <= 0) {
                    this.state = 'RETURN';
                }
                break;

            case 'RETURN':
                if (hasLineOfSight) {
                    this.state = 'CHASE';
                    this.visionRange = this.baseVisionRange * 1.5;
                } else {
                    this.moveTowards(this.startX, this.startY, this.speed * 0.6, obstacles); // Return slower
                    if (distToStart < 10) {
                        this.setVelocity(0);
                        this.state = 'IDLE';
                    }
                }
                break;
        }

        this.handleAnimations();
        this.setDepth(this.y);
    }

    fleeFrom(x, y) {
        if (this.isDead || this.isDying) return;

        // Vector away from danger
        const fleeVec = new Phaser.Math.Vector2(this.x - x, this.y - y).normalize().scale(150); // Fast flee speed

        this.setVelocity(fleeVec.x, fleeVec.y);

        // Temporarily override state to prevent logic from overwriting velocity immediately
        const oldState = this.state;
        this.state = 'FLEE';
        this.isHurt = true; // Use hurt flag to play hit animation/color
        this.setTintFill(0xff0000); // Red flash

        this.scene.time.delayedCall(500, () => {
            if (this.active && !this.isDead) {
                this.isHurt = false;
                this.restoreTint();
                this.setVelocity(0);
                this.state = 'IDLE'; // Re-evaluate situation
            }
        });
    }

    moveTowards(targetX, targetY, speed, obstacles) {
        // Init persistence vars if not exists
        if (this.currentSnapAngle === undefined) {
            this.currentSnapAngle = 0;
            this.lastDirSwitchTime = 0;
        }

        const rawAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);

        // Whisker Check for Obstacle Avoidance
        let bestAngle = rawAngle;
        const feelerDist = 40; // Look ahead distance

        // Helper to check if a direction is blocked
        const isDirectionBlocked = (angle) => {
            const rayStart = new Phaser.Math.Vector2(this.x, this.y);
            const feelerDist = 55; // Slightly increased for better anticipation
            const rayEnd = rayStart.clone().add(
                new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(feelerDist)
            );

            const ray = new Phaser.Geom.Line(rayStart.x, rayStart.y, rayEnd.x, rayEnd.y);
            let blocked = false;

            // 1. Check against Tilemaps
            if (this.scene.tileCollisionLayers) {
                for (let layer of this.scene.tileCollisionLayers) {
                    if (layer.getTileAtWorldXY(rayEnd.x, rayEnd.y, true)?.collides) {
                        blocked = true;
                        break;
                    }
                }
            }
            if (blocked) return true;

            // 2. Check against Sprite-based obstacles (Walls/Rocks)
            const checkBody = (go) => {
                if (blocked || !go.active) return;
                const body = go.collisionZone ? go.collisionZone.body : go.body;
                if (!body) return;

                const rect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
                if (Phaser.Geom.Intersects.LineToRectangle(ray, rect)) {
                    blocked = true;
                }
            };

            if (obstacles && Array.isArray(obstacles)) {
                obstacles.forEach(group => {
                    if (group && group.children) group.children.iterate(checkBody);
                });
            } else if (obstacles && obstacles.children) {
                obstacles.children.iterate(checkBody);
            }
            return blocked;
        };

        // 1. Check direct path
        if (isDirectionBlocked(rawAngle)) {
            // 2. Direct path blocked, try angles
            const leftAngle = rawAngle - Math.PI / 4;
            const rightAngle = rawAngle + Math.PI / 4;
            const leftBlocked = isDirectionBlocked(leftAngle);
            const rightBlocked = isDirectionBlocked(rightAngle);

            if (!leftBlocked && !rightBlocked) {
                // Both clear, pick one closer to current movement or random
                bestAngle = Math.random() < 0.5 ? leftAngle : rightAngle;
            } else if (!leftBlocked) {
                bestAngle = leftAngle;
            } else if (!rightBlocked) {
                bestAngle = rightAngle;
            } else {
                // Both diagonals blocked, try 90 degrees?
                const left90 = rawAngle - Math.PI / 2;
                const right90 = rawAngle + Math.PI / 2;
                if (!isDirectionBlocked(left90)) bestAngle = left90;
                else if (!isDirectionBlocked(right90)) bestAngle = right90;
                // Else stick to rawAngle (give up/push)
            }
        }

        let desiredSnapAngle = Math.round(bestAngle / (Math.PI / 4)) * (Math.PI / 4);

        // Normalize -PI to PI to ensure consistent comparison since they are the same visual direction
        if (Math.abs(desiredSnapAngle - -Math.PI) < 0.001) desiredSnapAngle = Math.PI;

        // Check if we want to change direction
        if (Math.abs(desiredSnapAngle - this.currentSnapAngle) > 0.001) {
            const now = this.scene.time.now;
            // Lock direction for 250ms to prevent jitter (diagonal flickering)
            if (now - this.lastDirSwitchTime > 250) {
                this.currentSnapAngle = desiredSnapAngle;
                this.lastDirSwitchTime = now;
            }
        }

        const velocity = this.scene.physics.velocityFromRotation(this.currentSnapAngle, speed);
        this.setVelocity(velocity.x, velocity.y);
    }

    performAttack(time) {
        this.isAttacking = true;
        this.lastAttackTime = time;
        this.damageDealt = false;
        this.setVelocity(0);
        this.play(`${this.animPrefix}-attack-${this.lastDirection}`, true);

        // Attack Sounds
        if (this.animPrefix === 'demon') {
            this.scene.sound.play('BullPunch');
        } else if (this.animPrefix === 'skeleton') {
            this.scene.sound.play('SwordAttack');
        } else if (this.animPrefix === 'skullbug') {
            this.scene.sound.play('BugAttack');
        }
    }

    handleAnimations() {
        if (this.isDead || this.isDying) return;
        if (this.isAttacking) return; // Don't interrupt attack

        if (this.isHurt || this.isParalyzed) {
            const hurtKey = `${this.animPrefix}-hurt-${this.lastDirection}`;
            if (this.scene.anims.exists(hurtKey)) {
                this.play(hurtKey, true);
            } else {
                // Fallback a walk se a animação de dano faltar para persistência visual
                const fallbackKey = `${this.animPrefix}-walk-${this.lastDirection}`;
                if (this.scene.anims.exists(fallbackKey)) {
                    this.play(fallbackKey, true);
                }
                this.setTint(0xff0000);
            }
            return;
        }

        const v = this.body.velocity;
        if (v.length() > 10) {
            const angle = Phaser.Math.RadToDeg(Math.atan2(v.y, v.x));
            this.setDirectionFromAngle(angle);
            this.play(`${this.animPrefix}-walk-${this.lastDirection}`, true);
        } else {
            // PLAY IDLE
            const idleKey = `${this.animPrefix}-idle-${this.lastDirection}`;
            if (this.scene.anims.exists(idleKey)) {
                this.play(idleKey, true);
            } else {
                // Fallback to stopping walk frame if no idle anim exists (for safety)
                this.play(`${this.animPrefix}-walk-${this.lastDirection}`, true);
                this.anims.stop();
            }
        }
    }

    setDirectionFromAngle(angle) {
        if (angle > -22.5 && angle <= 22.5) this.lastDirection = 'right';
        else if (angle > 22.5 && angle <= 67.5) this.lastDirection = 'down-right';
        else if (angle > 67.5 && angle <= 112.5) this.lastDirection = 'down';
        else if (angle > 112.5 && angle <= 157.5) this.lastDirection = 'down-left';
        else if ((angle > 157.5 && angle <= 180) || (angle >= -180 && angle <= -157.5)) this.lastDirection = 'left';
        else if (angle > -157.5 && angle <= -112.5) this.lastDirection = 'up-left';
        else if (angle > -112.5 && angle <= -67.5) this.lastDirection = 'up';
        else if (angle > -67.5 && angle <= -22.5) this.lastDirection = 'up-right';
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
            default: return 0;
        }
    }

    takeDamage(amount, pushbackVector) {
        if (this.isDead || this.isDying) return;

        this.hp -= amount;

        if (this.scene.showDamagePopup) {
            this.scene.showDamagePopup(amount, this.x, this.y, this.damageColor || '#ffffff');
        }

        if (this.hp <= 0) {
            this.die();
            return;
        }

        this.isHurt = true;
        this.isAttacking = false;
        this.damageDealt = false;
        this.anims.stop();

        // Add a tiny delay (approx 2 frames at 60fps) to keep momentum but add visual hiccup
        this.lastAttackTime += 33;

        if (pushbackVector) {
            // Increase knockback force (3x)
            this.pushbackVelocity = pushbackVector.clone().scale(3.0);

            // Face the damage source
            const sourceDir = new Phaser.Math.Vector2(-pushbackVector.x, -pushbackVector.y);
            this.setDirectionFromAngle(Phaser.Math.RadToDeg(sourceDir.angle()));
        }

        this.setTint(0xff0000);
        this.scene.time.delayedCall(150, () => {
            if (this.active && !this.isDead && !this.isDying) {
                this.restoreTint();
                if (this.pushbackVelocity.length() < 20) {
                    this.isHurt = false;
                }
            }
        });
    }

    die() {
        if (this.isDead || this.isDying) return;
        this.isDying = true;

        this.setVelocity(0);
        this.disableBody(false, false);
        this.clearTint();
        // Don't hide shadow immediately - it will fade out

        this.play(`${this.animPrefix}-dead-${this.lastDirection}`);

        // Die Sounds
        if (this.animPrefix === 'demon') {
            this.scene.sound.play('BigMonsterDie');
        } else if (this.animPrefix === 'skeleton') {
            this.scene.sound.play('SkeletonDie');
        } else {
            this.scene.sound.play('MonsterDie');
        }

        this.once('animationcomplete', () => {
            // Wait 1 second before fade
            if (!this.scene) return;
            this.scene.time.delayedCall(1000, () => {
                if (!this.active || !this.scene) return;
                this.scene.tweens.add({
                    targets: this.shadow ? [this, this.shadow] : [this],
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => {
                        if (!this.active || !this.scene) return;
                        this.isDead = true;
                        this.isDying = false;
                        this.setVisible(false);
                        this.setActive(false);

                        this.dropLoot();

                        this.scene.time.delayedCall(this.respawnDelay, () => {
                            if (this.active && this.scene) {
                                this.respawn();
                            }
                        });
                    }
                });
            });
        });
    }

    dropLoot() {
        if (this.forcedLoot) {
            if (!this.scene.items) {
                this.scene.items = this.scene.physics.add.group();
            }
            let item = new Item(this.scene, this.x, this.y, this.forcedLoot.type, this.forcedLoot.extra || {});
            this.scene.items.add(item);
            return;
        }

        const roll = Phaser.Math.Between(0, 100);
        let itemType = null;
        if (roll < 12) itemType = 'HEALTH';
        else if (roll < 18) itemType = 'SPEED';
        else if (roll < 35) itemType = 'COIN';
        else if (roll < 38) itemType = 'STRENGTH';
        else if (roll < 45) itemType = 'MEAT'; // Novo drop: Meat (7% chance)
        else if (roll < 48) itemType = 'HAM';  // Novo drop: Ham (3% chance)

        if (itemType) {
            if (!this.scene.items) {
                this.scene.items = this.scene.physics.add.group();
            }
            let item = new Item(this.scene, this.x, this.y, itemType);
            this.scene.items.add(item);
        }
    }

    respawn() {
        let x = Phaser.Math.Between(-800, 800);
        let y = Phaser.Math.Between(-800, 800);
        if (Math.abs(x) < 300 && Math.abs(y) < 300) {
            x += 400;
        }

        this.enableBody(true, x, y, true, true);
        if (this.shadow) {
            this.shadow.setVisible(true);
            this.shadow.setAlpha(0.8);
        }
        this.startX = x;
        this.startY = y;
        this.hp = this.maxHp;
        this.isDead = false;
        this.isDying = false;
        this.isParalyzed = false;
        this.state = 'IDLE';
        this.setVelocity(0);
        this.clearTint();
        this.alpha = 1; // Reset alpha
        this.play(`${this.animPrefix}-walk-down`); // Reset anim
    }

    paralyze(duration) {
        if (this.isDead || this.isDying) return;
        this.isParalyzed = true;
        this.paralyzeTimer = duration;
        this.isAttacking = false;
        this.damageDealt = false;
        this.setVelocity(0);
        this.anims.stop();
        this.setTint(0x888888); // Subtle grey for paralysis overlay
    }

    restoreTint() {
        if (this.isDead || this.isDying) return;

        if (this.isParalyzed) {
            this.setTint(0x888888);
        } else if (this.forcedLoot && this.forcedLoot.type === 'KEY') {
            this.setTint(0xffd700); // Light Gold
        } else {
            this.clearTint();
        }
    }

    destroy(fromScene) {
        if (this.shadow) {
            this.shadow.destroy();
        }
        super.destroy(fromScene);
    }
}
