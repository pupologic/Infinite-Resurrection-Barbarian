class VamBatEnemy extends Enemy {
    static createAnimations(scene) {
        const walkTexture = scene.textures.get('vambat_walk_full');
        const attackTexture = scene.textures.get('vambat_attack_full');
        const deadTexture = scene.textures.get('vambat_dead_full');
        const hurtTexture = scene.textures.get('vambat_hurt_full');

        const walkFW = walkTexture.source[0].width / 8;
        const walkFH = walkTexture.source[0].height / 8;
        const attackFW = attackTexture.source[0].width / 8;
        const attackFH = attackTexture.source[0].height / 8;
        const deadFW = deadTexture.source[0].width / 8;
        const deadFH = deadTexture.source[0].height / 8;
        const hurtFW = hurtTexture.source[0].width / 3;
        const hurtFH = hurtTexture.source[0].height / 3;

        scene.textures.addSpriteSheet('vambat_walk', walkTexture.source[0].image, { frameWidth: walkFW, frameHeight: walkFH });
        scene.textures.addSpriteSheet('vambat_attack', attackTexture.source[0].image, { frameWidth: attackFW, frameHeight: attackFH });
        scene.textures.addSpriteSheet('vambat_dead', deadTexture.source[0].image, { frameWidth: deadFW, frameHeight: deadFH });
        scene.textures.addSpriteSheet('vambat_hurt', hurtTexture.source[0].image, { frameWidth: hurtFW, frameHeight: hurtFH });

        const directions = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
        directions.forEach((dir, rowIndex) => {
            scene.anims.create({
                key: `vambat-walk-${dir}`,
                frames: scene.anims.generateFrameNumbers('vambat_walk', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 24, repeat: -1
            });
            scene.anims.create({
                key: `vambat-idle-${dir}`,
                frames: scene.anims.generateFrameNumbers('vambat_walk', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 16, repeat: -1
            });
            scene.anims.create({
                key: `vambat-attack-${dir}`,
                frames: scene.anims.generateFrameNumbers('vambat_attack', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 20, repeat: 0
            });
            scene.anims.create({
                key: `vambat-dead-${dir}`,
                frames: scene.anims.generateFrameNumbers('vambat_dead', { start: rowIndex * 8, end: (rowIndex * 8) + 7 }),
                frameRate: 12, repeat: 0
            });
            scene.anims.create({
                key: `vambat-hurt-${dir}`,
                frames: scene.anims.generateFrameNumbers('vambat_hurt', { start: rowIndex, end: rowIndex }),
                frameRate: 1, repeat: 0
            });
        });
    }

    constructor(scene, x, y) {
        const shadowWidth = 30;
        const shadowHeight = 15;
        const shadowYOffset = 60;

        super(scene, x, y, 'vambat_walk', shadowWidth, shadowHeight, shadowYOffset);

        this.animPrefix = 'vambat';
        this.hp = 8;
        this.maxHp = 8;
        this.speed = 90;
        this.damage = 6;
        this.baseVisionRange = 400;
        this.visionRange = this.baseVisionRange;
        this.hoverDistance = 180;
        this.dashSpeed = 450;
        this.dashDuration = 600;
        this.dashCooldown = 3000;
        this.lastDashTime = 0;
        this.isDashing = false;
        this.hasHitPlayerDuringDash = false;

        // Ajuste de Colisão (Física)
        const colRadius = 12;
        const colOffX = 10;
        const colOffY = 36;
        this.body.setCircle(colRadius, colOffX, colOffY);
        this.setPushable(false);
    }

    update(time, delta, player, obstacles) {
        if (this.isDead) {
            if (this.shadow) this.shadow.setVisible(false);
            return;
        }

        if (this.isDying) {
            // Durante a morte, gerenciamos a profundidade e a sombra manualmente
            // para evitar que super.update mova a sombra junto com o sprite que cai.
            this.setDepth(this.y);
            if (this.shadow && this.shadowGroundY !== undefined) {
                this.shadow.setVisible(true);
                this.shadow.setPosition(this.x, this.shadowGroundY);
            }
            return;
        }

        if (this.isParalyzed) {
            super.update(time, delta, player, obstacles);

            // CAUSA RAIZ: super.update (Enemy.js) move a sombra para seguir o sprite.
            // Precisamos travar a sombra no chão (shadowGroundY) se ela existir.
            if (this.shadow && this.shadowGroundY !== undefined) {
                this.shadow.setVisible(true);
                this.shadow.setPosition(this.x, this.shadowGroundY);
                // No chão, o depth deve ser o do impacto
                this.setDepth(this.shadowGroundY);
            }

            // Força animação de hurt durante paralisia
            const targetHurt = `vambat-hurt-${this.lastDirection}`;
            if (this.anims.currentAnim?.key !== targetHurt) {
                this.play(targetHurt, true);
            }
            return;
        }

        // CAUSA RAIZ: pushbackVelocity é setado por Enemy.takeDamage (ex: Dash do player)
        // O VamBat precisa processar isso ANTES de qualquer lógica de dash/ataque
        if (this.pushbackVelocity && this.pushbackVelocity.length() > 5) {
            // Cancelar ataque/dash imediatamente
            this.isDashing = false;
            this.isAttacking = false;

            this.pushbackVelocity.scale(0.92);
            this.setVelocity(this.pushbackVelocity.x, this.pushbackVelocity.y);

            if (this.pushbackVelocity.length() < 20) {
                this.isHurt = false;
                this.pushbackVelocity.set(0, 0);
            } else {
                this.isHurt = true;
            }

            this.handleAnimations();
            this.setDepth(this.y); // Sync depth during knockback

            if (this.shadow) {
                this.shadow.setVisible(true);
                this.shadow.setPosition(this.x, this.y + (this.body.height / 2) + this.shadowYOffset);
                this.shadow.setDepth(-19997);
            }
            return;
        }

        if (this.isDashing) {
            if (!this.hasHitPlayerDuringDash) {
                if (this.scene.physics.overlap(this, player)) {
                    if (player.takeDamage(this.damage)) {
                        this.hasHitPlayerDuringDash = true;
                    }
                }
            }

            this.handleAnimations();

            if (this.shadow) {
                this.shadow.setVisible(true);
                this.shadow.setPosition(this.x, this.y + (this.body.height / 2) + this.shadowYOffset);
            }
            return;
        }

        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const hasLineOfSight = !player.isDead && (distToPlayer < this.visionRange) && this.checkLineOfSight(player, obstacles);

        if (this.state === 'CHASE' && hasLineOfSight) {
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

            if (time > this.lastDashTime + this.dashCooldown && distToPlayer < 300) {
                this.startDashAttack(player, time, angleToPlayer);
                return;
            }

            if (distToPlayer < this.hoverDistance - 20) {
                const retreatAngle = angleToPlayer + Math.PI;
                const rx = this.x + Math.cos(retreatAngle) * 50;
                const ry = this.y + Math.sin(retreatAngle) * 50;
                this.moveTowards(rx, ry, this.speed * 0.8, obstacles);
            } else if (distToPlayer > this.hoverDistance + 20) {
                this.moveTowards(player.x, player.y, this.speed, obstacles);
            } else {
                this.setVelocity(0);
            }
            this.lastKnownPos = { x: player.x, y: player.y };
        } else {
            super.update(time, delta, player, obstacles);
        }

        // Update direction: look where moving if walking, else face player if in CHASE
        if (this.body.velocity.length() > 5 && !this.isAttacking && !this.isHurt && !this.isDashing) {
            const moveAngle = Phaser.Math.RadToDeg(Math.atan2(this.body.velocity.y, this.body.velocity.x));
            this.setDirectionFromAngle(moveAngle);
        } else if (this.state === 'CHASE' && hasLineOfSight && !this.isAttacking && !this.isHurt && !this.isDashing) {
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.setDirectionFromAngle(Phaser.Math.RadToDeg(angleToPlayer));
        }

        if (!this.isAttacking && !this.isHurt && !this.isDashing) {
            const isMoving = this.body.velocity.length() > 5;
            const animKey = isMoving ? `vambat-walk-${this.lastDirection}` : `vambat-idle-${this.lastDirection}`;
            if (this.anims.currentAnim?.key !== animKey) {
                this.play(animKey, true);
            }
        }

        if (this.shadow) {
            this.shadow.setVisible(true);
            // sy define a posição da sombra (o chão)
            const sy = (this.isDying && this.shadowGroundY !== undefined) ? this.shadowGroundY : (this.y + this.shadowYOffset);
            this.shadow.setPosition(this.x, sy);
            this.shadow.setDepth(-19997);
        }
    }

    startDashAttack(player, time, angle) {
        if (this.isHurt || this.isDead) return;

        this.isDashing = true;
        this.hasHitPlayerDuringDash = false;
        this.lastDashTime = time;
        this.isAttacking = true;

        this.setTint(0xff0000);
        this.setVelocity(0);

        // Face player during wind-up
        this.setDirectionFromAngle(Phaser.Math.RadToDeg(angle));

        // Wind-up de 300ms antes do mergulho
        this.scene.time.delayedCall(300, () => {
            // Se morreu ou foi atingido durante o wind-up, cancela
            if (this.isDead || this.isDying || this.isHurt) {
                this.isDashing = false;
                this.isAttacking = false;
                this.clearTint();
                return;
            }

            this.clearTint();
            const dashVec = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(this.dashSpeed);
            this.setVelocity(dashVec.x, dashVec.y);

            // Ensure facing the player during dash
            this.setDirectionFromAngle(Phaser.Math.RadToDeg(angle));
            this.play(`vambat-attack-${this.lastDirection}`, true);
            this.scene.sound.play('BatDash');

            // Duração do mergulho
            this.scene.time.delayedCall(this.dashDuration, () => {
                if (this.isDead || this.isDying || this.isHurt) {
                    this.isDashing = false;
                    this.isAttacking = false;
                    return;
                }
                this.isDashing = false;
                this.isAttacking = false;
                this.setVelocity(0, 0);
            });
        });
    }

    takeDamage(amount, pushbackVector) {
        if (this.isDead || this.isDying) return;

        this.hp -= amount;
        if (this.scene.showDamagePopup) {
            this.scene.showDamagePopup(amount, this.x, this.y, '#ffffff');
        }

        if (this.hp <= 0) {
            this.die();
            return;
        }

        // Interrupção agressiva do estado de ataque
        this.isAttacking = false;
        this.isDashing = false;
        this.isHurt = true;

        if (pushbackVector) {
            this.pushbackVelocity = pushbackVector.clone().scale(3.0);
            this.setVelocity(this.pushbackVelocity.x, this.pushbackVelocity.y);
        }

        this.setTint(0xff0000);
        this.scene.time.delayedCall(80, () => { // Reduzido de 150 para 80ms
            if (this.active && !this.isDead && !this.isDying) {
                this.restoreTint();
                this.isHurt = false;
            }
        });

        return true;
    }

    paralyze(duration) {
        if (this.isDead || this.isDying) return;

        // Se já estiver sendo derrubado por um rugido, apenas renovamos o tempo do rugido
        if (this.isParalyzed) {
            super.paralyze(duration);
            return;
        }

        this.roarOriginalY = this.y;
        this.shadowGroundY = this.y + this.shadowYOffset;

        super.paralyze(duration);
        this.isHurt = true;

        // Tween de queda
        const landingBuffer = 12;
        this.scene.tweens.add({
            targets: this,
            y: this.shadowGroundY - landingBuffer,
            duration: 400,
            ease: 'Bounce.easeOut'
        });

        // Agendamos a volta para o céu
        // Usamos um tempo ligeiramente menor que a duração total para ele começar a subir antes de "acordar"
        this.scene.time.delayedCall(duration, () => {
            if (this.active && !this.isDead && !this.isDying) {
                this.isHurt = false;
                this.restoreTint();
                this.scene.tweens.add({
                    targets: this,
                    y: this.roarOriginalY,
                    duration: 600,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        // O estado isParalyzed é controlado pelo timer de Enemy.js, 
                        // mas garantimos que as flags visuais voltem ao normal aqui.
                        this.restoreTint();
                    }
                });
            }
        });
    }

    die() {
        if (this.isDead || this.isDying) return;

        // landingBuffer: Ajuste fino para os pés tocarem a sombra em vez do centro do sprite
        // Se ele passar da sombra, aumente este valor (ex: 15). Se ficar flutuando, diminua (ex: 5).
        const landingBuffer = 12;

        // Lock shadow position for death animation
        if (this.shadow) {
            this.shadowGroundY = this.y + this.shadowYOffset;
        }

        // Antes de chamar o super.die, iniciamos o tween de "queda"
        this.scene.tweens.add({
            targets: this,
            y: (this.y + this.shadowYOffset) - landingBuffer,
            duration: 800,
            ease: 'Bounce.easeOut'
        });

        super.die();
    }
}
