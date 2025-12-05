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
  COLLISION_HERO_LASER: "COLLISION_HERO_LASER", // 레이저(Hero)와 적 충돌
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
  COLLISION_HERO_ENEMY_LASER: "COLLISION_HERO_ENEMY_LASER", // 영웅과 적 레이저 충돌
  COLLISION_HERO_METEOR: "COLLISION_HERO_METEOR", // 영웅과 메테오 충돌
  COLLISION_HERO_SHIELD: "COLLISION_HERO_SHIELD", // 영웅과 실드 아이템 충돌
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
  eventEmitter,
  gameLoopId, // 게임 루프 ID를 전역으로 관리
  shieldSpawnId, // 실드 아이템 스폰 타이머 ID
  boss, // 보스 객체
  bossImg, meteorBigImg, meteorSmallImg, // 보스 및 메테오 이미지
  heroLeftImg, heroRightImg, heroDamagedImg, // 영웅 애니메이션 이미지
  shieldVisualImg, // <--- 수정: 플레이어에게 생기는 실드 이미지 (shield.png)
  shieldIconImg;

// 키 입력 상태 관리 객체 (부드러운 움직임 구현)
const keysPressed = {};


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
  // --- 수정: 일반 적(Enemy)만 필터링하고 보스(Boss), 메테오(Meteor) 등은 제외
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0; // 보스 생성 여부와 관계없이 일반 적이 0이면 true
}

function isBossDead() {
  return boss && boss.dead;
}

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function stopGameIntervals() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    gameLoopId = null;
  }
  if (shieldSpawnId) {
    clearInterval(shieldSpawnId);
    shieldSpawnId = null;
  }
  // 모든 Support 및 Enemy의 타이머 정리
  gameObjects.forEach(go => {
    if (go && go.autoFireId) {
      clearInterval(go.autoFireId);
    }
  });
  // 보스 미사일 발사 타이머 정리
  if (boss && boss.fireId) {
    clearInterval(boss.fireId);
  }
}

function endGame(win) {
  stopGameIntervals();
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
  }, 200);
}

function resetGame() {
  // 기존 타이머 모두 중지
  stopGameIntervals();
  eventEmitter.clear();  // 모든 이벤트 리스너 제거, 이전 게임 세션 충돌 방지

  // 전역 상태 초기화
  gameObjects = [];
  boss = null;
  for (const key in keysPressed) { delete keysPressed[key]; }

  initGame();  // 게임 초기 상태 실행

  // 게임 루프 시작 (10ms 간격으로 부드러운 움직임)
  gameLoopId = setInterval(() => {
    // 1. 화면 지우기 및 배경 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundPattern) {
      ctx.fillStyle = backgroundPattern;
    } else {
      ctx.fillStyle = "black";
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 게임 객체 업데이트 및 그리기
    // 각 객체의 update 메서드가 있으면 호출
    gameObjects.forEach(go => { if (typeof go.update === 'function') go.update(); });
    drawGameObjects(ctx);
    drawPoints();
    drawLife();
    if (hero.hasShield) { drawShield(); } // 실드 그리기

    // 3. 상태 업데이트 및 충돌 감지
    updateGameObjects();
  }, 10); // 10ms (100FPS)로 게임 루프 설정 (부드러운 움직임)
}

// 실드 아이템 생성 함수
function spawnShieldItem() {
  if (gameObjects.filter(go => go.type === 'Shield').length === 0) {
    const shield = new Shield(
      Math.random() * (canvas.width - 50), // 랜덤 X 위치
      -50 // 캔버스 밖에서 시작
    );
    // --- 수정된 부분: 떨어지는 실드 아이템에 shieldIconImg 적용
    shield.img = shieldIconImg; 
    gameObjects.push(shield);
  }
}

function spawnMeteor() {
  const isBig = Math.random() < 0.3; // 30% 확률로 대형 메테오
  
  let sizeMultiplier;
  let speed = 5;
  let img;
  let width, height;

  if (isBig) {
    // 대형 메테오: 크기를 1.5배~3배로 랜덤 설정
    sizeMultiplier = 1.5 + Math.random() * 1.5; 
    img = meteorBigImg;
    width = 70 * sizeMultiplier;
    height = 70 * sizeMultiplier;
    speed = 4; // 대형 메테오는 조금 느리게
  } else {
    // 소형 메테오: 크기를 0.5배~1.5배로 랜덤 설정
    sizeMultiplier = 0.5 + Math.random(); 
    img = meteorSmallImg;
    width = 30 * sizeMultiplier;
    height = 30 * sizeMultiplier;
    speed = 6 + Math.random() * 4; // 소형 메테오는 빠르게
  }
  
  // X 위치 랜덤 설정 (캔버스 경계를 벗어나지 않게)
  const x = Math.random() * (canvas.width - width);
  const y = -height; // 캔버스 위에서 시작

  gameObjects.push(new Meteor(x, y, sizeMultiplier, speed, img));
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
    this.speed = 0;
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
  // 부드러운 움직임을 위한 update() 메서드
  update() {
    // 기본 구현에서는 아무것도 하지 않음
  }
}

// 적 캐릭터 클래스
class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    this.speed = 2; // 이동 속도
    this.canShoot = true; // 적 공격 여부
    this.fireRate = 3000; // 3초마다 공격
    this.lastFireTime = Date.now();
  }

  update() {
    // 화면 끝에 도달하면 정지
    // if (this.y < canvas.height - this.height) { // 기존 코드
    //   this.y += this.speed; // 아래로 이동 (매 프레임)
    // }

    this.y += this.speed; // 아래로 이동 (매 프레임)

    // --- 수정된 부분: 적이 캔버스 맨 아래에 닿으면 맨 위로 이동
    if (this.y > canvas.height) {
      // 캔버스 아래에 닿으면
      this.y = -this.height; // 맨 위로 이동
      // X 좌표를 랜덤하게 재배치
      this.x = Math.random() * (canvas.width - this.width);
    }
    // --- 수정된 부분 끝

    // 공격 로직 추가
    if (this.canShoot && Date.now() - this.lastFireTime > this.fireRate) {
      this.fire();
      this.lastFireTime = Date.now();
    }
  }

  fire() {
    // 적 레이저 발사 (EnemyLaser)
    const lx = this.x + this.width / 2 - 4.5;
    const ly = this.y + this.height + 10;
    gameObjects.push(new EnemyLaser(lx, ly));
  }
}

// 보스 캐릭터 클래스
class Boss extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.width = 150;
    this.height = 100;
    this.type = 'Boss';
    this.img = bossImg;
    this.life = 10; // 보스 체력
    this.speed = 1;
    this.fireRate = 2000; // 2초마다 공격
    this.lastFireTime = Date.now();
    this.direction = 1; // 1: 오른쪽, -1: 왼쪽
    this.moveRange = 100; // 중앙에서 좌우로 이동할 범위
    this.initialX = x;
  }

  update() {
    // 1. <--- 수정된 부분: 초기 등장 (화면 위에서 지정된 위치까지 하강)
    if (this.y < 100) { // Y=100까지 하강하도록 설정
      this.y += this.speed; 
    } else {
      // 2. 하강 완료 후 좌우 이동
      this.x += this.direction * this.speed;

      // 이동 범위 제한 (중앙 기준)
      if (this.x > this.initialX + this.moveRange || this.x < this.initialX - this.moveRange) {
        this.direction *= -1; // 방향 전환
      }
    }
    // -----------------------------------------------------

    // 공격 로직 (메테오 발사)
    if (Date.now() - this.lastFireTime > this.fireRate) {
      this.fire();
      this.lastFireTime = Date.now();
    }
  }

  fire() {
    // --- 수정된 부분: 메테오 대신 녹색 레이저(explosionImg) 발사
    const laserSpeed = 8;
    const size = 1; // 레이저 이미지를 사용하므로 크기 배수 고정

    gameObjects.push(new Meteor(this.x + this.width / 2, this.y + this.height, size, laserSpeed, explosionImg)); // 중앙 레이저
    gameObjects.push(new Meteor(this.x + 20, this.y + this.height, size, laserSpeed, explosionImg)); // 왼쪽 레이저
    gameObjects.push(new Meteor(this.x + this.width - 20, this.y + this.height, size, laserSpeed, explosionImg)); // 오른쪽 레이저
    // --- 수정된 부분 끝
  }

  decrementLife() {
    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  }
}

// 영웅 레이저 클래스
class Laser extends GameObject {
  constructor(x, y, opts = {}) {
    super(x, y);
    this.width = opts.width || 9;
    this.height = opts.height || 33;
    this.type = opts.type || 'Laser';
    this.img = opts.img || laserImg;
    this.speed = opts.speed || 15;
  }

  update() {
    this.y -= this.speed; // 위로 이동 (매 프레임)
    if (this.y < -this.height) {
      this.dead = true; // 화면 밖으로 나가면 제거
    }
  }
}

// 적 레이저 클래스
class EnemyLaser extends Laser {
  constructor(x, y) {
    super(x, y, { img: explosionImg, width: 9, height: 33, speed: -10, interval: 100, type: 'EnemyLaser' });
    this.speed = 10; // 아래로 이동
  }

  update() {
    this.y += this.speed; // 아래로 이동 (매 프레임)
    if (this.y > canvas.height) {
      this.dead = true; // 화면 밖으로 나가면 제거
    }
  }
}

// 메테오 클래스
class Meteor extends EnemyLaser {
  constructor(x, y, sizeMultiplier, speed, img) {
    super(x, y);
    this.width = (img === meteorBigImg ? 70 : 30) * sizeMultiplier;
    this.height = (img === meteorBigImg ? 70 : 30) * sizeMultiplier;
    this.img = img;
    this.type = 'Meteor';
    this.speed = speed;
  }
}

// 실드 아이템 클래스
class Shield extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 50;
    this.height = 50;
    this.type = 'Shield';
    this.speed = 5; // 아래로 이동 속도
  }

  update() {
    this.y += this.speed; // 아래로 이동
    if (this.y > canvas.height) {
      this.dead = true; // 화면 밖으로 나가면 제거
    }
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
    this.img = parent.defaultImg; // 플레이어 이미지 그대로 사용 (축소)
    this.autoFireInterval = 800; // ms
    this.lastFireTime = 0;
  }
  update() {
    // 부모 영웅의 위치를 기준으로 항상 갱신
    this.x = this.parent.x + this.offsetX;
    this.y = this.parent.y + (this.parent.height - this.height);
    // 자동 발사
    if (!this.dead && !this.parent.dead && Date.now() - this.lastFireTime > this.autoFireInterval) {
      this.fire();
      this.lastFireTime = Date.now();
    }
  }
  fire() {
    // 서포트 전용 작은 레이저 발사
    const lx = this.x + this.width / 2 - 3;
    const ly = this.y - 8;
    gameObjects.push(new Laser(lx, ly, { img: supportLaserImg, width: 6, height: 20, speed: 10 }));
  }
}

// 영웅 캐릭터 클래스
class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 99;
    this.height = 75;
    this.type = 'Hero';
    this.speed = 10; // 이동 속도
    this.cooldown = 0; // 초기화
    this.fireRate = 500; // 0.5초 쿨다운
    this.lastFireTime = 0;
    this.life = 3;
    this.points = 0;

    // 이미지 변경
    this.defaultImg = heroImg;
    this.leftImg = heroLeftImg;
    this.rightImg = heroRightImg;
    this.damagedImg = heroDamagedImg;
    this.img = this.defaultImg; // 현재 이미지

    // 실드 및 피격 상태
    this.hasShield = false;
    this.shieldDuration = 5000; // 5초
    this.shieldTimer = null;

    this.isDamaged = false; // 피격 애니메이션 상태
    this.damagedDuration = 500; // 0.5초
    this.damagedTimer = null;
  }

  update() {
    // 1. 움직임 처리 (키보드 누르고 있으면 연속 이동)
    if (keysPressed['ArrowUp'] && this.y > 0) {
      this.y -= this.speed;
    }
    if (keysPressed['ArrowDown'] && this.y < canvas.height - this.height) {
      this.y += this.speed;
    }

    // 좌우 이동 및 이미지 변경
    if (keysPressed['ArrowLeft'] && this.x > 0) {
      this.x -= this.speed;
      this.img = this.leftImg;
    } else if (keysPressed['ArrowRight'] && this.x < canvas.width - this.width) {
      this.x += this.speed;
      this.img = this.rightImg;
    } else {
      this.img = this.defaultImg;
    }

    // 피격 상태 이미지 오버라이드
    if (this.isDamaged) {
      this.img = this.damagedImg;
    }

    // 2. 발사 처리 (스페이스바 누르고 있으면 연속 발사)
    if (keysPressed[' '] && this.canFire()) {
      this.fire();
    }

    // 3. 실드 타이머 갱신 (추가)
    if (this.shieldTimer && Date.now() >= this.shieldTimer) {
      this.hasShield = false;
      this.shieldTimer = null;
    }
  }

  fire() {
    if (Date.now() - this.lastFireTime > this.fireRate) {
      // 영웅의 중앙에서 레이저 발사
      gameObjects.push(new Laser(this.x + this.width / 2 - 4.5, this.y - 10, { img: laserImg, width: 9, height: 33, speed: 15 }));
      this.lastFireTime = Date.now();
      return true;
    }
    return false;
  }

  canFire() {
    return Date.now() - this.lastFireTime > this.fireRate;
  }

  // 피격 처리
  takeDamage() {
    if (this.hasShield) {
      // 실드 활성화 시 피해 무시
      return;
    }
    if (this.isDamaged) {
      // 짧은 무적 시간
      return;
    }
    this.life--;
    this.isDamaged = true; // 피격 애니메이션 시작

    // 피격 애니메이션 타이머 설정
    if (this.damagedTimer) {
      clearTimeout(this.damagedTimer);
    }
    this.damagedTimer = setTimeout(() => {
      this.isDamaged = false;
      this.damagedTimer = null;
    }, this.damagedDuration);

    if (this.life <= 0) {
      this.dead = true;
      eventEmitter.emit(Messages.GAME_END_LOSS);
    }
  }

  // 실드 획득 처리
  activateShield() {
    this.hasShield = true;
    // 기존 타이머 클리어 후 새로운 타이머 설정
    if (this.shieldTimer) {
      clearTimeout(this.shieldTimer);
    }
    this.shieldTimer = Date.now() + this.shieldDuration;
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

// 보스 객체 생성
function createBoss() {
  if (boss) return; // 이미 보스가 있으면 생성하지 않음

  boss = new Boss(
    canvas.width / 2 - 75, // 150/2 = 75 (보스 중앙 정렬)
    -100 // 화면 밖에서 등장
  );
  gameObjects.push(boss);
}

// 영웅 객체 생성
function createHero() {
  hero = new Hero(
    canvas.width / 2 - 49.5, // 99/2 = 49.5 (영웅 중앙 정렬)
    canvas.height - 100 // 화면 하단에서 약간 위
  );
  hero.img = hero.defaultImg; // 초기 이미지
  gameObjects.push(hero);

  // 서포트(보조 우주선) 2기 추가: 좌우에 배치
  const supportOffset = 70; // 영웅 기준 X 오프셋
  const supportRightOffset = supportOffset + Math.floor(hero.width * 0.6) - 10;
  const supportLeft = new Support(hero, -supportOffset);
  const supportRight = new Support(hero, supportRightOffset);
  hero.supports = [supportLeft, supportRight];
  gameObjects.push(supportLeft, supportRight);
}

// 게임 초기화
function initGame() {
  // 기존 타이머 정리 및 객체 초기화
  stopGameIntervals();

  gameObjects = [];
  boss = null;
  createEnemies();
  createHero();

  // 실드 아이템 스폰 타이머 시작 (12초마다)
  shieldSpawnId = setInterval(spawnShieldItem, 12000);
  meteorSpawnId = setInterval(spawnMeteor, 3000);

  // ====================================================================
  // 키 이벤트 리스너 등록 (부드러운 움직임을 위해 onkeydown/onkeyup에서 처리)
  // ====================================================================
  // KEY_EVENT_SPACE는 update()에서 연속 발사를 위해 사용됨.
  // 여기서는 Enter 키만 처리
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    resetGame();
  });


  // ====================================================================
  // 충돌 이벤트 리스너 등록
  // ====================================================================

  // 영웅 레이저와 적 충돌
  eventEmitter.on(Messages.COLLISION_HERO_LASER, (_, { laser, enemy }) => {
    laser.dead = true;
    // 보스인지 일반 적인지 확인
    if (enemy.type === 'Boss') {
      enemy.decrementLife();
      // 보스는 바로 제거되지 않고 체력 감소
    } else {
      enemy.dead = true; // 일반 적 제거
      hero.incrementPoints();
      // 폭발 이펙트 생성
      const ex = new Explosion(enemy.x, enemy.y, enemy.width, enemy.height, explosionImg, 600);
      gameObjects.push(ex);
    }
    // --- 수정된 부분: 적이 모두 처리되면 보스 등장 (보스 등장 문제 해결)
    if (isEnemiesDead() && !boss) {
      // 일반 적(Enemy) 모두 제거 후 보스 등장
      createBoss();
    }
  });

  // 영웅과 적(Enemy/Boss) 충돌
  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    if (enemy.type !== 'Boss') {
      enemy.dead = true; // 일반 적만 제거
    }
    hero.takeDamage();
  });

  // 영웅과 적 레이저 충돌
  eventEmitter.on(Messages.COLLISION_HERO_ENEMY_LASER, (_, { laser }) => {
    laser.dead = true; // 적 레이저 제거
    hero.takeDamage();
  });

  // 영웅과 메테오 충돌
  eventEmitter.on(Messages.COLLISION_HERO_METEOR, (_, { meteor }) => {
    meteor.dead = true; // 메테오 제거
    hero.takeDamage();
  });

  // 영웅과 실드 아이템 충돌
  eventEmitter.on(Messages.COLLISION_HERO_SHIELD, (_, { shield }) => {
    shield.dead = true; // 실드 아이템 제거
    hero.activateShield(); // 실드 활성화
  });

  // 게임 종료 이벤트
  eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
  });
  eventEmitter.on(Messages.GAME_END_LOSS, () => {
    endGame(false);
  });
}

function drawLife() {
  const START_POS = canvas.width - 180;
  for (let i = 0; i < hero.life; i++) {
    ctx.drawImage(
      lifeImg,
      START_POS + (45 * (i + 1)),
      canvas.height - 37);
  }
}

function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height - 20);
}

function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}

// 실드 활성화 시 영웅 주변에 실드 그리기
function drawShield() {
  const centerX = hero.x + hero.width / 2;
  const centerY = hero.y + hero.height / 2;
  const shieldWidth = hero.width + 20; 
  const shieldHeight = hero.height + 20; 

  // --- 수정된 부분: 파란색 원 대신 shieldVisualImg (shield.png) 그리기
  if (shieldVisualImg) {
      ctx.drawImage(
        shieldVisualImg, 
        centerX - shieldWidth / 2, // 중앙 정렬
        centerY - shieldHeight / 2, // 중앙 정렬
        shieldWidth,
        shieldHeight
      );
  }
  
  // 남은 시간 표시 로직은 유지
  //const timeLeft = Math.max(0, hero.shieldTimer - Date.now());
  //const secondsLeft = Math.ceil(timeLeft / 1000);
  //ctx.font = "20px Arial";
  //ctx.fillStyle = "blue";
  //ctx.textAlign = "center";
  //drawText("SHIELD: " + secondsLeft + "s", centerX, centerY - shieldHeight / 2 - 10);
}


// 게임 객체 그리기
function drawGameObjects(ctx) {
  // 보스는 가장 뒤에 그려져야 메테오가 보스 위로 발사됨
  if (boss && !boss.dead) {
    boss.draw(ctx);
  }

  gameObjects.forEach(go => {
    if (go.type !== 'Boss') { // 보스는 이미 그렸으므로 제외
      go.draw(ctx);
    }
  });

  // 보스 체력 바 그리기
  if (boss && !boss.dead) {
    const barWidth = 100;
    const barHeight = 10;
    const x = boss.x + (boss.width - barWidth) / 2;
    const y = boss.y - barHeight - 5;
    const maxLife = 10;
    const currentLife = boss.life;

    ctx.fillStyle = "red";
    ctx.fillRect(x, y, barWidth, barHeight); // 배경
    ctx.fillStyle = "green";
    ctx.fillRect(x, y, barWidth * (currentLife / maxLife), barHeight); // 현재 체력
    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
}

// 게임 객체 상태 업데이트 및 충돌 감지
function updateGameObjects() {
  const heroRect = hero.rectFromGameObject();
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const lasers = gameObjects.filter((go) => go.type === "Laser" || go.type === "SupportLaser");
  const enemyLasers = gameObjects.filter((go) => go.type === "EnemyLaser");
  const meteors = gameObjects.filter((go) => go.type === "Meteor");
  const shields = gameObjects.filter((go) => go.type === "Shield");

  // 1. 영웅 레이저와 적/보스 충돌 감지
  lasers.forEach((l) => {
    // 일반 적
    enemies.forEach((m) => {
      if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_HERO_LASER, {
          laser: l,
          enemy: m,
        });
      }
    });
    // 보스
    if (boss && !boss.dead && intersectRect(l.rectFromGameObject(), boss.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_HERO_LASER, {
        laser: l,
        enemy: boss,
      });
    }
  });

  // 2. 적 레이저와 영웅 충돌 감지
  enemyLasers.forEach((l) => {
    if (intersectRect(l.rectFromGameObject(), heroRect)) {
      eventEmitter.emit(Messages.COLLISION_HERO_ENEMY_LASER, { laser: l });
    }
  });

  // 3. 메테오와 영웅 충돌 감지
  meteors.forEach((m) => {
    if (intersectRect(m.rectFromGameObject(), heroRect)) {
      eventEmitter.emit(Messages.COLLISION_HERO_METEOR, { meteor: m });
    }
  });

  // 4. 실드 아이템과 영웅 충돌 감지
  shields.forEach((s) => {
    if (intersectRect(s.rectFromGameObject(), heroRect)) {
      eventEmitter.emit(Messages.COLLISION_HERO_SHIELD, { shield: s });
    }
  });

  // 5. 적/보스와 영웅 충돌 감지
  enemies.forEach(enemy => {
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  });
  if (boss && !boss.dead && intersectRect(heroRect, boss.rectFromGameObject())) {
    eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy: boss });
  }

  // 6. 죽은 객체 제거
  gameObjects = gameObjects.filter((go) => !go.dead);
}


// 폭발 이펙트 클래스 (GameObject 클래스 정의 이후에 배치)
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

// 키다운 이벤트 핸들러 (기본 동작 차단용 및 키 상태 저장)
let onKeyDown = function (e) {
  switch (e.key) {
    case "ArrowLeft":
    case "ArrowRight":
    case "ArrowUp":
    case "ArrowDown":
    case " ": // 스페이스바
      e.preventDefault(); // 기본 동작 차단
      keysPressed[e.key] = true; // 키 상태 저장
      break;
    default:
      keysPressed[e.key] = true;
      break;
  }
};

// 키업 이벤트 핸들러 (키 상태 해제)
let onKeyUp = function (evt) {
  // 키 해제 시 키 상태 삭제
  if (evt.key === "ArrowUp" || evt.key === "ArrowDown" || evt.key === "ArrowLeft" || evt.key === "ArrowRight" || evt.key === " ") {
    delete keysPressed[evt.key];
  } else if (evt.key === "Enter") {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
};


// ====================================================================
// 이벤트 리스너 등록 (Event Listener Registrations)
// ====================================================================

window.addEventListener('keydown', onKeyDown);
window.addEventListener("keyup", onKeyUp);


// ====================================================================
// 애플리케이션 시작 (Application Start)
// ====================================================================

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  // 이미지 로드 (비동기)
  heroImg = await loadTexture("assets/player.png");
  heroLeftImg = await loadTexture("assets/playerLeft.png"); // 추가
  heroRightImg = await loadTexture("assets/playerRight.png"); // 추가
  heroDamagedImg = await loadTexture("assets/playerDamaged.png"); // 추가
  enemyImg = await loadTexture("assets/enemyShip.png");
  bossImg = await loadTexture("assets/enemyUFO.png"); // 추가
  meteorBigImg = await loadTexture("assets/meteorBig.png"); // 추가
  meteorSmallImg = await loadTexture("assets/meteorSmall.png"); // 추가
  laserImg = await loadTexture("assets/laserRed.png");
  supportLaserImg = await loadTexture('assets/laserRed.png');
  explosionImg = await loadTexture('assets/laserGreenShot.png'); // 적 레이저 이미지로도 사용
  lifeImg = await loadTexture("assets/life.png");

  // --- 수정된 부분: 이미지 로드 분리 및 변수명 변경
  shieldVisualImg = await loadTexture("assets/shield.png"); // 플레이어에게 생기는 실드 이미지
  shieldIconImg = await loadTexture("assets/shieldIcon.png"); // 떨어지는 실드 아이템 이미지

  backgroundImage = await loadTexture('assets/Background/starBackground.png'); // 배경 이미지 로드
  // createPattern을 사용하여 4x4 타일 배경 생성
  backgroundPattern = ctx.createPattern(backgroundImage, 'repeat');

  // 게임 초기화 및 루프 시작
  resetGame();
};