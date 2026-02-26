class Door extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, options = {}) {
        super(scene, x, y, 'door_closed');
        scene.add.existing(this);

        // Desativa o corpo físico do sprite principal (fantasma)
        scene.physics.add.existing(this, true);
        if (this.body) this.body.enable = false;

        this.keyRequired = options.keyRequired || null; // e.g., 'GOLD_KEY'
        this.isOpen = false;

        // Ajuste visual
        this.setDisplaySize(112, 112);

        // --- SISTEMA DE ZONE COLLISION ---
        const cWidth = options.collisionWidth || 112;
        const cHeight = options.collisionHeight || 56; // Use full tile height
        const offX = options.offsetX || 0;
        const offY = options.offsetY || 16;

        // Criamos a Zone de colisão física
        const zoneX = x + offX;
        const zoneY = y + offY;

        const zone = scene.add.zone(zoneX, zoneY, cWidth, cHeight);
        scene.physics.add.existing(zone, true);
        zone.body.setSize(cWidth, cHeight);
        zone.body.updateFromGameObject();

        // Adicionamos a zone ao grupo de paredes para bloquear movimento
        const group = options.collisionGroup || scene.walls;
        if (group) {
            group.add(zone);
        }

        this.collisionZone = zone;
        this.setDepth(y);
    }

    interact(player) {
        if (this.isOpen) return;

        if (this.keyRequired) {
            if (player.hasKey(this.keyRequired)) {
                console.log("Door: Player has key, opening.");
                this.open();
                player.useKey(this.keyRequired);
                if (typeof updateInventoryUI === 'function') {
                    updateInventoryUI('key', player.keys.length);
                }
            } else {
                console.log("Door: Player MISSING key:", this.keyRequired);
                this.scene.showPopup("Locked!", player.x, player.y - 50);
            }
        } else {
            // Normal door
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.setTexture('door_open');
        this.scene.sound.play('DoorOpen');

        // Desativa a colisão física da Zone
        if (this.collisionZone && this.collisionZone.body) {
            this.collisionZone.body.enable = false;
        }

        this.scene.showPopup("Opened!", this.x, this.y);
    }
}
