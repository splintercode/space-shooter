﻿(function() {
    'use strict';

    const CANVAS_WIDTH = 720;
    const CANVAS_HEIGHT = 480;
    const SHIP_SPEED = 4;
    const GAME_STATE = {
        START: 'START',
        PLAY: 'PLAY',
        PAUSE: 'PAUSE',
        OVER: 'OVER'
    };

    // Global Dependencies
    let Howl = window.Howl;
    let ENGINE = window.ENGINE;

    let gameScore = 0;
    let gameLives = 3;
    let canvas = document.getElementById('GameCanvas');
    let ctx = canvas.getContext('2d');
    let gameState = GAME_STATE.START;

    $('#GameCanvas').attr('width', CANVAS_WIDTH).attr('height', CANVAS_HEIGHT);

    class Ship {
        constructor(properties) {
            this._lasers = properties.lasers;

            this.settings = {
                color: 'rgba(0, 0, 0, 1)',
                posX: 25,
                posY: 350,
                height: 25,
                width: 25
            };

            this.img = new Image();
            this.img.src = 'App/Content/Images/spaceship.png';
            this.img.onload = function() {
                ctx.drawImage(this.img, this.settings.posX, this.settings.posY);
            }.bind(this);
        }

        draw() {
            ctx.drawImage(this.img, this.settings.posX, this.settings.posY);

            this._lasers.draw();
        }

        update() {
            this._lasers.update();

            let checkShipCollision = function() {
                let ship = this;
                asteroids.asteroidList.forEach(_checkShipCollision);

                function _checkShipCollision(asteroid, index) {
                    if (ENGINE.util.checkCollision(ship, asteroid)) {
                        asteroids.asteroidList.splice(index, 1);
                        removeLife();
                    }
                }
            }.bind(this);

            checkShipCollision();
        }

        fire() {
            this._lasers.fire(this.settings.posX + 23, this.settings.posY - 5);
        }

        moveLeft() {
            if (this.settings.posX > 0) {
                this.settings.posX = this.settings.posX - SHIP_SPEED;
            }
        }

        moveRight() {
            if (this.settings.posX + this.settings.width < CANVAS_WIDTH + 70) {
                this.settings.posX = this.settings.posX + SHIP_SPEED;
            }
        }

        moveUp() {
            if (this.settings.posY > 0) {
                this.settings.posY = this.settings.posY - SHIP_SPEED;
            }
        }

        moveDown() {
            if (this.settings.posY < CANVAS_HEIGHT - 40) {
                this.settings.posY = this.settings.posY + SHIP_SPEED;
            }
        }
    }

    class Laser {
        constructor (orginX, orginY) {
            this.settings = {
                posX: orginX,
                posY: orginY,
                width: 4.5,
                height: 25
            };
        }
        draw() {
            ctx.beginPath();
            ctx.fillStyle = ENGINE.util.getRandomColor();
            ctx.arc(this.settings.posX, this.settings.posY, this.settings.width, this.settings.height, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();
        }

        update() {
            this.settings.posY -= 5.05;
        }

        playSound() {
            let sound = new Howl({
                urls: ['App/Content/Audio/laser.mp3']
            });

            sound.play();
        }
    }

    //region LaserCollection
    function LaserCollection() {
        this.maxLasers = 10;
        this.laserList = [];
    }

    LaserCollection.prototype.update = function() {
        let checkLaserCollision = function(laser, laserIndex) {
            // For every asteroid
            for (let i = 0; i < asteroids.asteroidList.length; i++) {
                if (ENGINE.util.checkCollision(laser, asteroids.asteroidList[i])) {
                    this.laserList.splice(laserIndex, 1);
                    asteroids.asteroidList.splice(i, 1);
                    addScore();
                    return 0;
                }
            }
        }.bind(this);

        let updateLaser = function(laser, index) {
            this.laserList[index].update();
        }.bind(this);

        let checkLaserBounds = function(laser, index) {
            if (this.laserList[index].settings.posY < -5) {
                this.laserList.shift(); // If laser outside of top bounds remove from array
            }
        }.bind(this);

        this.laserList.forEach(checkLaserCollision);
        this.laserList.forEach(checkLaserBounds);
        this.laserList.forEach(updateLaser);
    };

    LaserCollection.prototype.draw = function() {
        let draw = function(laser) {
            laser.draw();
        };

        this.laserList.forEach(draw);
    };

    LaserCollection.prototype.fire = function(posX, posY) {
        if (this.laserList.length < this.maxLasers) {
            let laser = new Laser(posX, posY);
            laser.playSound();
            this.laserList.push(laser);
        }
    };
    //endregion

    //region Asteroid
    function Asteroid() {
        let range = ENGINE.util.getRandomNumber(30, 100);

        this.settings = {
            width: range,
            height: range,
            posX: ENGINE.util.getRandomNumber(0 - this.settings.height, CANVAS_WIDTH),
            posY: (this.settings.height * -2),
            speed: ENGINE.util.getRandomNumber(2, 6)
        };

        this.img = new Image();
        this.img.src = 'App/Content/Images/asteroid-' + ENGINE.util.getRandomNumber(1, 4) + '.png';
        this.img.onload = function() {
            ctx.drawImage(this.img, this.settings.posX, this.settings.posY);
        }.bind(this);
    }

    Asteroid.prototype = ENGINE.factory.createGameObject();

    Asteroid.prototype.constructor = Asteroid;

    Asteroid.prototype.draw = function() {
        ctx.drawImage(this.img, this.settings.posX, this.settings.posY, this.settings.width, this.settings.height);
    };

    Asteroid.prototype.update = function() {
        this.settings.posY += this.settings.speed;
    };
    //endregion

    //region AsteroidCollection
    function AsteroidCollection() {
        this.asteroidList = [];

        setInterval(function() {
            if (gameState === GAME_STATE.PLAY) {
                let asteroid = new Asteroid();
                this.asteroidList.push(asteroid);
            }
        }.bind(this), 140 - (CANVAS_WIDTH / 100));
    }

    AsteroidCollection.prototype.constructor = AsteroidCollection;

    AsteroidCollection.prototype.update = function() {
        let checkAsteroidBounds = function(asteroid, index) {
            if (asteroid.settings.posY > CANVAS_HEIGHT + 30) {
                this.asteroidList.splice(index, 1);
            }
        }.bind(this);

        let update = function(asteroid) {
            asteroid.update();
        };

        this.asteroidList.forEach(checkAsteroidBounds);
        this.asteroidList.forEach(update);
    };

    AsteroidCollection.prototype.draw = function() {
        let draw = function(asteroid) {
            asteroid.draw();
        };

        this.asteroidList.forEach(draw);
    };
    // endregion

    // Game Object Creation
    let playerShip = new Ship({
        lasers: new LaserCollection()
    });

    let asteroids = new AsteroidCollection();

    let game = (function() {
        return {
            draw: function() {
                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                drawScore();
                drawLives();

                if (gameState === GAME_STATE.START) {
                    drawStartScreen();
                }

                if (gameState === GAME_STATE.PLAY) {
                    playerShip.draw();
                    asteroids.draw();
                }

                if (gameState === GAME_STATE.PAUSE) {
                    return;
                }

                if (gameState === GAME_STATE.OVER) {
                    endGame();
                }
            },

            update: function() {
                ENGINE.update();

                if (gameState === GAME_STATE.START) {
                    return;
                }

                if (gameState === GAME_STATE.PLAY) {
                    asteroids.update();
                    playerShip.update();
                }

                if (gameState === GAME_STATE.PAUSE) {
                    return;
                }

                if (gameState === GAME_STATE.OVER) {
                    return;
                }
            }
        };
    }());

    //region Main (Game loop)
    function gameLoop() {
        game.draw();
        game.update();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
    //endregion

    //region Game Controls
    ENGINE.controls.on('left', function() {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveLeft();
        }
    });

    ENGINE.controls.on('right', function() {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveRight();
        }
    });

    ENGINE.controls.on('up', function() {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveUp();
        }
    });

    ENGINE.controls.on('down', function() {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveDown();
        }
    });

    ENGINE.controls.onkey('space', function() {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.fire();
        }
    });

    ENGINE.controls.onkey('pause', function() {
        pauseGame();
    });

    ENGINE.controls.onkey('enter', function() {
        if (gameState === GAME_STATE.START || gameState === GAME_STATE.OVER) {
            startNewGame();
        }
    });
    //endregion

    //region Helper Functions
    function drawStartScreen() {
        $('.js-start-screen').show();
    }

    function hideStartScreen() {
        $('.js-start-screen').hide();
    }

    function startNewGame() {
        gameLives = 3;
        gameState = GAME_STATE.PLAY;
        gameScore = 0;
        hideStartScreen();
        $('.js-game-over-screen').hide();
    }

    function pauseGame() {
        drawPauseScreen();

        if (gameState === GAME_STATE.PLAY) {
            gameState = GAME_STATE.PAUSE;
        } else {
            gameState = GAME_STATE.PLAY;
        }
    }

    function drawPauseScreen() {
        $('.js-pause-screen').toggle();
    }

    function endGame() {
        $('.js-game-over-screen').show();
    }

    function addScore() {
        gameScore += 1;
    }

    function drawScore() {
        $('.js-score').html('Score:' + gameScore);
    }

    function removeLife() {
        if (gameLives > 0) {
            gameLives -= 1;
        } else {
            gameState = GAME_STATE.OVER;
        }
    }

    function drawLives() {
        $('.js-lives').html('Lives:' + gameLives);
    }
    //endregion
}());