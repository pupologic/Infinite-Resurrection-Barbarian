class Chest extends Phaser.Physics.Arcade.Sprite {
    static createAnimations(scene) {
        if (scene.textures.exists('chest_sheet')) return;

        const texture = scene.textures.get('chest_multi');
        const frameWidth = texture.source[0].width / 4;
        const frameHeight = texture.source[0].height / 4;

        scene.textures.addSpriteSheet('chest_sheet', texture.source[0].image, {
            frameWidth: frameWidth,
            frameHeight: frameHeight
        });

        const directions = ['down', 'up', 'right', 'left'];
        directions.forEach((dir, index) => {
            scene.anims.create({
                key: `chest_opening_${dir}`,
                frames: scene.anims.generateFrameNumbers('chest_sheet', { start: index * 4, end: (index * 4) + 3 }),
                frameRate: 10,
                repeat: 0
            });
        });
    }

    constructor(scene, x, y, contents = null, options = {}) {
        const direction = options.direction || 'down'; // up, down, left, right
        let startFrame = 0;
        if (direction === 'up') startFrame = 4;
        else if (direction === 'right') startFrame = 8;
        else if (direction === 'left') startFrame = 12;

        super(scene, x, y, 'chest_sheet', startFrame);
        this.direction = direction;
        scene.add.existing(this);

        scene.physics.add.existing(this, true);
        if (this.body) this.body.enable = false;

        this.contents = contents;
        this.isOpened = false;

        // The direction the player must face to open the chest (opposite of chest's mouth direction)
        if (this.direction === 'down') this.interactionDirection = 'up';
        else if (this.direction === 'up') this.interactionDirection = 'down';
        else if (this.direction === 'left') this.interactionDirection = 'right';
        else if (this.direction === 'right') this.interactionDirection = 'left';

        // --- ÁREA SÓLIDA ALTERNATIVA ---
        // Criamos um bloco invisível no grupo de obstáculos da cena.
        // Este bloco é o que realmente impedirá a passagem.
        if (scene.obstacles) {
            // Adjust solid block slightly so it doesn't block the interaction side
            let solidX = x;
            let solidY = y;
            if (this.direction === 'down') solidY = y + 5;
            else if (this.direction === 'up') solidY = y + 15;
            else if (this.direction === 'left') { solidX = x + 2; solidY = y + 10; }
            else if (this.direction === 'right') { solidX = x + 2; solidY = y + 10; }

            let solidW = 60;
            let solidH = 40;

            if (this.direction === 'left' || this.direction === 'right') {
                solidW = 40;
                solidH = 40;
            }

            const solid = scene.add.zone(solidX, solidY, solidW, solidH);

            // Adiciona física estática manualmente
            scene.physics.add.existing(solid, true);

            // Garante que o corpo físico tenha o tamanho da zona
            solid.body.setSize(solidW, solidH);
            solid.body.updateFromGameObject();

            // Adiciona ao grupo de colisão (sem criar novo sprite)
            scene.obstacles.add(solid);

            this.solidBlock = solid;
        }

        this.setDepth(y);
    }

    interact(player) {
        if (this.isOpened) return;

        // Since game.js already checks distance and direction matching via interactionDirection,
        // we can safely open here. The previous strict coordinate checks were conflicting 
        // with the solid collision box.
        this.open(player);
    }

    open(player) {
        this.isOpened = true;
        this.scene.sound.play('ChestOpen');
        this.play(`chest_opening_${this.direction}`);

        this.once(`animationcomplete-chest_opening_${this.direction}`, () => {
            if (this.contents) {
                let itemCount = 3;
                if (this.contents.extraDrops) {
                    itemCount = 1 + this.contents.extraDrops.length;
                } else {
                    itemCount = Phaser.Math.Between(1, 3);
                }
                const itemsSpawned = [];

                for (let i = 0; i < itemCount; i++) {
                    let item;
                    const extra = { noInitialBob: true };

                    // Slightly offset each item visual
                    const ox = (i - 1) * 20;

                    let type, itemCategory;

                    // Logic: First item is always the guarantee content.
                    // Subsequent items are random bonuses.

                    if (i === 0) {
                        if (this.contents.type === 'KEY') {
                            type = 'KEY';
                            itemCategory = 'key';
                            extra.keyId = this.contents.value || this.contents.keyId || 'GENERIC';
                            player.addKey(extra.keyId);
                            itemsSpawned.push("Key");
                        } else if (this.contents.type === 'COIN') {
                            type = 'COIN';
                            itemCategory = 'coin';
                        } else {
                            type = this.contents.itemType || 'COIN'; // Fallback
                            itemCategory = type.toLowerCase();
                        }
                    } else {
                        // Use extraDrops if defined, otherwise use random pool
                        if (this.contents.extraDrops && this.contents.extraDrops[i - 1]) {
                            type = this.contents.extraDrops[i - 1].toUpperCase();
                        } else {
                            // Subsequent items are randomized (No keys in random pool)
                            const pool = ['COIN', 'HEALTH', 'STAMINA', 'SPEED', 'STRENGTH'];
                            type = pool[Phaser.Math.Between(0, pool.length - 1)];
                        }
                        itemCategory = type.toLowerCase();
                    }

                    // Apply Inventory Logic for Non-Key First Items and All Random Items
                    if (type !== 'KEY') {
                        if (type === 'COIN') {
                            player.addCoin(50);
                        } else {
                            if (!player.inventory[itemCategory]) player.inventory[itemCategory] = 0;
                            player.inventory[itemCategory]++;
                        }
                        itemsSpawned.push(type.charAt(0) + type.slice(1).toLowerCase());
                    }

                    // Visual only "ghost" item that floats up then disappears
                    item = this.scene.spawnItem(this.x + ox, this.y, type, extra);

                    // Update UI immediately since we gave it to player
                    if (typeof updateInventoryUI === 'function') {
                        let count = 0;
                        if (type === 'COIN') count = player.coins;
                        else if (type === 'KEY') count = player.keys.length;
                        else count = player.inventory[itemCategory];
                        updateInventoryUI(itemCategory, count);
                    }

                    if (item) {
                        this.scene.tweens.add({
                            targets: item,
                            y: this.y - 64,
                            alpha: 0,
                            duration: 1000,
                            ease: 'Power2.easeOut',
                            onComplete: () => item.destroy()
                        });
                    }
                }

                // Show popup with items found
                if (this.scene.showPopup) {
                    const findSummary = [...new Set(itemsSpawned)].join(", ");
                    this.scene.showPopup(`Found: ${findSummary}!`, this.x, this.y - 80);
                }
            }
        });
    }
}
