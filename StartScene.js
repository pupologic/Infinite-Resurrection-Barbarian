class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('ui_bg', 'Asset/UI/background_BG.jpg');
        this.load.image('ui_mid', 'Asset/UI/Midground_BG.png');
        this.load.image('ui_fg', 'Asset/UI/foreground_BG.png');

        // Sounds
        this.load.audio('Start_Menu', 'Asset/Audio/Start_Menu.mp3');
        this.load.audio('Ambient', 'Asset/Audio/Ambient.mp3');
        this.load.audio('MonsterDie', 'Asset/Audio/MonsterDie.mp3');
        this.load.audio('BigMonsterDie', 'Asset/Audio/BigMonsterDie.mp3');
        this.load.audio('SkeletonDie', 'Asset/Audio/SkeletonDie.mp3');
        this.load.audio('BullPunch', 'Asset/Audio/BullPunch.mp3');
        this.load.audio('BugAttack', 'Asset/Audio/BugAttack.mp3');
        this.load.audio('ChestOpen', 'Asset/Audio/ChestOpen.mp3');
        this.load.audio('DoorOpen', 'Asset/Audio/DoorOpen.mp3');
        this.load.audio('Dash', 'Asset/Audio/Dash.mp3');
        this.load.audio('BatDash', 'Asset/Audio/BatDash.mp3');
        this.load.audio('SwordAttack', 'Asset/Audio/SwordAttack.mp3');
        this.load.audio('Pause', 'Asset/Audio/Pause.mp3');
        this.load.audio('StartButton', 'Asset/Audio/StartButton.mp3');
        this.load.audio('Item', 'Asset/Audio/Item.mp3');
        this.load.audio('Die', 'Asset/Audio/Die.mp3');
        this.load.audio('Punch', 'Asset/Audio/Punch.mp3');
        this.load.audio('Kick', 'Asset/Audio/Kick.mp3');
        this.load.audio('Roar', 'Asset/Audio/Roar.mp3');
        this.load.audio('Pound', 'Asset/Audio/Pound.mp3');
        this.load.audio('Bomb', 'Asset/Audio/Bomb.mp3');
        this.load.audio('Explosion', 'Asset/Audio/Explosion.mp3');
        this.load.audio('Reborn', 'Asset/Audio/Reborn.mp3');
        this.load.audio('NextLevel', 'Asset/Audio/NextLevel.mp3');
        this.load.audio('AutoPunch', 'Asset/Audio/AutoPunch.mp3');
        this.load.audio('WalkPlayer', 'Asset/Audio/WalkPlayer.mp3');
        this.load.audio('Barrier', 'Asset/Audio/Barrier.mp3');
    }

    create() {
        // --- CONFIGURATION: IMAGE SIZES ---
        // Ajuste esses valores para controlar o tamanho relativo de cada camada
        // 1.0 = Segue a escala do Background (que preenche a tela)
        // > 1.0 = Maior, < 1.0 = Menor
        this.midSizeMult = 0.75;
        this.fgSizeMult = 1.2;

        // --- CONFIGURATION: OFFSETS (Pixels) ---
        // Use para ajustar a posição inicial das camadas
        this.midOffsetX = 300;
        this.midOffsetY = 50;
        this.fgOffsetX = 130;
        this.fgOffsetY = 60;

        // --- CONFIGURATION: PARALLAX INTENSITY ---
        this.loopSpeed = 0.0005;
        this.bgAmpX = 3; this.bgAmpY = 3;
        this.midAmpX = 10; this.midAmpY = 1;
        this.fgAmpX = 5; this.fgAmpY = 0;

        // Define Music (but don't play yet to wait for interaction)
        if (!this.sound.get('Start_Menu')) {
            this.menuMusic = this.sound.add('Start_Menu', { loop: true, volume: 0.5 });
        } else {
            this.menuMusic = this.sound.get('Start_Menu');
        }


        // Start screen: fill the window (cover mode — no black bars)
        if (typeof window.scaleGameFill === 'function') window.scaleGameFill();

        // ... UI Setup: hide game UI panels during Start Menu ...
        const uiWrapper = document.getElementById('ui-wrapper');
        const statusSidebar = document.getElementById('status-sidebar');
        const inventorySidebar = document.getElementById('inventory-sidebar');
        const gameContainer = document.getElementById('game-container');

        // Make ui-wrapper transparent (don't hide it or the canvas inside disappears!)
        if (uiWrapper) {
            uiWrapper.style.padding = '0';
            uiWrapper.style.background = 'none';
            uiWrapper.style.boxShadow = 'none';
        }
        if (statusSidebar) statusSidebar.style.display = 'none';
        if (inventorySidebar) inventorySidebar.style.display = 'none';

        // Pull game-container out of flex flow and fill the full scale-root
        // This eliminates dark border lines from retro-panel while keeping the canvas visible
        if (gameContainer) {
            gameContainer.style.position = 'absolute';
            gameContainer.style.top = '0';
            gameContainer.style.left = '0';
            gameContainer.style.width = '1320px';
            gameContainer.style.height = '680px';
            gameContainer.style.border = 'none';
            gameContainer.style.boxShadow = 'none';
            gameContainer.style.background = 'none';
            gameContainer.style.zIndex = '1';
        }

        // Phaser canvas fills the full start screen
        this.scale.resize(1320, 680);

        // Create Images
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        this.bg = this.add.image(cx, cy, 'ui_bg');
        this.mid = this.add.image(cx, cy, 'ui_mid');
        this.fg = this.add.image(cx, cy, 'ui_fg');

        // Store initial centers for parallax calculation
        this.bgC = { x: cx, y: cy };
        this.midC = { x: cx, y: cy };
        this.fgC = { x: cx, y: cy };

        // Apply Scaling Logic
        this.updateLayout(w, h);

        // ... Start Menu Interaction ...
        const startMenu = document.getElementById('start-menu');
        const startBtn = document.getElementById('start-btn');
        const loadingScreen = document.getElementById('loading-screen');
        const clickToStartScreen = document.getElementById('click-to-start-screen');

        // Initial State
        if (loadingScreen) loadingScreen.style.display = 'none';

        if (clickToStartScreen) {
            clickToStartScreen.style.display = 'flex';

            // On click, play sound and proceed to Menu
            clickToStartScreen.onclick = () => {
                this.sound.play('StartButton');
                if (this.menuMusic) this.menuMusic.play();
                clickToStartScreen.style.display = 'none';
                if (startMenu) startMenu.style.display = 'flex';
            };
        } else {
            // Fallback
            if (startMenu) startMenu.style.display = 'flex';
        }

        if (startBtn) {
            const newBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newBtn, startBtn);
            newBtn.onclick = () => {
                this.sound.play('StartButton');
                if (this.menuMusic) this.menuMusic.stop();

                // UI Restoration Logic: show game panels again
                if (startMenu) startMenu.style.display = 'none';
                if (uiWrapper) {
                    uiWrapper.style.padding = '';
                    uiWrapper.style.background = '';
                    uiWrapper.style.boxShadow = '';
                    // Apply scale(0.8) centered ONLY when game officially starts
                    uiWrapper.style.transform = 'scale(0.8)';
                    uiWrapper.style.transformOrigin = 'center center';
                }
                // Switch to contain mode for gameplay (fits screen with no crop)
                if (typeof window.scaleGameContain === 'function') window.scaleGameContain();
                if (statusSidebar) statusSidebar.style.display = '';
                if (inventorySidebar) inventorySidebar.style.display = '';
                if (gameContainer) {
                    gameContainer.style.position = '';
                    gameContainer.style.top = '';
                    gameContainer.style.left = '';
                    gameContainer.style.width = '';
                    gameContainer.style.height = '';
                    gameContainer.style.border = '';
                    gameContainer.style.boxShadow = '';
                    gameContainer.style.background = '';
                    gameContainer.style.zIndex = '';
                }
                // Resize back to game canvas size
                this.scale.resize(800, 600);
                this.scene.start('GameScene');
            };
        }
    }

    updateLayout(width, height) {
        // Update Viewport - Guard against undefined camera during scene transition/shutdown
        if (!this.cameras || !this.cameras.main) return;

        this.cameras.main.setViewport(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        // 1. Calculate Base Scale (Background covers screen)
        // This ensures the background always fills the view
        const bgScaleX = width / this.bg.width;
        const bgScaleY = height / this.bg.height;
        const baseScale = Math.max(bgScaleX, bgScaleY);

        // 2. Apply Scales
        // BG: Always Cover
        this.bg.setPosition(cx, cy).setScale(baseScale);

        // Mid: Base Scale * Multiplier (Adjustable) + Offsets
        const midX = cx + this.midOffsetX;
        const midY = cy + this.midOffsetY;
        this.mid.setPosition(midX, midY).setScale(baseScale * this.midSizeMult);

        // Fg: Base Scale * Multiplier (Adjustable) + Offsets
        const fgX = cx + this.fgOffsetX;
        const fgY = cy + this.fgOffsetY;
        this.fg.setPosition(fgX, fgY).setScale(baseScale * this.fgSizeMult);

        // Update centers for Parallax loop
        this.bgC = { x: cx, y: cy };
        this.midC = { x: midX, y: midY };
        this.fgC = { x: fgX, y: fgY };
    }

    update(time, delta) {
        const sine = Math.sin(time * this.loopSpeed);
        const cosine = Math.cos(time * this.loopSpeed);

        this.bg.x = this.bgC.x + (sine * this.bgAmpX);
        this.bg.y = this.bgC.y + (cosine * this.bgAmpY);

        this.mid.x = this.midC.x + (sine * this.midAmpX);
        this.mid.y = this.midC.y + (cosine * this.midAmpY);

        this.fg.x = this.fgC.x + (sine * this.fgAmpX);
        this.fg.y = this.fgC.y + (cosine * this.fgAmpY);
    }
}
