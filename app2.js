const img = new Image();
img.src = 'images/image.png';

img.onload = () => {
 // image loaded and ready to be used
 }

function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  })
 }

function createEnemies() {
  const MONSTER_TOTAL = 5;
  // Hero와 Laser 클래스에서와 마찬가지로, 이 함수를 전역 변수를 사용하도록 수정해야 합니다.
  const MONSTER_WIDTH = MONSTER_TOTAL * 98; // Enemy 너비(98)
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;

  for (let x = START_X; x < STOP_X; x += 98) {
    for (let y = 0; y < 50 * 5; y += 50) {
      const enemy = new Enemy(x, y);
      enemy.img = enemyImg;
      gameObjects.push(enemy); // **Enemy 객체를 배열에 추가**
    }
  }
}

function createEnemies2(ctx, canvas, enemyImg) {
    const MONSTER_TOTAL = 5;
    const NUM_ROWS = 5;
    const MAX_ROW_WIDTH = MONSTER_TOTAL * enemyImg.width;
    const INITIAL_START_X = (canvas.width - MAX_ROW_WIDTH) / 2; 
    const HALF_WIDTH = enemyImg.width / 2;
    const enemiesPerRow = [5, 4, 3, 2, 1];
    let rowCount = 0; 

    for (let i = 0; i < NUM_ROWS; i++) {
        const currentEnemies = enemiesPerRow[i];
        const currentStartX = INITIAL_START_X + (i * HALF_WIDTH);
        const currentY = rowCount * enemyImg.height; 

        for (let j = 0; j < currentEnemies; j++) {
            const x = currentStartX + (j * enemyImg.width);
            ctx.drawImage(enemyImg, x, currentY);
        }
        
        rowCount++;
    }
}

/*
 let onKeyDown = function (e) {
  console.log(e.keyCode); // 눌린 키의 keyCode를 출력
  switch (e.keyCode) {
    case 37: // 왼쪽 화살표
    case 38: // 위쪽 화살표
    case 39: // 오른쪽 화살표
    case 40: // 아래쪽 화살표
    case 32: // 스페이스바
      e.preventDefault(); // 기본 동작 차단
      break;
    default:
      break; // 다른 키는 기본 동작 유지
  }
 };*/

let id = setInterval(() => {
  // 물체를 Y축으로 이동
  enemy.y += 10;
 }, 100); // 100ms마다 실행

let gameLoopId = setInterval(() => {
  // 화면 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // 게임 객체 그리기
  drawHero();            // 플레이어 캐릭터
  drawEnemies();         // 적들
  drawStaticObjects();   // 배경과 같은 정적인 요소
}, 200); // 200ms마다 실행
class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;     // 객체가 파괴되었는지 여부
    this.type = "";        // 객체 타입 (영웅/적)
    this.width = 0;        // 객체의 폭
    this.height = 0;       // 객체의 높이
    this.img = undefined;  // 객체의 이미지
  }
  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width,
    };
  }
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height); // 
  }
 }

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||  // r2가 r1의 오른쪽에 있음
    r2.right < r1.left ||  // r2가 r1의 왼쪽에 있음
    r2.top > r1.bottom ||  // r2가 r1의 아래에 있음
    r2.bottom < r1.top     // r2가 r1의 위에 있음
  );
 }

let onKeyDown = function (e) {
 console.log(e.keyCode);
 switch (e.keyCode) {
    case 37: // 왼쪽 화살표
    case 39: // 오른쪽 화살표
    case 38: // 위쪽 화살표
    case 40: // 아래쪽 화살표
    case 32: // 스페이스바
      e.preventDefault();
      break;
    default:
      break;
 }
 };

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    // 적 캐릭터의 자동 이동 (Y축 방향)
    let id = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 5;  // 아래로 이동
      } else {
        console.log('Stopped at', this.y);
        clearInterval(id); // 화면 끝에 도달하면 정지
      }
    }, 300);
  }
 }


class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }
    emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }
 }

let heroImg, 
  enemyImg, 
  laserImg,
  canvas, ctx, 
  gameObjects = [], 
  hero, 
  eventEmitter = new EventEmitter();

function initGame() {
  gameObjects = [];
  createEnemies();
  createHero();
  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -=5 ;
  })
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      hero.fire();
    }
  });
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
  });
 }

 function createHero() {
  hero = new Hero(
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4
  );
  hero.img = heroImg;
  gameObjects.push(hero);
 }

 function drawGameObjects(ctx) {
  gameObjects.forEach(go => go.draw(ctx));
 }

 function rectFromGameObject() {
  return {
    top: this.y,
    left: this.x,
    bottom: this.y + this.height,
    right: this.x + this.width,
  };
 }

 function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
 }

class Laser extends GameObject {
  constructor(x, y) {
    super(x,y);
    (this.width = 9), (this.height = 33);
    this.type = 'Laser';
    this.img = laserImg;
    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100)
  }
 }


const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
 };

 

function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const lasers = gameObjects.filter((go) => go.type === "Laser");
  lasers.forEach((l) => {
    enemies.forEach((m) => {
      if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: l,
          second: m,
        });
      }
    });
  });
  gameObjects = gameObjects.filter((go) => !go.dead);
 }


class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 99;
    this.height = 75;
    this.type = 'Hero';
    this.speed = {x: 0, y: 0}; // 필요하다면 추가
    this.cooldown = 0; // 초기화
  }
  fire() {
    if (this.canFire()) { // 쿨다운 확인
      gameObjects.push(new Laser(this.x + 45, this.y - 10)); // 레이저 생성
      this.cooldown = 500; // 쿨다운 500ms 설정
      let id = setInterval(() => {
        if (this.cooldown > 0) {
          this.cooldown -= 100;
        } else {
          clearInterval(id); // 쿨다운 완료 후 타이머 종료
        }
      }, 100);
    }
  }
  canFire() {
    return this.cooldown === 0; // 쿨다운 상태 확인
  }
 }
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      hero.fire();
    }
});

setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGameObjects(ctx);
  updateGameObjects(); // 충돌 감지
}, 100);



/*
 window.onload = async() => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");
  const heroImg = await loadTexture('assets/player.png')
  const enemyImg = await loadTexture('assets/enemyShip.png')
  const backgroundImage = await loadTexture('assets/Background/starBackground.png')
  ctx.fillStyle = 'black';

 // ctx.fillRect(0,0, canvas.width, canvas.height);
  // 배경
  const SECTION_WIDTH = canvas.width / 4;
    const SECTION_HEIGHT = canvas.height / 4;

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const startX = col * SECTION_WIDTH;
            const startY = row * SECTION_HEIGHT;

            // drawImage(image, dx, dy, dWidth, dHeight)
            ctx.drawImage(
                backgroundImage, 
                startX,
                startY,
                SECTION_WIDTH,
                SECTION_HEIGHT
            );
        }
    }


  ctx.drawImage(heroImg, canvas.width/2 - 45, canvas.height - (canvas.height /4 ));

  let smallhero = {};
  smallhero.width = heroImg.width / 2;
  smallhero.height = heroImg.height / 2;
  ctx.drawImage(heroImg, canvas.width/2 - 50*2, canvas.height - (canvas.height /4)+20, smallhero.width, smallhero.height);
  ctx.drawImage(heroImg, canvas.width - (canvas.width/2 - 60), canvas.height - (canvas.height /4)+20, smallhero.width, smallhero.height);
   createEnemies2(ctx, canvas, enemyImg);
 };*/

 
window.addEventListener('keydown', onKeyDown);



window.addEventListener("keyup", (evt) => {
  if (evt.key === "ArrowUp") {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.key === "ArrowDown") {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  } else if (evt.key === "ArrowLeft") {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.key === "ArrowRight") {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  } else if(evt.keyCode === 32) {
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  }
 });

 eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
  first.dead = true; // 레이저 제거
  second.dead = true; // 적 제거
});

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");
  heroImg = await loadTexture("assets/player.png");
  enemyImg = await loadTexture("assets/enemyShip.png");
  laserImg = await loadTexture("assets/laserRed.png");
  initGame(); // 이 함수는 createEnemies를 호출하며, Enemy 클래스가 필요합니다.

  // 단일하고 완전한 게임 루프만 유지합니다.
  let gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGameObjects(ctx);
    updateGameObjects(); // 충돌 감지 및 객체 제거 로직 포함
  }, 100);
};
