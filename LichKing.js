class LichKing extends Enemy {
    static createAnimations(scene) {
        const directions = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
        const animTypes = ['idle', 'walk', 'hurt', 'dead', 'attack1', 'attack2', 'attack3', 'shield', 'teleport'];

        animTypes.forEach(anim => {
            const texKey = `lichking_${anim}_full`;
            if (scene.textures.exists(texKey)) {
                const tex = scene.textures.get(texKey);
                const columns = (['shield', 'hurt'].includes(anim)) ? 3 : 8;
                const rows = (['shield', 'hurt'].includes(anim)) ? 3 : 8;
                const fw = tex.source[0].width / columns;
                const fh = tex.source[0].height / rows;
                scene.textures.addSpriteSheet(`lichking_${anim}_sheet`, tex.source[0].image, { frameWidth: fw, frameHeight: fh });

                directions.forEach((dir, rowIndex) => {
                    if (anim === 'shield') return;

                    let repeat = -1;
                    if (['dead', 'attack1', 'attack2', 'attack3', 'teleport', 'hurt'].includes(anim)) repeat = 0;

                    let startFrame, endFrame;
                    if (anim === 'hurt') {
                        // For 3x3 grid, we use one frame per direction (0-7)
                        startFrame = rowIndex;
                        endFrame = rowIndex;
                    } else {
                        // For 8x8 grid
                        startFrame = rowIndex * 8;
                        endFrame = (rowIndex * 8) + 7;
                    }

                    scene.anims.create({
                        key: `lichking-${anim}-${dir}`,
                        frames: scene.anims.generateFrameNumbers(`lichking_${anim}_sheet`, { start: startFrame, end: endFrame }),
                        frameRate: (anim === 'hurt') ? 1 : 10,
                        repeat: repeat
                    });
                });

                // Create special 3x3 looping animation for shield effect
                if (anim === 'shield') {
                    scene.anims.create({
                        key: 'lichking-shield-effect',
                        frames: scene.anims.generateFrameNumbers('lichking_shield_sheet', { start: 0, end: 8 }),
                        frameRate: 15,
                        repeat: -1
                    });
                }
            }
        });

        // Energy 1
        if (scene.textures.exists('lich_energy_1_full')) {
            const e1tex = scene.textures.get('lich_energy_1_full');
            const fw1 = e1tex.source[0].width / 3;
            const fh1 = e1tex.source[0].height / 3;
            scene.textures.addSpriteSheet('lich_energy_1_sheet', e1tex.source[0].image, { frameWidth: fw1, frameHeight: fh1 });
            scene.anims.create({
                key: `lich-energy1-burn`,
                frames: scene.anims.generateFrameNumbers('lich_energy_1_sheet', { start: 0, end: 8 }),
                frameRate: 15,
                repeat: -1
            });
        }

        // Energy 2
        if (scene.textures.exists('lich_energy_2_full')) {
            const e2tex = scene.textures.get('lich_energy_2_full');
            const fw2 = e2tex.source[0].width / 8;
            const fh2 = e2tex.source[0].height / 8;
            scene.textures.addSpriteSheet('lich_energy_2_sheet', e2tex.source[0].image, { frameWidth: fw2, frameHeight: fh2 });
            directions.forEach((dir, rowIndex) => {
                scene.anims.create({
                    key: `lich-energy2-${dir}`,
                    frames: scene.anims.generateFrameNumbers('lich_energy_2_sheet', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                    frameRate: 15,
                    repeat: -1
                });
            });
        }
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'lichking_walk_sheet', 100, 40); // Large shadow for Boss

        console.log("LichKing spawned. Teleport points in scene:", scene.lichTeleportPoints?.length || 0);

        // Adjust collision body for better visual alignment
        this.body.setCircle(30, 45, 80); // Radius 30, X-offset 0, Y-offset 20 (moves it down)

        this.animPrefix = 'lichking';
        this.hp = 1000;
        this.maxHp = 1000;
        this.speed = 35; // Slightly slower walk
        this.visionRange = 800; // Big Aggro
        this.keepDistance = 150;

        this.attackRate = 3000; // Time between attacks
        this.nextAttackTime = 0;

        this.isShielded = false;
        this.shieldDuration = 5000;
        this.shieldEndTime = 0;

        this.isTeleporting = false;
        this.teleportTriggered = false;

        this.damageRadius = 40;
        this.shieldFx = null;
        this.summons = [];
    }

    update(time, delta, player, obstacles) {
        if (this.isDead) {
            if (this.shadow) this.shadow.setVisible(false);
            return;
        }

        if (this.shadow) {
            this.shadow.setVisible(true);
            this.shadow.setPosition(this.x, this.y + (this.body.height / 2) + 15);
            this.shadow.setDepth(-19997);
        }

        if (this.isDying) return;

        // Cleanup summons
        this.summons = this.summons.filter(m => m.active && !m.isDead);

        // Shield logic (visual overlay)
        if (this.isShielded) {
            if (!this.shieldFx) {
                this.shieldFx = this.scene.add.sprite(this.x, this.y, 'lichking_shield_sheet');
                this.shieldFx.setBlendMode('ADD'); // "Screen" like effect
                this.shieldFx.setScale(1.2);
            }
            this.shieldFx.setVisible(true);
            this.shieldFx.setPosition(this.x, this.y);
            this.shieldFx.setDepth(this.depth + 1);
            if (this.shieldFx.anims.currentAnim?.key !== 'lichking-shield-effect') {
                this.shieldFx.play('lichking-shield-effect');
            }

            if (time > this.shieldEndTime) {
                this.isShielded = false;
                if (this.shieldFx) this.shieldFx.setVisible(false);
            }
        } else if (this.shieldFx) {
            this.shieldFx.setVisible(false);
        }

        // Pushback / Hurt State
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

        // Action State (Attacking, Teleporting)
        if (this.isAttacking || this.isTeleporting) {
            this.setVelocity(0);

            // Skill execution on specific frame
            if (this.anims.currentFrame && !this.damageDealt) {
                const frameIdx = this.anims.currentFrame.index;

                // Teleport Logic: End of animation
                if (this.isTeleporting && (frameIdx >= 7 || !this.anims.isPlaying)) {
                    this.damageDealt = true;
                    this.anims.pause();

                    // 1. Smooth Transition to Green Solid
                    this.scene.tweens.addCounter({
                        from: 0,
                        to: 100,
                        duration: 300,
                        onUpdate: (tween) => {
                            const value = tween.getValue() / 100;
                            if (value >= 0.9) {
                                this.setTintFill(0x00ff00);
                            } else {
                                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                                    Phaser.Display.Color.ValueToColor(0xffffff),
                                    Phaser.Display.Color.ValueToColor(0x00ff00),
                                    1, value
                                );
                                this.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                            }
                        }
                    });

                    this.scene.time.delayedCall(500, () => {
                        // 2. Fade Out & Teleport
                        this.scene.tweens.add({
                            targets: this,
                            alpha: 0,
                            duration: 250,
                            onComplete: () => {
                                this.doTeleport();
                                this.setTintFill(0x00ff00); // Maintain solid green

                                // 3. Fade In at New Position
                                this.scene.tweens.add({
                                    targets: this,
                                    alpha: 1,
                                    duration: 250,
                                    onComplete: () => {
                                        // 4. Smooth Transition back to Normal
                                        this.scene.tweens.addCounter({
                                            from: 0,
                                            to: 100,
                                            duration: 400,
                                            onUpdate: (tween) => {
                                                const value = tween.getValue() / 100;
                                                if (value <= 0.1) {
                                                    this.setTintFill(0x00ff00);
                                                } else {
                                                    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                                                        Phaser.Display.Color.ValueToColor(0x00ff00),
                                                        Phaser.Display.Color.ValueToColor(0xffffff),
                                                        1, value
                                                    );
                                                    this.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                                                }
                                            },
                                            onComplete: () => {
                                                this.clearTint();
                                                this.damageDealt = false;
                                                this.isTeleporting = false;
                                                this.anims.resume();
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
                // Attack/Shield Logic: Middle frame (5)
                else if (this.isAttacking && frameIdx === 5) {
                    if (this.currentAttack === 'attack1') {
                        this.shootEnergy1(player);
                    } else if (this.currentAttack === 'attack2') {
                        this.shootEnergy2();
                    } else if (this.currentAttack === 'attack3') {
                        this.summonMinions();
                    } else if (this.currentAttack === 'shield_cast') {
                        this.isShielded = true;
                        this.shieldEndTime = time + this.shieldDuration;
                        this.scene.sound.play('Barrier', { volume: 0.6 });
                    }
                    this.damageDealt = true;
                }
            }

            if (!this.anims.isPlaying && !this.isTeleporting) {
                this.isAttacking = false;
            } else {
                return;
            }
        }

        // Player Distance && Aggro
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const hasLineOfSight = !player.isDead && (distToPlayer < this.visionRange);

        if (hasLineOfSight) {
            if (time > this.nextAttackTime) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.setDirectionFromAngle(Phaser.Math.RadToDeg(angle));
                this.performRandomAction(time, distToPlayer);
                return;
            }

            if (distToPlayer > this.keepDistance) {
                this.moveTowards(player.x, player.y, this.speed);
            } else if (distToPlayer < this.keepDistance - 50) {
                const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
                const targetX = this.x + Math.cos(angle) * 100;
                const targetY = this.y + Math.sin(angle) * 100;
                this.moveTowards(targetX, targetY, this.speed);
            } else {
                this.setVelocity(0);
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.setDirectionFromAngle(Phaser.Math.RadToDeg(angle));
            }
        } else {
            this.setVelocity(0);
        }

        // Movement Facing (8-direction snap based on actual velocity)
        if (this.body.velocity.length() > 5) {
            const angle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
            this.setDirectionFromAngle(Phaser.Math.RadToDeg(angle));
        }

        this.handleAnimations();
        this.setDepth(this.y);
    }

    performRandomAction(time, distToPlayer) {
        this.nextAttackTime = time + this.attackRate + Phaser.Math.Between(0, 1000);
        this.damageDealt = false;
        this.isAttacking = false;
        this.isTeleporting = false;

        const skills = ['attack1', 'attack2', 'attack3', 'shield', 'teleport'];
        if (!this.scene.lichTeleportPoints || this.scene.lichTeleportPoints.length === 0) {
            skills.splice(4, 1);
        }

        let skill = Phaser.Math.RND.pick(skills);
        this.currentAttack = skill;
        console.log("LichKing choosing skill:", skill);

        if (skill === 'shield') {
            this.isAttacking = true;
            this.currentAttack = 'shield_cast';
            this.play(`${this.animPrefix}-attack3-${this.lastDirection}`, true);
        } else if (skill === 'teleport') {
            this.isTeleporting = true;
            this.currentAttack = 'teleport';
            this.play(`${this.animPrefix}-teleport-${this.lastDirection}`, true);
        } else {
            this.isAttacking = true;
            this.play(`${this.animPrefix}-${skill}-${this.lastDirection}`, true);
        }
    }

    shootEnergy1(player) {
        if (!this.scene.projectiles) return;
        this.scene.sound.play('Bomb');
        const proj = this.scene.physics.add.sprite(this.x, this.y, 'lich_energy_1_sheet');
        this.scene.projectiles.add(proj);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        proj.play(`lich-energy1-burn`);
        proj.setScale(0);
        proj.setRotation(angle);
        proj.setDepth(this.depth + 10);
        this.scene.tweens.add({ targets: proj, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut' });
        const speed = 250;
        proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.scene.time.delayedCall(3000, () => { if (proj.active) proj.destroy(); });
    }

    shootEnergy2() {
        if (!this.scene.projectiles) return;
        this.scene.sound.play('Bomb');
        const dirs = [
            { a: 0, n: 'right' }, { a: Math.PI / 4, n: 'down-right' },
            { a: Math.PI / 2, n: 'down' }, { a: 3 * Math.PI / 4, n: 'down-left' },
            { a: Math.PI, n: 'left' }, { a: -3 * Math.PI / 4, n: 'up-left' },
            { a: -Math.PI / 2, n: 'up' }, { a: -Math.PI / 4, n: 'up-right' }
        ];
        dirs.forEach(d => {
            const proj = this.scene.physics.add.sprite(this.x, this.y, 'lich_energy_2_sheet');
            this.scene.projectiles.add(proj);
            proj.play(`lich-energy2-${d.n}`);
            proj.setDepth(this.depth + 10);
            const speed = 200;
            proj.setVelocity(Math.cos(d.a) * speed, Math.sin(d.a) * speed);
            this.scene.time.delayedCall(3000, () => { if (proj.active) proj.destroy(); });
        });
    }

    summonMinions() {
        const activeSummons = this.summons.length;
        if (activeSummons >= 3) return;

        const minions = ['skeleton', 'skullbug', 'demonimp'];
        const remainingSlots = 3 - activeSummons;
        const numToSummon = Math.min(Phaser.Math.Between(2, 3), remainingSlots);

        for (let i = 0; i < numToSummon; i++) {
            const mType = Phaser.Math.RND.pick(minions);
            const ox = this.x + Phaser.Math.Between(-120, 120);
            const oy = this.y + Phaser.Math.Between(-120, 120);

            // 1. Create Ground Indicator (Green Pulse)
            const indicator = this.scene.add.graphics();
            indicator.fillStyle(0x00ff00, 0.4);
            indicator.fillCircle(0, 0, 40);
            indicator.setPosition(ox, oy);
            indicator.setDepth(this.depth - 100); // Below entities
            indicator.setScale(0);
            indicator.alpha = 0;

            this.scene.tweens.add({
                targets: indicator,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0.8,
                duration: 800,
                ease: 'Sine.easeInOut',
                yoyo: true,
                onComplete: () => {
                    indicator.destroy();

                    // 2. Spawn Minion
                    let newMinion;
                    if (mType === 'skeleton') newMinion = new SkeletonEnemy(this.scene, ox, oy);
                    else if (mType === 'skullbug') newMinion = new SkullBugEnemy(this.scene, ox, oy);
                    else newMinion = new RangedEnemy(this.scene, ox, oy);

                    this.scene.enemies.add(newMinion);
                    this.summons.push(newMinion);
                }
            });
        }
    }

    doTeleport() {
        const pts = this.scene.lichTeleportPoints;
        if (!pts || pts.length === 0) return;
        const pt = Phaser.Math.RND.pick(pts);
        console.log("LichKing teleporting to:", pt.x, pt.y);
        this.setPosition(pt.x, pt.y);
    }

    takeDamage(amount, pushbackVector) {
        if (this.isShielded) return;
        super.takeDamage(amount, pushbackVector);
    }

    getDirectionNameFromAngle(angle) {
        let deg = Phaser.Math.RadToDeg(angle);
        if (deg < 0) deg += 360;
        if (deg >= 337.5 || deg < 22.5) return 'right';
        if (deg >= 22.5 && deg < 67.5) return 'down-right';
        if (deg >= 67.5 && deg < 112.5) return 'down';
        if (deg >= 112.5 && deg < 157.5) return 'down-left';
        if (deg >= 157.5 && deg < 202.5) return 'left';
        if (deg >= 202.5 && deg < 247.5) return 'up-left';
        if (deg >= 247.5 && deg < 292.5) return 'up';
        if (deg >= 292.5 && deg < 337.5) return 'up-right';
        return 'down';
    }

    handleAnimations() {
        if (this.isAttacking || this.isTeleporting || this.isDying) return;
        let action = 'idle';
        if (this.isHurt) action = 'hurt';
        else if (this.body.velocity.length() > 5) action = 'walk';
        const animKey = `${this.animPrefix}-${action}-${this.lastDirection}`;
        if (this.anims.currentAnim?.key !== animKey) this.play(animKey, true);
    }
}
