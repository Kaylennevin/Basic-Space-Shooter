
//// --------- GAME SCREEN ---------- ////
var canvas = document.getElementById("background");
var ctx = canvas.getContext("2d");
const GAME_WIDTH = 980;
const GAME_HEIGHT = 800;

/*
Defining an object to hold all the images so that the images
are only drawn once. 
*/
var imageRepo = new function () {
    this.background = new Image();
    this.background.src = "images/background.png"
}
/* ------ ABSTRACT OBJECT ------
 * This is an abtract object which means that all
 * the other objects will inherit from it. This means not duplicating code
 * for multiple objects that require the same variables and functions.
 */
function Drawable() {
    this.init = function (x, y) {
        /* init allows me to set the x and y position of an object
         * once it has been created. Defines the speed of an object.
         */
        //default variables

        this.x = x;
        this.y = y;
    }
    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.draw = function () {

    };
}

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


/* ------ GAME OBJECT ------
 * game object that will hold all the objects and data for the game
 */
function Game() {
    // gets the canvas and context information and sets up all the game objects
    this.init = function () {
        // get the canvas element
        this.bgCanvas = document.getElementById("background");
        // checks to see if the canvas is supported
        if (this.bgCanvas.getContext) {
            this.bgContext = this.bgCanvas.getContext("2d");
            // initialize objects to contain their conetext and canvas information
            Background.prototype.context = this.bgContext;
            Background.prototype.canvasWidth = this.bgCanvas.width;
            Background.prototype.canvasHeight = this.bgCanvas.height;
            //initialize the background object
            this.background = new Background();
            this.background.init(0, 0); //set the draw point to 0,0
            return true;
        } else {
            return false;
        }
    };

    // start the animation loop
    this.start = function () {
        animate();
    }
};

/* ------ ANIMATION LOOP ------
 * Global function
 * The animation loop calls teh requestAnimationFrame to optimize the game loop.
 * Draws all the game objects
*/
function animate() {
    requestAnimFrame( animate );
    game.background.draw();
}

window.requestAnimFrame = (function(){
    return window.requestAnimationFrame   ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

//initialize the game and start it

var game = new Game();
function init(){
    if (game.init())
    game.start();
}




// var FPS = 30;
// setInterval(function () {
//     //update();
//     draw();
//      //requestAnimationFrame();
// }, 1000 / FPS);


///http://blog.sklambert.com/html5-canvas-game-the-player-ship/