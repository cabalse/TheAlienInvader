/*********************/
/* The Alien Invader */
/*   2021, Cabal_se  */
/*********************/

/* Speeds */
var ENEMY_Y_SPEED = 5;
var ENEMY_X_SPEED = 1;
const MISSILE_SPEED = 5;

/* Controlls */
const RIGHT = 1;
const LEFT = -1;
const NO = 0;

/* Player Constants */
const PLAYER_MAX_MISSILES = 3;

/* Enemy Constants */
const CHANCE_OF_ENEMY_FIRE = 5; // 1 to 10
const MAX_FIRING_ENEMIES = 3;
const FRAMES_BETWEEN_FIRE = 15;
var FRAMES_BEFORE_MOVING_DOWN = 200;

function startGame() {
    game.gamePieces.player = new component("player", 0, 30, 30, "blue", 385, 560, 0, 0, undefined);
    let id = 1;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            let x = (160 * col) + 30;
            let y = (50 * row) + 30;
            game.gamePieces.enemies.push(new component("enemy", id, 100, 30, "red", x, y, -ENEMY_X_SPEED, 0, undefined));
            id += 1;
        }
    }
    game.init();
    window.requestAnimationFrame(update);
}

var game = {
    score: 0,
    frameCount: 0,
    canvas: document.createElement("canvas"),
    gamePieces: {
        player: null,
        missiles: [],
        enemies: [],
    },
    init: function () {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.canvas.addEventListener('click', this.input.onClick, false);
        document.addEventListener('keydown', this.input.onKeyDown, false);
        document.addEventListener('keyup', this.input.onKeyUp, false);
        this.end = false;
    },
    input: {
        onClick: function (event) {
            game.gamePieces.player.fire();
        },
        onKeyDown: function (event) {
            switch (event.keyCode) {
                case 65:
                    game.gamePieces.player.dx = -2;
                    break;
                case 68:
                    game.gamePieces.player.dx = 2;
                    break;
            }
        },
        onKeyUp: function (event) {
            switch (event.keyCode) {
                case 65:
                    game.gamePieces.player.dx = 0;
                    break;
                case 68:
                    game.gamePieces.player.dx = 0;
                    break;
            }
        },
    },
    collision: function () {
        /* Player vs Enemies */
        this.gamePieces.enemies.forEach(enemy => {
            if (!enemy.killed) {
                if (collisionUtils.isObjectColliding(this.gamePieces.player, enemy)) {
                    this.gamePieces.player.kill();
                    this.end = true;
                }
            }
        });
        /* Missiles vs Edge */
        this.gamePieces.missiles.forEach(missile => {
            if (missile.y <= 0 || missile.y >= this.canvas.height) {
                missile.kill();
            }
        });
        /* Missiles vs Player */
        this.gamePieces.missiles.forEach(missile => {
            if (collisionUtils.isObjectColliding(this.gamePieces.player, missile) && !missile.killed) {
                this.gamePieces.player.kill();
                missile.kill();
                this.end = true;
            }
        });
        /* Missile vs Enemy */
        this.gamePieces.enemies.forEach(enemy => {
            if (!enemy.killed) {
                this.gamePieces.missiles.forEach(missile => {
                    if (collisionUtils.isObjectColliding(enemy, missile) && !missile.killed) {
                        enemy.kill();
                        missile.kill();
                    }
                });
            }
        });
        /* Enemy vs Bottom edge */
        this.gamePieces.enemies.forEach(enemy => {
            if (enemy.y >= game.canvas.height) enemy.kill();
        });
    },
    cleanUpPieces: function () {
        this.gamePieces.missiles = this.gamePieces.missiles.filter(items => !items.killed);
        this.gamePieces.enemies = this.gamePieces.enemies.filter(items => !items.killed);
    },
    countFrames: function () {
        this.frameCount += 1;
    },
    update: function () {
        this.countFrames();
        enemyAI.enemyMovement();
        enemyAI.enemyFire();
        this.gamePieces.enemies.forEach(piece => {
            piece.update();
        });
        this.gamePieces.missiles.forEach(piece => {
            piece.update();
        });
        this.gamePieces.player.update();
        this.collision();
        this.cleanUpPieces();
    },
    draw: function () {
        this.clear();
        this.gamePieces.enemies.forEach(piece => {
            piece.draw();
        });
        this.gamePieces.missiles.forEach(piece => {
            piece.draw();
        });
        this.gamePieces.player.draw();
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawText: function (text) {
        this.context.font = "50px Arial";
        this.context.fillStyle = "black";
        this.context.textBaseline = 'middle';
        this.context.textAlign = 'center';
        this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    }
}

var collisionUtils = {
    isObjectAtGameSideEdges: function (obj, canvas) {
        if (obj.x + obj.width >= canvas.width) {
            return RIGHT;
        } else if (obj.x <= 0) {
            return LEFT;
        }
        return NO;
    },
    isObjectColliding: function (objA, objB) {
        let x_overlap = Math.max(0, Math.min(objA.x + objA.width, objB.x + objB.width) - Math.max(objA.x, objB.x));
        let y_overlap = Math.max(0, Math.min(objA.y + objA.height, objB.y + objB.height) - Math.max(objA.y, objB.y));
        let overlapArea = x_overlap * y_overlap;
        return overlapArea > 0;
    }
}

var player = {
    missiledFired: 0,
    canPlayerFireMissile: function () {
        return this.missiledFired < PLAYER_MAX_MISSILES;
    },
    playerFiredMissile: function () {
        this.missiledFired += 1;
    },
    playerMissiledDestroyed: function () {
        this.missiledFired -= 1;
        if (this.missiledFired < 0) this.missiledFired = 0;
    }
}

var enemyAI = {
    enemiesFired: 0,
    lastFrameFiredOn: 0,
    lastFrameMovedDown: FRAMES_BEFORE_MOVING_DOWN,
    lowerEnemies: function () {
        let cols = [];
        let ret = [];
        game.gamePieces.enemies.forEach(enemy => {
            let col = cols.filter(col => {
                if (col) {
                    if (col.x === enemy.x) {
                        return true;
                    }
                }
                return false;
            })
            if (col.length > 0) {
                col[0].enemies.push(enemy);
            } else {
                cols.push({
                    x: enemy.x,
                    enemies: [enemy]
                })
            }
        });
        cols.forEach(col => {
            let y = 0;
            let lowestEnemy = null;
            col.enemies.forEach(enemy => {
                if (enemy.y > y) {
                    lowestEnemy = enemy;
                    y = enemy.y;
                }
            });
            ret.push(lowestEnemy);
        })
        return ret;
    },
    firedMissile: function (id) {
        let missiles = game.gamePieces.missiles.filter(missile => missile.id === id);
        return missiles.length;
    },
    enemyFire: function () {
        let lowest = enemyAI.lowerEnemies();
        lowest.forEach(enemy => {
            if (rnd(10) <= CHANCE_OF_ENEMY_FIRE &&
                this.enemiesFired <= MAX_FIRING_ENEMIES &&
                this.firedMissile(enemy.id) === 0 &&
                this.lastFrameFiredOn + FRAMES_BETWEEN_FIRE < game.frameCount) {
                enemy.fire();
                this.enemiesFired += 1;
                this.lastFrameFiredOn = game.frameCount;
            }
        })
    },
    enemyMissiledDestroyed: function () {
        this.enemiesFired -= 1;
        if (this.enemiesFired < 0) this.enemiesFired = 0;
    },
    enemyMovement: function () {
        let atEdge = NO;

        game.gamePieces.enemies.forEach(enemy => {
            let isAtEdge = collisionUtils.isObjectAtGameSideEdges(enemy, game.canvas)
            if (isAtEdge != NO) atEdge = isAtEdge;
        });

        game.gamePieces.enemies.forEach(enemy => {
            if (atEdge != NO) {
                if (atEdge === RIGHT) enemy.dx = -ENEMY_X_SPEED;
                if (atEdge === LEFT) enemy.dx = ENEMY_X_SPEED;
            }
        });

        if (this.lastFrameMovedDown + FRAMES_BEFORE_MOVING_DOWN < game.frameCount) {
            game.gamePieces.enemies.forEach(enemy => {
                enemy.dy = ENEMY_Y_SPEED;
                this.lastFrameMovedDown = game.frameCount;

            });
            /* Increase speed */
            ENEMY_X_SPEED += 1;
            FRAMES_BEFORE_MOVING_DOWN -= 6;
        } else {
            game.gamePieces.enemies.forEach(enemy => {
                enemy.dy = 0;
            });
        }
    }
}

/* Util Functions */

function rnd(max) {
    return Math.floor(Math.random() * max) + 1;
}

function playerWonTheGame() {
    if (game.gamePieces.enemies.length === 0) {
        game.end = true;
    }
}

/* Game Loop */

function update() {
    game.update();
    game.draw();
    playerWonTheGame();
    if (!game.end) {
        window.requestAnimationFrame(update);
    } else {
        /* It's Game Over */
        game.drawText("GAME OVER");
    }
}

/* Game Component for Player, Enemy and Missiles */

function component(name, id, width, height, color, x, y, dx, dy, callBackOnKilled) {
    this.name = name;
    this.id = id;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.killed = false;
    this.callBackOnKilled = callBackOnKilled;
    this.fire = function () {
        let missile = undefined;
        if (this.name === "player" && player.canPlayerFireMissile()) {
            missile = new component(
                "missile", 0,
                5, 25, "green",
                this.x + this.width / 2, this.y - 26,
                0, -MISSILE_SPEED,
                function () {
                    player.playerMissiledDestroyed();
                });
            player.playerFiredMissile();
        } else if (this.name === "enemy") {
            missile = new component(
                "missile", this.id,
                5, 25, "red",
                this.x + rnd(this.width), this.y + this.height + 1,
                0, MISSILE_SPEED,
                function () {
                    enemyAI.enemyMissiledDestroyed();
                });
        }
        if (missile) game.gamePieces.missiles.push(missile);
    }
    this.update = function () {
        this.x += this.dx;
        this.y += this.dy;
    };
    this.draw = function () {
        if (!this.killed) {
            let ctx = game.context;
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };
    this.kill = function () {
        this.killed = true;
        if (this.callBackOnKilled) this.callBackOnKilled();
    }
}

/* Start the Game */

startGame();