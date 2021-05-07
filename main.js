/*********************/
/* The Alien Invader */
/*   2021, Cabal_se  */
/*********************/

const MAJOR_FRAMES = 70;
const ENEMY_Y_SPEED = 10;
const ENEMY_X_SPEED = 1;

const RIGHT = 1;
const LEFT = -1;
const NO = 0;

function startGame() {
    game.gamePieces.player = new component("player", 30, 30, "blue", 385, 560, 0, 0);
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            let x = (160 * col) + 30;
            let y = (50 * row) + 30;
            game.gamePieces.enemies.push(new component("enemy", 100, 30, "red", x, y, -ENEMY_X_SPEED, 0));
        }
    }
    game.init();
    window.requestAnimationFrame(update);
}

var game = {
    majorFrames: 0,
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
        this.canvas.addEventListener('click', this.onClick, false);
        document.addEventListener('keydown', this.onKeyDown, false);
        document.addEventListener('keyup', this.onKeyUp, false);
        this.end = false;
    },
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
    collision: function () {
        /* Player vs Enemies */
        this.gamePieces.enemies.forEach(enemy => {
            if (!enemy.killed) {
                if (isObjectColliding(this.gamePieces.player, enemy)) {
                    this.gamePieces.player.killed = true;
                    this.end = true;
                }
            }
        });
        /* Missiles vs Edge */
        this.gamePieces.missiles.forEach(missile => {
            if (missile.y <= 0 || missile.y >= this.canvas.height) {
                missile.killed = true;
            }
        });
        /* Missiles vs Player */
        this.gamePieces.missiles.forEach(missile => {
            if (isObjectColliding(this.gamePieces.player, missile) && !missile.killed) {
                this.gamePieces.player.killed = true;
                missile.killed = true;
                this.end = true;
            }
        });
        /* Missile vs Enemy */
        this.gamePieces.enemies.forEach(enemy => {
            if (!enemy.killed) {
                this.gamePieces.missiles.forEach(missile => {
                    if (isObjectColliding(enemy, missile) && !missile.killed) {
                        enemy.killed = true;
                        missile.killed = true;
                    }
                });
            }
        });
    },
    cleanUpPieces: function () {
        this.gamePieces.missiles = this.gamePieces.missiles.filter(items => !items.killed);
        this.gamePieces.enemies = this.gamePieces.enemies.filter(items => !items.killed);
    },
    countFrames: function () {
        this.majorFrames += 1;
        if (this.majorFrames > MAJOR_FRAMES) this.majorFrames = 0;
    },
    update: function () {
        this.countFrames();
        enemyMovement();
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
}

function isObjectAtGameSideEdges(obj, canvas) {
    if (obj.x + obj.width >= canvas.width) {
        return RIGHT;
    } else if (obj.x <= 0) {
        return LEFT;
    }
    return NO;
}

function enemyMovement() {
    let atEdge = NO;

    game.gamePieces.enemies.forEach(enemy => {
        let isAtEdge = isObjectAtGameSideEdges(enemy, game.canvas)
        if (isAtEdge != NO) atEdge = isAtEdge;
    });

    game.gamePieces.enemies.forEach(enemy => {
        if (atEdge != NO) {
            if (atEdge === RIGHT) enemy.dx = -ENEMY_X_SPEED;
            if (atEdge === LEFT) enemy.dx = ENEMY_X_SPEED;
        }
        if (game.majorFrames === 0) {
            enemy.dy = ENEMY_Y_SPEED;
        } else {
            enemy.dy = 0;
        }
    })
}

function isObjectColliding(objA, objB) {
    let x_overlap = Math.max(0, Math.min(objA.x + objA.width, objB.x + objB.width) - Math.max(objA.x, objB.x));
    let y_overlap = Math.max(0, Math.min(objA.y + objA.height, objB.y + objB.height) - Math.max(objA.y, objB.y));
    let overlapArea = x_overlap * y_overlap;
    return overlapArea > 0;
}

function playerWonTheGame() {
    if (game.gamePieces.enemies.length === 0) {
        game.end = true;
    }
}

function update() {
    game.update();
    game.draw();
    playerWonTheGame();
    if (!game.end) {
        window.requestAnimationFrame(update);
    } else {
        alert("GAME OVER")
    }
}

function component(name, width, height, color, x, y, dx, dy) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.killed = false;
    this.fire = function () {
        if (this.name === "player") {
            game.gamePieces.missiles.push(new component("missile", 5, 25, "green", this.x + this.width / 2, this.y - 26, 0, -5));
        }
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
}

startGame();