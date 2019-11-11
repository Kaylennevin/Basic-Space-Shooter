//// --------- GAME SCREEN ---------- ////
var canvas = document.getElementById("background");
var ctx = canvas.getContext("2d");
const GAME_WIDTH = 980;
const GAME_HEIGHT = 800;
ctx.imageSmoothingEnabled = false;


var game = new Game();

function init() {
    if (game.init())
        game.start();
}


/*
Defining an object to hold all the images so that the images
are only drawn once. 
*/
var imageRepo = new function () {
    this.background = new Image();
    this.spaceship = new Image();
    this.bullet = new Image();
    this.enemyBullet = new Image();
    this.enemy = new Image();

    var numImages = 5;
    var numLoaded = 0;
    /* 
     * function to determine if all the game assets have been loaded
     * if they are all loaded then initialize the game
     */
    function imageLoaded() {
        numLoaded++;
        if (numLoaded === numImages) {
            window.init();
        }
    }

    this.background.onload = function () {
        imageLoaded();
    }

    this.spaceship.onload = function () {
        imageLoaded();
    }

    this.bullet.onload = function () {
        imageLoaded();
    }

    this.enemy.onload = function () {
        imageLoaded();
    }

    this.enemyBullet.onload = function () {
        imageLoaded();
    }



    this.background.src = "images/background.png";
    this.spaceship.src = "images/shipPlayer2.png";
    this.bullet.src = "images/bulletPlayer.png";
    this.enemy.src = "images/enemy.png";
    this.enemyBullet.src = "images/bulletEnemy.png";


}

/* ------ ABSTRACT OBJECT ------
 * This is an abtract object which means that all
 * the other objects will inherit from it. This means not duplicating code
 * for multiple objects that require the same variables and functions.
 */
function Drawable() {
    this.init = function (x, y, width, height) {
        /* init allows me to set the x and y position of an object
         * once it has been created. Defines the speed of an object.
         */
        //default variables

        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;
    }
    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.collidableWith = "";
    this.isColliding = false;
    this.type = "";

    this.draw = function () {

    };
    this.move = function () {

    };

    this.isCollidableWith = function (object) {
        return (this.collidableWith === object.type);
    };
}


/* ------ GAME OBJECT ------
 * game object that will hold all the objects and data for the game
 */
function Game() {
    // gets the canvas and context information and sets up all the game objects
    this.init = function () {
        // get the canvas elements
        this.bgCanvas = document.getElementById("background");
        this.shipCanvas = document.getElementById("ship");
        this.mainCanvas = document.getElementById("main");
        // checks to see if the canvas is supported
        if (this.bgCanvas.getContext) {

            this.bgContext = this.bgCanvas.getContext("2d");
            this.shipContext = this.shipCanvas.getContext("2d");
            this.mainContext = this.mainCanvas.getContext("2d");
            // initialize objects to contain their conetext and canvas information
            Background.prototype.context = this.bgContext;
            Background.prototype.canvasWidth = this.bgCanvas.width;
            Background.prototype.canvasHeight = this.bgCanvas.height;

            Ship.prototype.context = this.shipContext;
            Ship.prototype.canvasWidth = this.shipCanvas.width;
            Ship.prototype.canvasHeight = this.shipCanvas.height;

            Bullet.prototype.context = this.mainContext;
            Bullet.prototype.canvasWidth = this.mainCanvas.width;
            Bullet.prototype.canvasHeight = this.mainCanvas.height;

            Enemy.prototype.context = this.mainContext;
            Enemy.prototype.canvasWidth = this.mainCanvas.width;
            Enemy.prototype.canvasHeight = this.mainCanvas.height;

            this.playerScore = 0;

            //initialize the background object
            this.background = new Background();
            this.background.init(0, 0); //set the draw point to 0,0
            //initialize the ship object
            this.ship = new Ship();
            //set the ship to start middle bottom
            var shipStartX = this.shipCanvas.width / 2 - imageRepo.spaceship.width;
            var shipStartY = this.shipCanvas.height / 4 * 3 + imageRepo.spaceship.height * 2;
            this.ship.init(shipStartX, shipStartY,
                imageRepo.spaceship.width, imageRepo.spaceship.height);

            // initialize the enemy pool object
            this.enemyPool = new Pool(36);
            this.enemyPool.init("enemy");
            var height = imageRepo.enemy.height;
            var width = imageRepo.enemy.width;
            var x = 100;
            var y = -height;
            var spacer = y * 1.5;
            for (var i = 1; i <= 36; i++) {
                this.enemyPool.get(x, y, 2);
                x += width + 25;
                if (i % 12 == 0) {
                    x = 100;
                    y += spacer
                }
            }
            this.enemyBulletPool = new Pool(120);
            this.enemyBulletPool.init("enemyBullet");

            this.quadTree = new QuadTree({
                x: 0,
                y: 0,
                width: this.mainCanvas.width,
                height: this.mainCanvas.height
            });

            return true;
        } else {
            return false;
        }
    };

    // start the animation loop
    this.start = function () {
        this.ship.draw();
        animate();

    }
};


/* ------ ANIMATION LOOP ------
 * Global function
 * The animation loop calls teh requestAnimationFrame to optimize the game loop.
 * Draws all the game objects
 */
function animate() {

    // insert objects into quadtree
    game.quadTree.clear();
    game.quadTree.insert(game.ship);
    game.quadTree.insert(game.ship.bulletPool.getPool());
    game.quadTree.insert(game.enemyPool.getPool());
    game.quadTree.insert(game.enemyBulletPool.getPool());

    detectCollision();

    // Animate game objects
    requestAnimFrame(animate);
    game.background.draw();
    game.ship.move();
    game.ship.bulletPool.animate();
    game.enemyPool.animate();
    game.enemyBulletPool.animate();

    document.getElementById("score").innerHTML = game.playerScore;
}





/// ------ OBJECT POOL ------
/* 
 * When the pool is initalized, it populates an array with empty bullet objects
 * which will then be reused every time a bullet is created.
 * When the a new bullet is needed for the pool, the last item in the array is checked
 * to see if its currently in use . If it is in use then no more bullets can be spawned
 * as the pool is full. If not in use then the pool spawns the last item in the array,
 * pops it from the back and pushes it to the front. Therefore free bullets are in the back
 * and used bullets are in the front of the array.
 */



// object pool to store bullet objects that can be managed
function Pool(maxSize) {
    var size = maxSize; // max bullet allowed in the pool
    var pool = [];

    this.getPool = function () {
        var obj = [];
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) {
                obj.push(pool[i]);
            }
        }
        return obj;
    }

    // populates the pool with bullet objects 
    this.init = function (object) {
        if (object == "bullet") {
            for (var i = 0; i < size; i++) {
                //initalize the bullet object
                var bullet = new Bullet("bullet");
                bullet.init(0, 0, imageRepo.bullet.width, imageRepo.bullet.height);

                bullet.collidableWith = "enemy";
                bullet.type = "bullet";

                pool[i] = bullet;

            }
        } else if (object == "enemy") {
            for (var i = 0; i < size; i++) {
                var enemy = new Enemy();
                enemy.init(0, 0, imageRepo.enemy.width, imageRepo.enemy.height);
                pool[i] = enemy;
            }
        } else if (object == "enemyBullet") {
            for (var i = 0; i < size; i++) {
                var bullet = new Bullet("enemyBullet");
                bullet.init(0, 0, imageRepo.enemyBullet.width, imageRepo.enemyBullet.height);

                bullet.collidableWith = "ship";
                bullet.type = "enemyBullet";

                pool[i] = bullet;
            }
        }


    };



    // grabs the last item in the list, initalizes it, and pushes it to the front of the array 
    this.get = function (x, y, speed) {
        if (!pool[size - 1].alive) {
            pool[size - 1].spawn(x, y, speed);
            pool.unshift(pool.pop());
        }
    };

    /*
     * used for the ship to get two bullets at once.
     * If only the get() function is used twice, the ship is able to fire
     * and only have 1 bullet spawn instead of 2
     */
    this.getTwo = function (x1, y1, speed1, x2, y2, speed2) {
        if (!pool[size - 1].alive &&
            !pool[size - 2].alive) {
            this.get(x1, y1, speed1);
            this.get(x2, y2, speed2);
        }
    };

    /*
     * draws any in use bullets, and if a bullet goes of the screen it clears it
     * then pushes it to the front of the array
     */

    this.animate = function () {
        for (var i = 0; i < size; i++) {
            // only draw until we find a bullet that is not alive
            if (pool[i].alive) {
                if (pool[i].draw()) {
                    pool[i].clear();
                    pool.push((pool.splice(i, 1))[0]);
                }
            } else
                break;
        }
    };
}
// ------ USER INPUT ------
KEY_CODES = {
    32: 'space',
    65: 'left',
    87: 'up',
    68: 'right',
    83: 'down',
}

KEY_STATUS = {};
for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = false;
}

document.onkeydown = function (e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
}


document.onkeyup = function (e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
}

// ------ PLAYER SHIP ------
/*
 * Creates a ship object that the player can control.
 * Drawn to the ship canvas, and uses dirty rectangles to
 * move around the screen.
 */

function Ship() {
    this.speed = 3;
    this.bulletPool = new Pool(30);
    this.bulletPool.init("bullet");

    var fireRate = 15;
    var counter = 0;

    this.collidableWith = "enemyBullet";
    this.type = "ship";

    this.draw = function () {
        this.context.drawImage(imageRepo.spaceship, this.x, this.y);
    };
    this.move = function () {
        counter++;
        //determine if the action is a move action
        if (KEY_STATUS.left || KEY_STATUS.right ||
            KEY_STATUS.down || KEY_STATUS.up) {
            // The ship moved so, erase the current image and redraw to new location
            this.context.clearRect(this.x, this.y, this.width, this.height);
            // Update x and y position according to the direction of movement and redraw the ship.
            // can change the else if to ifs to add diagonal movement
            if (KEY_STATUS.left) {
                this.x -= this.speed
                if (this.x <= 0) // keep the player on the screen
                    this.x = 0;
            } else if (KEY_STATUS.right) {
                this.x += this.speed
                if (this.x >= this.canvasWidth - this.width)
                    this.x = this.canvasWidth - this.width;
            } else if (KEY_STATUS.up) {
                this.y -= this.speed
                if (this.y <= this.canvasHeight / 4 * 3)
                    this.y = this.canvasHeight / 4 * 3;
            } else if (KEY_STATUS.down) {
                this.y += this.speed
                if (this.y >= this.canvasHeight - this.height)
                    this.y = this.canvasHeight - this.height;
            }
            //finish by redrawing the ship
            if (!this.isColliding) {
                this.draw();
            }
        }
        if (KEY_STATUS.space && counter >= fireRate && !this.isColliding) {
            this.fire();
            counter = 0;
        }
    };
    // fires two bullets
    this.fire = function () {
        this.bulletPool.getTwo(this.x - 3, this.y, 3, this.x + 32, this.y, 3);
    };
}
Ship.prototype = new Drawable();


// ------ ENEMIES ------

function Enemy() {
    var percentFire = 0.01;
    var chance = 0;
    this.alive = false;

    this.collidableWith = "bullet";
    this.type = "enemy";

    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.speedX = 2;
        this.speedY = speed;
        this.alive = true;
        this.leftEdge = this.x - 90;
        this.rightEdge = this.x + 180;
        this.bottomEdge = this.y + 190;
    };

    this.draw = function () {
        this.context.clearRect(this.x - 1, this.y, this.width + 1, this.height);
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x <= this.leftEdge) {
            this.speedX = this.speed;
        } else if (this.x >= this.rightEdge + this.width) {
            this.speedX = -this.speed;
        } else if (this.y >= this.bottomEdge) {
            this.speed = 2;
            this.speedY = 0;
            this.y -= 5;
            this.speedX = -this.speed;
        }

        if (!this.isColliding) {
        this.context.drawImage(imageRepo.enemy, this.x, this.y);

        chance = Math.floor(Math.random() * 275);
        if (chance / 20 < percentFire) {
            this.fire();
        }
        return false;
     }
            else {
                game.playerScore += 45;
                return true;
            }
        
         

         
    };

    this.fire = function () {
        game.enemyBulletPool.get(this.x + this.width / 2, this.y + this.height, -5.5)
    }

    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.alive = false;
        this.isColliding = false;
    };

}

Enemy.prototype = new Drawable();

// ------ BULLET ------
// bullet object which the ship fires. The bullets are drawn on the "main" canvas

function Bullet(object) {
    this.alive = false; // is true if the bullet is currently in use
    var self = object;
    // sets the bullet value
    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.alive = true;
    };
    /*
     * uses a dirty rectangle to erase and move the bullet
     * returns true if the bullet has moved off the screen, indicating that
     * the bullet can now be cleared by the pool, if not then the bullet is drawn
     */
    this.draw = function () {
        this.context.clearRect(this.x - 1, this.y - 1, this.width + 1, this.height + 1);
        this.y -= this.speed;

        if (this.isColliding) {
            return true;
        } else if (self === "bullet" && this.y <= 0 - this.height) {
            return true;

        } else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
            return true;

        } else {

            if (self === "bullet") {
                this.context.drawImage(imageRepo.bullet, this.x, this.y);
            } else if (self === "enemyBullet") {
                this.context.drawImage(imageRepo.enemyBullet, this.x, this.y)
            }

            return false;
        }
    };
    // resets the bullet value
    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alive = false;
        this.isColliding = false;
    };

}
Bullet.prototype = new Drawable();

//------ SPATIAL PARTITIONING ------
function QuadTree(boundbox, lvl) {
    var maxObjects = 10;
    this.bounds = boundbox || {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
    var objects = [];
    this.nodes = [];
    var level = lvl || 0;
    var maxLevels = 5;
    //clears the quad tree and all objects

    this.clear = function () {
        objects = [];

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }

        this.nodes = [];

    };

    // get all objects in the quad tree

    this.getAllObjects = function (returnedObjects) {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].getAllObjects(returnedObjects);
        }

        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }

        return returnedObjects;

    };
    // return all objects that can collide

    this.findObjects = function (returnedObjects, obj) {
        if (typeof obj === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }

        var index = this.getIndex(obj);
        if (index != -1 && this.nodes.length) {
            this.nodes[index].findObjects(returnedObjects, obj);
        }

        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }
        return returnedObjects;
    };

    /*
   insert objects into the quad tree. If the tree goes beyond capacity, then
   all objects will be split into their corresponding nodes
 */
    this.insert = function (obj) {
        if (typeof obj === "undefined") {
            return;

        }

        if (obj instanceof Array) {
            for (var i = 0, len = obj.length; i < len; i++) {
                this.insert(obj[i]);
            }
            return;
        }

        if (this.nodes.length) {
            var index = this.getIndex(obj);
            // only add an object to the sub node if it can fit within one
            if (index != -1) {
                this.nodes[index].insert(obj);
                return;
            }
        }

        objects.push(obj);

        //prevent infinite splitting
        if (objects.length > maxObjects && level < maxLevels) {
            if (this.nodes[0] == null) {
                this.split();
            }
            var i = 0;
            while (i < objects.length) {
                var index = this.getIndex(objects[i]);
                if (index != -1) {
                    this.nodes[index].insert((objects.splice(i, 1))[0]);
                } else {
                    i++;
                }
            }
        }
    };

    /*
     * Determine which node the object belongs to. If -1 then
     * the object cannot completey fit within a node and is part 
     * of a current node
     */

    this.getIndex = function (obj) {
        var index = -1;
        var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
        // object can completely fit within the top quadrant
        var topQuadrant = (obj.y < horizontalMidpoint &&
            obj.y + obj.height < horizontalMidpoint);
        // object can fit completely within the bottom quadrant
        var bottomQuadrant = (obj.y > horizontalMidpoint);
        // object can fit completely within the left quadrant
        if (obj.x < verticalMidpoint &&
            obj.x + obj.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        }
        // object can completely fit within the right quadrants
        else if (obj.x > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    };

    // splits nodes into 4 sub nodes

    this.split = function () {
        var subWidth = (this.bounds.width / 2) | 0;
        var subHeight = (this.bounds.height / 2) | 0;
        this.nodes[0] = new QuadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[1] = new QuadTree({
            x: this.bounds.x,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[2] = new QuadTree({
            x: this.bounds.x,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[3] = new QuadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, level + 1);
    };

}

/// ------ DETECT COLLISIONS ------
function detectCollision() {
    var objects = [];
    game.quadTree.getAllObjects(objects);
    for (var x = 0, len = objects.length; x < len; x++) {
        game.quadTree.findObjects(obj = [], objects[x]);

        for (y = 0, length = obj.length; y < length; y++) {

            // DETECT COLLISION ALGORITHM
            if (objects[x].collidableWith === obj[y].type &&
                (objects[x].x < obj[y].x + obj[y].width &&
                    objects[x].x + objects[x].width > obj[y].x &&
                    objects[x].y < obj[y].y + obj[y].height &&
                    objects[x].y + objects[x].height > obj[y].y)) {
                objects[x].isColliding = true;
                obj[y].isColliding = true;
            }
        }
    }
};

/* ------ BACKGROUND OBJECT ------
 * this function is used to create a background object that will become a child
 * of the drawable object . The background is drawn on the background of the canvas
 * and gives the illusion of the background moving by panning tha image.
 */
function Background() {
    this.speed = 2; // redefine speed for panning
    this.draw = function () {
        //pan background
        //moving the y position of the background so that it pans from top to bottom
        this.y += this.speed;
        this.context.drawImage(imageRepo.background, this.x, this.y);
        // draw another image at the top of the first image
        this.context.drawImage(imageRepo.background, this.x, this.y - this.canvasHeight);

        //if the image scrolls of the screen then reset
        if (this.y >= this.canvasHeight)
            this.y = 0;

    };

}
//telling the background object to copy all the information from the drawable object
Background.prototype = new Drawable();



window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

//initialize the game and start it




// var FPS = 30;
// setInterval(function () {
//     //update();
//     draw();
//      //requestAnimationFrame();
// }, 1000 / FPS);


///http://blog.sklambert.com/html5-canvas-game-the-player-ship/