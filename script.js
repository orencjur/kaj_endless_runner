const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let player;
let gravity;
let obstacles = [];
let gameSpeed;
let keysPressed = {};
let score;
let scoreText;
let highscore;
let highscoreText;

document.addEventListener('keydown', function(evt) {
  keysPressed[evt.code] = true;
});
document.addEventListener('keyup', function(evt) {
  keysPressed[evt.code] = false;
});

//offline funkcionalita
window.onload = () => {
  'use strict';
  if ('serviceWorker' in navigator && document.URL.split(':')[0] !== 'file') {
    navigator.serviceWorker.register('./service_worker.js');
  }
};

//Classy, spolu s ich metodami

//Reprezentacia hraca, ma svoje suradnice, rozmery a farbu
class Player {
  constructor(x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;

    this.dy = 0;
    this.jumpForce = 15;

    this.originalHeight = h;
    this.grounded = false;
    this.jumpTimer = 0;
  }

  Animate() {
    //jump
    if (keysPressed['Space'] || keysPressed['KeyW']) {
      if (this.grounded && this.jumpTimer == 0) {
        this.jumpTimer = 1;
        this.dy = -this.jumpForce;
      } else if (this.jumpTimer > 0 && this.jumpTimer < 15) {
        this.jumpTimer++;
        this.dy = -this.jumpForce - this.jumpTimer / 50;
      }
    } else {
      this.jumpTimer = 0;
    }

    //slide
    if (keysPressed['ShiftLeft'] || keysPressed['KeyS']) {
      this.h = this.originalHeight / 2;
    } else {
      this.h = this.originalHeight;
    }

    this.y += this.dy;

    if (this.y + this.h < canvas.height) {
      this.dy += gravity;
      this.grounded = false;
    } else {
      this.dy = 0;
      this.grounded = true;
      this.y = canvas.height - this.h;
    }

    this.Draw();
  }

  Draw() {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.closePath();
  }
}

//Prekazka, rovnake parametre ako player
class Obstacle {
  constructor(x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;

    this.dx = -gameSpeed;
  }

  Update() {
    this.x += this.dx;
    this.Draw();
    this.dx = -gameSpeed;
  }

  Draw() {
    ctx.beginPath();
    this.fillStyle = this.c;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.closePath();
  }
}

//Score a HighScore
class Text {
  constructor(t, x, y, a, c, s) {
    this.t = t;
    this.x = x;
    this.y = y;
    this.a = a;
    this.c = c;
    this.s = s;
  }

  Draw() {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.font = this.s + 'px sans-serif';
    ctx.textAlign = this.a;
    ctx.fillText(this.t, this.x, this.y);
    ctx.closePath();
  }
}

//Vytvorenie nahodne velkej a nahodne vysoko postavenej prekazky a jej nasledne zaradenie do pola z ktoreho sa pouziva
function SpawnObstacle() {
  let size = RandomIntInRange(20, 70);
  let type = RandomIntInRange(0, 1);
  let obstacle = new Obstacle(
    canvas.width + size,
    canvas.height - size,
    size,
    size,
    '#2484E4'
  );

  if (type == 1) {
    obstacle.y -= player.originalHeight - 10;
  }

  obstacles.push(obstacle);
}

function RandomIntInRange(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

//Zivotny ciklus hry, vytvoria sa instancie objektov, ktore potrebujeme na zaciatku, nastavi sa canvas a hodnoty pre skore
function Start() {
  canvas.width = window.innerWidth;
  canvas.height = 400;
  ctx.font = '20px sans-serif';

  gameSpeed = 3;
  gravity = 1;

  score = 0;
  highscore = 0;

  if (localStorage.getItem('highScore')) {
    highscore = localStorage.getItem('highScore');
  }

  player = new Player(25, 0, 50, 50, '#FF5858');

  scoreText = new Text('Score: ' + score, 25, 25, 'left', '#212121', '20');
  highscoreText = new Text(
    'Highscore: ' + highscore,
    canvas.width - 25,
    25,
    'right',
    '#212121',
    '20'
  );
  requestAnimationFrame(Update);
}

let initialSpawnTimer = 200;
let spawnTimer = initialSpawnTimer;

//Posun hry o krok
function Update() {
  requestAnimationFrame(Update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  spawnTimer--;
  if (spawnTimer <= 0) {
    SpawnObstacle();
    spawnTimer = initialSpawnTimer - gameSpeed + 8;

    if (spawnTimer < 60) {
      spawnTimer = 60;
    }
  }
  //hodenie prekazky na hraca
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    if (o.x + o.w < 0) {
      obstacles.splice(i, 1);
    }

    //Collision control
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      const deathSound = new Audio(
        'https://stackblitz.com/storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBb1hvIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--5f41a0ceec2c7bf9c7bc641a92c3116f0f72e1ef/smb_bump.wav'
      );

      deathSound.play();
      obstacles = [];
      score = 0;
      spawnTimer = initialSpawnTimer;
      gameSpeed = 3;
      window.localStorage.setItem('highScore', highscore);
    }
    o.Update();
  }

  player.Animate();

  //Vypis skore
  score++;
  scoreText.t = 'Score: ' + score;
  scoreText.Draw();

  if (score > highscore) {
    highscore = score;
    highscoreText.t = 'High Score: ' + highscore;
  }
  highscoreText.Draw();
  gameSpeed += 0.003;
}

Start();
