// ====================================================================
// 상수 (Constants)
// ====================================================================
const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
  GAME_END_LOSS: "GAME_END_LOSS",
  GAME_END_WIN: "GAME_END_WIN",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",

};

// ====================================================================
// 전역 변수 (Global Variables)
// ====================================================================
let heroImg, 
  enemyImg, 
  laserImg,
  supportLaserImg,
  explosionImg,
  lifeImg,
  canvas, ctx, 
  gameObjects = [], 
  hero, 
  eventEmitter;


// ====================================================================
// 유틸리티 함수 (Utility Functions)
// ====================================================================

// 이미지 로드 (Promise를 사용하여 비동기 로딩)
function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}

// 두 사각형의 충돌 감지
function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||  // r2가 r1의 오른쪽에 있음
    r2.right < r1.left ||  // r2가 r1의 왼쪽에 있음
    r2.top > r1.bottom ||  // r2가 r1의 아래에 있음
    r2.bottom < r1.top     // r2가 r1의 위에 있음
  );
}

function isHeroDead() {
  return hero.life <= 0;
 }
 function isEnemiesDead() {
    const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
    return enemies.length === 0;
 }

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function endGame(win) {
 clearInterval(gameLoopId);
 // 게임 화면이 겹칠 수 있으니, 200ms 지연
 setTimeout(() => {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx.fillStyle = "black";
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   if (win) {
     displayMessage(
       "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
       "green"
     );
   } else {
     displayMessage(
       "You died !!! Press [Enter] to start a new game Captain Pew Pew"
     );
   }
 }, 200)  
}

function resetGame() {
 if (gameLoopId) {
   clearInterval(gameLoopId); // 게임 루프 중지, 중복 실행 방지
   eventEmitter.clear();  // 모든 이벤트 리스너 제거, 이전 게임 세션 충돌 방지
   initGame();  // 게임 초기 상태 실행
   gameLoopId = setInterval(() => {  // 100ms 간격으로 새로운 게임 루프 시작
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     ctx.fillStyle = "black";
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     drawPoints();
     drawLife();
     updateGameObjects();
     drawGameObjects(ctx);
   }, 100);
 }
 }


// ====================================================================
// 클래스 정의 (Class Definitions)
// ====================================================================

// 이벤트 에미터 클래스 (이벤트 Pub/Sub 패턴 구현)
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
  clear() {
  this.listeners = {};
 }

}

// EventEmitter 인스턴스는 클래스 선언 이후에 초기화합니다.
eventEmitter = new EventEmitter();

// 기본 게임 객체 클래스
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
    // 이미지가 로드된 후에만 그립니다.
    if (this.img) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }
}

// 적 캐릭터 클래스
class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    
    // 적 캐릭터의 자동 이동 로직 (화면 끝에 도달하면 정지)
    // 강의 자료에 따라 Enemy 생성 시점에 setInterval을 설정합니다.
    let id = setInterval(() => {
      // 캔버스 객체가 초기화되었는지 확인합니다.
      if (canvas && this.y < canvas.height - this.height) {
        this.y += 5;  // 아래로 이동
      } else {
        clearInterval(id); // 화면 끝에 도달하면 정지
      }
    }, 300);
  }
}

// 레이저 클래스
class Laser extends GameObject {
  // 수정: 레이저는 이미지, 크기, 속도를 인자로 받을 수 있게 변경
  constructor(x, y, opts = {}) {
    super(x, y);
    this.width = opts.width || 9;
    this.height = opts.height || 33;
    this.type = opts.type || 'Laser';
    this.img = opts.img || laserImg;
    this.speed = opts.speed || 15;

    // 레이저 자동 이동 및 제거 로직
    let id = setInterval(() => {
      if (this.y > -this.height) {
        this.y -= this.speed; // 위로 이동
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, opts.interval || 100);
  }
}

// 보조 우주선 클래스 (영웅을 따라다님)
class Support extends GameObject {
  constructor(parent, offsetX) {
    super(parent.x + offsetX, parent.y);
    this.parent = parent;
    this.offsetX = offsetX;
    this.width = Math.floor(parent.width * 0.6);
    this.height = Math.floor(parent.height * 0.6);
    this.type = 'Support';
    this.img = parent.img; // 플레이어 이미지 그대로 사용 (축소)
    // 자동 발사 타이머 (스페이스바 없이 주기적으로 발사)
    this.autoFireInterval = 800; // ms
    this.autoFireId = setInterval(() => {
      if (!this.dead && !this.parent.dead) {
        this.fire();
      }
    }, this.autoFireInterval);
  }
  update() {
    // 부모 영웅의 위치를 기준으로 항상 갱신
    this.x = this.parent.x + this.offsetX;
    this.y = this.parent.y + (this.parent.height - this.height);
    // 자동 발사 객체가 제거되면 타이머 해제
    if (this.dead && this.autoFireId) {
      clearInterval(this.autoFireId);
      this.autoFireId = null;
    }
  }
  fire() {
    // 서포트 전용 작은 레이저 발사
    const lx = this.x + this.width / 2 - 3;
    const ly = this.y - 8;
    gameObjects.push(new Laser(lx, ly, { img: supportLaserImg, width: 6, height: 20, speed: 10, interval: 80, type: 'Laser' }));
  }
}

// 폭발 이펙트 클래스
class Explosion extends GameObject {
  constructor(x, y, width, height, img, ttl = 400) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.img = img;
    this.type = 'Explosion';
    // 일정 시간 후 제거
    setTimeout(() => { this.dead = true; }, ttl);
  }
}

// 영웅 캐릭터 클래스
class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 99;
    this.height = 75;
    this.type = 'Hero';
    this.cooldown = 0; // 초기화
    this.life = 3;
    this.points = 0;

  }
  fire() {
    if (this.canFire()) { // 쿨다운 확인
      // 영웅의 중앙에서 레이저 발사
      gameObjects.push(new Laser(this.x + this.width / 2 - 4.5, this.y - 10, { img: laserImg, width: 9, height: 33, speed: 15 })); 
      // 보조 우주선이 있으면 함께 발사
      //if (this.supports && Array.isArray(this.supports)) {
      //  this.supports.forEach(s => s.fire());
      //}
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

  decrementLife() {
    this.life--;
    if (this.life === 0) {
      this.dead = true;
    }
  }

  incrementPoints() {
    this.points += 100;
  }
}


// ====================================================================
// 게임 로직 함수 (Game Logic Functions)
// ====================================================================

// 적 객체 생성 (요청하신 배열 배치 방식 적용)
function createEnemies() {
  const MONSTER_TOTAL = 5;
  const ENEMY_WIDTH = 98; // Enemy 너비
  const ENEMY_HEIGHT = 50; // Enemy 높이
  const enemiesPerRow = [5, 4, 3, 2, 1]; // 각 줄의 적 개수

  // 5마리가 최대로 차지할 수 있는 너비 계산
  const MAX_ROW_WIDTH = MONSTER_TOTAL * ENEMY_WIDTH;
  // 중앙 정렬을 위한 초기 X 시작점
  const INITIAL_START_X = (canvas.width - MAX_ROW_WIDTH) / 2; 

  let rowCount = 0; 
  
  enemiesPerRow.forEach((currentEnemies, i) => {
    // 줄이 줄어들 때마다 중앙 정렬을 위해 시작 X 좌표를 이동
    const rowWidth = currentEnemies * ENEMY_WIDTH;
    const currentStartX = INITIAL_START_X + (MAX_ROW_WIDTH - rowWidth) / 2;
    const currentY = rowCount * ENEMY_HEIGHT; // Y 좌표 계산

    for (let j = 0; j < currentEnemies; j++) {
      const x = currentStartX + (j * ENEMY_WIDTH);
      const enemy = new Enemy(x, currentY); // Enemy 객체 생성
      enemy.img = enemyImg;
      gameObjects.push(enemy); // 게임 객체 배열에 추가
    }
    
    rowCount++;
  });
}

// 영웅 객체 생성
function createHero() {
  hero = new Hero(
    canvas.width / 2 - 49.5, // 99/2 = 49.5 (영웅 중앙 정렬)
    canvas.height - 100 // 화면 하단에서 약간 위
  );
  hero.img = heroImg;
  gameObjects.push(hero);

  // 서포트(보조 우주선) 2기 추가: 좌우에 배치
  const supportOffset = 70; // 영웅 기준 X 오프셋
  const supportLeft = new Support(hero, -supportOffset);
  const supportRight = new Support(hero, supportOffset + 42);
  // 지원 우주선이 플레이어 발사 시 자동 발사할 수 있도록 hero.supports에 연결
  hero.supports = [supportLeft, supportRight];
  gameObjects.push(supportLeft, supportRight);
}

// 게임 초기화
function initGame() {
  // 기존 서포트 타이머 정리(새 게임 시작 시 중복 발사 방지)
  gameObjects.forEach(go => {
    if (go && go.autoFireId) {
      clearInterval(go.autoFireId);
    }
  });
  gameObjects = [];
  createEnemies();
  createHero();
  
  // 키 이벤트 리스너 등록
  eventEmitter.on(Messages.KEY_EVENT_UP, () => { hero.y -=10 ; });
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => { hero.y += 10; });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => { hero.x -= 10; });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => { hero.x += 10; });
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) { hero.fire(); }
  });

 eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    hero.incrementPoints();
    if (isEnemiesDead()) { // 추가
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
 });
 eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife();
    if (isHeroDead())  { // 추가
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return; // loss before victory
    }
    if (isEnemiesDead()) { // 추가
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
 });
 eventEmitter.on(Messages.GAME_END_WIN, () => { // 추가
    endGame(true);
 });
 eventEmitter.on(Messages.GAME_END_LOSS, () => { // 추가
    endGame(false);
 });
 eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
  resetGame();
 });

  
  // 충돌 이벤트 리스너 등록
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    // 레이저와 적 제거 대신 폭발 이펙트를 생성
    first.dead = true; // 레이저 제거
    // 적의 중앙에 폭발을 생성
    const ex = new Explosion(second.x, second.y, second.width, second.height, explosionImg, 600);
    gameObjects.push(ex);
    second.dead = true; // 적 제거
  });
}

function drawLife() {
  const START_POS = canvas.width - 180;
  for(let i=0; i < hero.life; i++ ) {
    ctx.drawImage(
      lifeImg, 
      START_POS + (45 * (i+1) ), 
      canvas.height - 37);
  }
 }

 function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height-20);
 }

 function drawText(message, x, y) {
  ctx.fillText(message, x, y);
 }


// 게임 객체 그리기
function drawGameObjects(ctx) {
  gameObjects.forEach(go => go.draw(ctx));
}

// 게임 객체 상태 업데이트 및 충돌 감지
function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const lasers = gameObjects.filter((go) => go.type === "Laser");
  
  // 레이저와 적의 충돌 감지
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
  
  enemies.forEach(enemy => {
    const heroRect = hero.rectFromGameObject();
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  })

  // 죽은 객체 제거
  gameObjects = gameObjects.filter((go) => !go.dead);
}

// 키다운 이벤트 핸들러 (기본 동작 차단용)
let onKeyDown = function (e) {
  switch (e.keyCode) {
    case 37: // 왼쪽 화살표
    case 39: // 오른쪽 화살표
    case 38: // 위쪽 화살표
    case 40: // 아래쪽 화살표
    case 32: // 스페이스바
      e.preventDefault(); // 기본 동작 차단
      break;
    default:
      break;
  }
};


// ====================================================================
// 이벤트 리스너 등록 (Event Listener Registrations)
// ====================================================================

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
  else if(evt.key === "Enter") {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
 });


// ====================================================================
// 애플리케이션 시작 (Application Start)
// ====================================================================

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");
  
  // 이미지 로드 (비동기)
  heroImg = await loadTexture("assets/player.png");
  enemyImg = await loadTexture("assets/enemyShip.png");
  laserImg = await loadTexture("assets/laserRed.png");
  supportLaserImg = await loadTexture('assets/laserRed.png');
  explosionImg = await loadTexture('assets/laserGreenShot.png');
  backgroundImage = await loadTexture('assets/Background/starBackground.png'); // 배경 이미지 로드
  lifeImg = await loadTexture("assets/life.png");
  // createPattern을 사용하여 4x4 타일 배경 생성
  // 'repeat' 모드를 사용하여 이미지 크기에 상관없이 캔버스 전체에 채웁니다.
  backgroundPattern = ctx.createPattern(backgroundImage, 'repeat');

  ctx.font = "30px Arial"; // 텍스트의 크기와 글꼴
  ctx.fillStyle = "red";   // 텍스트 색상
  ctx.textAlign = "right"; // 텍스트 정렬
  ctx.fillText("show this on the screen", 0, 0); // 텍스트와 위치


  // 게임 초기화
  initGame(); 

  // 게임 루프 시작
  let gameLoopId = setInterval(() => {
    // 1. 화면 지우기 및 배경 그리기 (수정된 부분)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (backgroundPattern) {
        // createPattern으로 설정된 배경을 사용
        ctx.fillStyle = backgroundPattern;
    } else {
        // 배경 이미지 로드가 실패하거나 패턴이 생성되지 않은 경우, 검은색 배경 사용
        ctx.fillStyle = "black";
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. 게임 객체 업데이트 및 그리기
    // 각 객체의 update 메서드가 있으면 호출
    gameObjects.forEach(go => { if (typeof go.update === 'function') go.update(); });
    drawGameObjects(ctx);
    drawPoints();
    drawLife();
    // 3. 상태 업데이트 및 충돌 감지
    updateGameObjects(); 
  }, 100);
};