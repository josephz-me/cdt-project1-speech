// https://www.youtube.com/watch?v=soerr09FYCw

var mic;
var sum_vol = 0,
  avg_vol = 0;
var w = 0;
let terrain = [];
let terrainWords = [];
let dict = {};
let lastTenWords = [];
let bg;
let capture;
let lastTenPositions = [];

var socket;
let player = new Object();
let players = [];
let id;

function setup() {
  socket = io.connect("http://localhost:3000");

  //welcome the user
  socket.on("welcome", (data) => {
    console.log("welcome user: " + data);
  });

  player = {
    x: -60,
    y: 60,
    speed: 3,
    warning: false,
    size: 60,
    drawPlayer: function () {
      scale(-1, 1);
      if (this.warning) {
        if (this.size > 2) {
          this.size -= 2;
        }
      }
      fill("green");
      rectMode(CENTER);
      rect(this.x, this.y, this.size, this.size);
    },
  };
  socket.emit("start", player);

  socket.on("heartbeat", function (data) {
    players = data;
  });

  capture = createCapture(VIDEO);
  capture.size(320, 240);
  capture.hide();
  let cnv = createCanvas(windowWidth, windowHeight);

  cnv.mousePressed(userStartAudio);
  mic = new p5.AudioIn();
  mic.start();

  //   fill("#00ff00");
  frameRate(60);
  noStroke();
  foo.start();
}

let foo = new p5.SpeechRec("en-US", showResult);
foo.onResult = showResult;
foo.continuous = true;
foo.interimResults = true;

function showResult() {
  if (frameCount % 2 === 0) {
    let vol = mic.getLevel();
    let words = foo.resultString.split(" ");

    let deletedWord;
    for (let i = 0; i < words.length; i++) {
      if (!(words[i] in dict)) {
        lastTenWords.push(words[i]);
      }
      if (lastTenWords.length > 10) {
        deletedWord = lastTenWords[0];
        lastTenWords.shift();
        delete dict[deletedWord];
      }

      if (!(words[i] in dict)) {
        let block = new Object();
        block = {
          xPos: random(width, width + 40),
          yPos: random(20, height),
          speed: map(random(10, 50), 10, 50, 0.5, 2),
          text: words[i],
          volume: map(vol, 0.0001, 0.08, 14, 20),
          color: 30,
          colorCounter: 0,
          drawRect: function () {
            lastTenPositions.push(this.yPos);
            if (lastTenPositions.length > 10) {
              lastTenPositions.shift();
            }
            for (let i = 0; i < lastTenPositions; i++) {
              if (abs(this.yPos - lastTenPositions[i]) < 10) {
                this.yPos = random(20, height);
              }
            }
            this.xPos -= this.speed;
            if (this.color != 255) {
              this.color++;
            }

            if (this.xPos < 200 && this.color > 0) {
              this.color -= 2;
            }
            fill(this.color);
            textSize(this.volume);
            text(this.text, this.xPos, this.yPos);
          },
        };
        terrain.push(block);
      }
      dict[words[i]] = 1;
    }
  }
}

function draw() {
  background("black");
  for (i = 0; i < terrain.length; i++) {
    terrain[i].drawRect();
    let blockX = terrain[i].xPos;
    let blockY = terrain[i].yPos;
    if (dist(-player.x, player.y, blockX, blockY) < 35) {
      player.warning = true;
    }
  }

  //draws player on this screen
  player.drawPlayer();

  //01 sends back player information
  socket.emit("update", player);

  for (let i = 0; i < players.length; i++) {
    let id = players[i].id;
    if (id !== socket.id) {
      fill("yellow");
      ellipseMode(CENTER);
      ellipse(players[i].x, players[i].y, players[i].size, players[i].size);
    }
  }

  if (keyIsDown(LEFT_ARROW)) player.x += player.speed;
  if (keyIsDown(RIGHT_ARROW)) player.x -= player.speed;
  if (keyIsDown(UP_ARROW)) player.y -= player.speed;
  if (keyIsDown(DOWN_ARROW)) player.y += player.speed;
}
