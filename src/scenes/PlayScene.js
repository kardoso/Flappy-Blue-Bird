import BaseScene from './BaseScene';

const PIPES_TO_RENDER = 4;

class PlayScene extends BaseScene {

  constructor(config) {
    super('PlayScene', config);

    this.bird = null;
    this.pipes = null;
    this.isPaused = false;

    this.pipeHorizontalDistance = 0;
    this.flapVelocity = 300;

		this.score = 0;
		this.scoreText = '';

		this.currentDifficulty = 'easy';
    this.difficulties = {
      'easy': {
        pipeHorizontalDistanceRange: [300, 350],
        pipeVerticalDistanceRange: [150, 200]
      },
      'normal': {
        pipeHorizontalDistanceRange: [280, 330],
        pipeVerticalDistanceRange: [130, 160]
      },
      'hard': {
        pipeHorizontalDistanceRange: [250, 310],
        pipeVerticalDistanceRange: [100, 120]
      }
    }
  }

  create() {
    this.currentDifficulty = 'easy';
		super.create();
    this.createBird();
    this.createPipes();
    this.createColliders();
		this.createScore();
		this.createPause();
    this.handleInputs();
    this.listenToEvents();

		this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers('bird', { start: 9, end: 15}),
      // 24 fps default, it will play animation consisting of 24 frames in 1 second
      // in case of framerate 2 and sprite of 8 frames animations will play in
      // 4 sec; 8 / 2 = 4
      frameRate: 8,
      // repeat infinitely
      repeat: -1
    })
		this.anims.create({
      key: 'dead',
      frames: this.anims.generateFrameNumbers('bird', { start: 16, end: 18}),
      // 24 fps default, it will play animation consisting of 24 frames in 1 second
      // in case of framerate 2 and sprite of 8 frames animations will play in
      // 4 sec; 8 / 2 = 4
      frameRate: 8,
      // repeat infinitely
      repeat: 0
    })


    this.bird.play('fly');
  }

  update() {
    this.checkGameStatus();
    this.recyclePipes();
  }

	listenToEvents() {
    if (this.pauseEvent) { return; }

    this.pauseEvent = this.events.on('resume', () => {
      this.initialTime = 3;
      this.countDownText = this.add.text(...this.screenCenter, 'Fly in: ' + this.initialTime, this.fontOptions).setOrigin(0.5);
      this.timedEvent = this.time.addEvent({
        delay: 1000,
        callback: this.countDown,
        callbackScope: this,
        loop: true
      });
    });
  }

	countDown() {
    this.initialTime--;
    this.countDownText.setText('Fly in: ' + this.initialTime);
    if (this.initialTime <= 0) {
      this.isPaused = false;
      this.countDownText.setText('');
      this.physics.resume();
      this.timedEvent.remove();
    }
  }

  createBG() {
    this.add.image(0, 0, 'sky').setOrigin(0);
  }

  createBird() {
    this.bird = this.physics.add.sprite(this.config.startPosition.x, this.config.startPosition.y, 'bird')
      .setFlipX(true)
      .setScale(3)
      .setOrigin(0);
		this.bird.setBodySize(this.bird.width - 6, this.bird.height - 10);
    this.bird.body.gravity.y = 600;
		this.bird.setCollideWorldBounds(true);
  }

  createPipes() {
    this.pipes = this.physics.add.group();

    for (let i = 0; i < PIPES_TO_RENDER; i++) {
			const upperPipe = this.pipes.create(0, 0, 'pipe')
        .setImmovable(true)
        .setOrigin(0, 1);
      const lowerPipe = this.pipes.create(0, 0, 'pipe')
        .setImmovable(true)
        .setOrigin(0, 0);

      this.placePipe(upperPipe, lowerPipe)
    }

    this.pipes.setVelocityX(-200);
  }

  createColliders() {
    this.physics.add.collider(this.bird, this.pipes, this.gameOver, null, this);
  }

	createScore() {
		this.score = 0;
		const bestScore = localStorage.getItem('bestScore');
		this.scoreText = this.add.text(16, 16, `Score: ${0}`, {fontSize: '32px', fill: '#000'})
		this.add.text(16, 52, `Best score: ${bestScore || 0}`, { fontSize: '18px', fill: '#000'});
	}

	createPause() {
    this.isPaused = false;

    const pauseButton = this.add.image(this.config.width - 10, this.config.height -10, 'pause')
      .setInteractive()
      .setScale(3)
      .setOrigin(1);

		var escButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
		escButton.on('down', () => {
      this.isPaused = true;
			this.physics.pause();
			this.scene.pause();
      this.scene.launch('PauseScene');
		});
		
		pauseButton.on('pointerdown', () => {
      this.isPaused = true;
			this.physics.pause();
			this.scene.pause();
      this.scene.launch('PauseScene');
		});
  }

  handleInputs() {
		var spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		this.input.on('pointerdown', this.flap, this);
		spaceBar.on('down', this.flap, this);
  }

  checkGameStatus() {
    if (this.bird.getBounds().bottom >= this.config.height || this.bird.y <= 0) {
      this.gameOver();
    }
  }

  placePipe(uPipe, lPipe) {
    const difficulty = this.difficulties[this.currentDifficulty];
    const rightMostX = this.getRightMostPipe();
    const pipeVerticalDistance = Phaser.Math.Between(...difficulty.pipeVerticalDistanceRange);
    const pipeVerticalPosition = Phaser.Math.Between(0 + 20, this.config.height - 20 - pipeVerticalDistance);
		const pipeHorizontalDistance = Phaser.Math.Between(...difficulty.pipeHorizontalDistanceRange);

    uPipe.x = rightMostX + pipeHorizontalDistance;
    uPipe.y = pipeVerticalPosition;

    lPipe.x = uPipe.x;
    lPipe.y = uPipe.y + pipeVerticalDistance
  }

  recyclePipes() {
    const tempPipes = [];
    this.pipes.getChildren().forEach(pipe => {
      if (pipe.getBounds().right <= 0) {
        tempPipes.push(pipe);
        if (tempPipes.length === 2) {
          this.placePipe(...tempPipes);
					this.increaseScore();
					this.saveBestScore();
          this.increaseDifficulty();
        }
      }
    })
  }

	increaseDifficulty() {
    if (this.score === 3) {
      this.currentDifficulty = 'normal';
    }

    if (this.score === 6) {
      this.currentDifficulty = 'hard';
    }
  }

  getRightMostPipe() {
    let rightMostX = 0;

    this.pipes.getChildren().forEach(function(pipe) {
      rightMostX = Math.max(pipe.x, rightMostX);
    })

    return rightMostX;
  }

	saveBestScore() {
    const bestScoreText = localStorage.getItem('bestScore');
    const bestScore = bestScoreText && parseInt(bestScoreText, 10);

    if (!bestScore || this.score > bestScore) {
      localStorage.setItem('bestScore', this.score);
    }
  }

  gameOver() {
    this.physics.pause();
    this.bird.setTint(0xEE4824);

		this.bird.play('dead');

		this.saveBestScore();

		this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.scene.restart();
      },
      loop: false
    })
  }

  flap() {
    if (this.isPaused) { return; }
    this.bird.body.velocity.y = -this.flapVelocity;
  }

	increaseScore() {
		this.score++;
		this.scoreText.setText(`Score: ${this.score}`)
	}
}

export default PlayScene;