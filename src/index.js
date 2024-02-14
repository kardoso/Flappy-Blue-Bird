import Phaser from "phaser";

const VELOCITY = 200;
const GRAVITY = 400

let bird = null;
let flapVelocity = 250;
let totalDelta = null;

const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			debug: true,
			gravity: {
				y: GRAVITY,
			}
		}
	},
	scene: {
		preload,
		create,
		update
	}
}

function preload() {
	this.load.image('sky', 'assets/sky.png');
	this.load.image('bird', 'assets/bird.png');
}

function create() {
	// this.add.image(config.width / 2, config.height / 2, 'sky').setOrigin(0,0);
	this.add.image(0, 0, 'sky').setOrigin(0, 0);
	bird = this.physics.add.sprite(config.width * 0.1 , config.height / 2, 'bird').setOrigin(0);

	var spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
	
	this.input.on('pointerdown', flap);
	spaceBar.on('down', flap);
}

function update(time, delta) {
}

function flap() {
	bird.body.velocity.y = -flapVelocity;
}

new Phaser.Game(config);