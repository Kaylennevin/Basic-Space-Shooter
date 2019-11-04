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

    var numImages = 3;
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


    this.background.src = "images/background.png";
    this.spaceship.src = "images/shipPlayer.png";
    this.bullet.src = "images/bulletPlayer.png";


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

    this.draw = function () {

    };
    this.move = function(){

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
            //initialize the background object
            this.background = new Background();
            this.background.init(0, 0); //set the draw point to 0,0
            //initialize the ship object
            this.ship = new Ship();
            //set the ship to start middle bottom
            var shipStartX = this.shipCanvas.width/2 - imageRepo.spaceship.width;
            var shipStartY = this.shipCanvas.height/4*3 + imageRepo.spaceship.height*2;
            this.ship.init(shipStartX, shipStartY, 
                imageRepo.spaceship.width, imageRepo.spaceship.height);

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
    requestAnimFrame(animate);
    game.background.draw();
    game.ship.move();
    game.ship.bulletPool.animate();
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
    // populates the pool with bullet objects 
    this.init = function () {
        for (var i = 0; i < size; i++) {
            //initalize the bullet object
            var bullet = new Bullet();
            bullet.init(0, 0, imageRepo.bullet.width, imageRepo.bullet.height);
            pool[i] = bullet;

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

document.onkeydown = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
}


document.onkeyup = function(e) {
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
    this.bulletPool.init();

    var fireRate = 15;
    var counter = 0;

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
            this.draw();
        }
        if (KEY_STATUS.space && counter >= fireRate) {
            this.fire();
            counter = 0;
        }
    };
    // fires two bullets
    this.fire = function () {
        this.bulletPool.getTwo(this.x + 6, this.y, 3, this.x + 33, this.y, 3);
    };
}
Ship.prototype = new Drawable();





// ------ BULLET ------
// bullet object which the ship fires. The bullets are drawn on the "main" canvas

function Bullet() {
    this.alive = false; // is true if the bullet is currently in use
    // sets the bullet value
    this.spawn = function(x, y, speed) {
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
    this.draw = function() {
        this.context.clearRect(this.x, this.y, this.width, this.height);
        this.y -= this.speed;
        if (this.y <= 0 - this.height) {
            return true;
        } else {
            this.context.drawImage(imageRepo.bullet, this.x, this.y);
        }
    };
    // resets the bullet value
    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alive = false;
    };

}
Bullet.prototype = new Drawable();





/* ------ BACKGROUND OBJECT ------
 * this function is used to create a background object that will become a child
 * of the drawable object . The background is drawn on the background of the canvas
 * and gives the illusion of the background moving by panning tha image.
 */
function Background() {
    this.speed = 1; // redefine speed for panning
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