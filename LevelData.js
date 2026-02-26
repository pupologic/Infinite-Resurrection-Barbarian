// Level Configuration
// You can manually design levels here.
// Set 'isProcedural: false' to use the manual data defined in 'enemies', 'obstacles', etc.
// If 'isProcedural: true', the game will generate the level randomly based on difficulty.

window.LevelManifest = {
    0: {
        isProcedural: false,
        playerStart: { x: 0, y: 800 },
        portal: { x: 0, y: -850 },
        rooms: [
            { x: 0, y: -850, w: 5, h: 5, keyId: 'KEY_TUTORIAL', addChest: false, addGuards: false }
        ],
        enemies: [
            { type: 'melee', x: 0, y: 400 },
            { type: 'melee', x: -150, y: 200 },
            { type: 'ranged', x: 0, y: -200 }
        ],
        obstacles: [
            { x: -150, y: 600, type: 'rock' },
            { x: 150, y: 500, type: 'rock' },
            { x: -200, y: -400, type: 'rock' }
        ],
        interactables: [
            // Chest containing the key needed for the door (Placed outside the room)
            { type: 'chest', x: 200, y: -500, loot: 'KEY', value: 'KEY_TUTORIAL', direction: 'down', extraDrops: ['HEALTH', 'STAMINA'] }
        ],
        traps: [
            { x: -100, y: 50 },
            { x: 100, y: 50 }
        ]
    },
    1: {
        isProcedural: false,
        groundBounds: { startX: -800, startY: -600, endX: 800, endY: 1000 },
        playerStart: { x: 0, y: 800 },
        enemies: [
            // Corridors (Green dots -> Vampbats & SkullBugs)
            { type: 'vambat', x: -500, y: 300 },
            { type: 'skullbug', x: -450, y: -300 },
            { type: 'vambat', x: 500, y: 300 },
            { type: 'skullbug', x: 450, y: -300 },
            { type: 'vambat', x: 0, y: -350 },
            { type: 'skullbug', x: -250, y: 350 },
            { type: 'skullbug', x: 250, y: 350 },
            // Demon Imps (Red dots)
            { type: 'ranged', x: -550, y: 0 },
            { type: 'ranged', x: 550, y: 0 },
            // Skeletons (Gray dots in island)
            { type: 'skeleton', x: -100, y: -50 },
            { type: 'skeleton', x: 100, y: -50 }
        ],
        obstacles: [
            // Random rocks for flavor
            { x: -500, y: 200, type: 'rock' },
            { x: 500, y: -200, type: 'rock' }
        ],
        interactables: [
            // Blue box: Chest "up"
            { type: 'chest', x: 0, y: 0, loot: 'HEALTH', direction: 'up', extraDrops: ['STAMINA', 'COIN'] }
        ],
        portal: { x: 0, y: 100 }, // Purple ball
        walls: (() => {
            const w = [];
            const addRect = (x, y, tw, th, frames, gapBottom = false) => {
                // Simplified rect helper for level design
                for (let i = 0; i < tw; i++) {
                    w.push({ x: x + i * 64, y: y, frame: frames[1] }); // Top
                    if (!gapBottom || (i < Math.floor(tw / 2) - 1 || i > Math.floor(tw / 2) + 1)) {
                        w.push({ x: x + i * 64, y: y + (th - 1) * 64, frame: frames[7] }); // Bottom
                    }
                }
                for (let i = 0; i < th; i++) {
                    w.push({ x: x, y: y + i * 64, frame: frames[3] }); // Left
                    w.push({ x: x + (tw - 1) * 64, y: y + i * 64, frame: frames[5] }); // Right
                }
                // Corners
                w.push({ x: x, y: y, frame: frames[0] });
                w.push({ x: x + (tw - 1) * 64, y: y, frame: frames[2] });
                w.push({ x: x, y: y + (th - 1) * 64, frame: frames[6] });
                w.push({ x: x + (tw - 1) * 64, y: y + (th - 1) * 64, frame: frames[8] });
            };

            // Outer Bounds (Aesthetics) - Gap at bottom for tail
            addRect(-640, -448, 21, 15, [0, 1, 2, 3, 4, 5, 6, 7, 8], true);

            // Inner Hole (Reversed frames to face inwards)
            addRect(-224, -160, 8, 6, [8, 7, 6, 5, 4, 3, 2, 1, 0]);

            // Central Island (facing outwards)
            addRect(-128, -96, 5, 4, [0, 1, 2, 3, 4, 5, 6, 7, 8]);

            // Tail Walls
            for (let ty = 512; ty <= 832; ty += 64) {
                w.push({ x: -96, y: ty, frame: 3 });
                w.push({ x: 96, y: ty, frame: 5 });
            }
            w.push({ x: -96, y: 832, frame: 6 });
            w.push({ x: 96, y: 832, frame: 8 });
            for (let tx = -32; tx <= 32; tx += 64) w.push({ x: tx, y: 832, frame: 7 });

            return w;
        })()
    },
    2: {
        isProcedural: true,
        enemies: [],
        obstacles: [],
        interactables: [],
        portal: null
    },
    3: {
        isProcedural: true,
        enemies: [],
        obstacles: [],
        interactables: [],
        portal: null
    },
    4: {
        isProcedural: true,
        enemies: [],
        obstacles: [],
        interactables: [],
        portal: null
    },
    5: {
        isProcedural: true,
        enemies: [],
        obstacles: [],
        interactables: [],
        portal: null
    }
};
