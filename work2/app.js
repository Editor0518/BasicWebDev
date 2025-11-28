/* 게임 변수 3개 선언 */
 const STARTING_POKER_CHIPS = 100; // points
 const PLAYERS = 3;
 const NO_OF_STARTER_CARDS = 2;

 /* 3개의 플레이어 시작 점수 할당 */
 // 플레이어 3명, 각자 100점씩 시작
 let playerOnePoints = STARTING_POKER_CHIPS;
 let playerTwoPoints = STARTING_POKER_CHIPS;
 let playerThreePoints = STARTING_POKER_CHIPS;

 /* 점수 배팅 */
 playerOnePoints -= 50;
 playerTwoPoints -= 25;
 playerThreePoints += 75; 

let playerOneName = "Chloe"; playerOneName = "Chloe";
let playerTwoName = "Jasmine"; playerTwoName = "Jasmine";
let playerThreeName = "Jen"; playerThreeName = "Jen";

console.log(`Welcome! 챔피언십 타이틀은 ${playerOneName},
${playerTwoName} 선수는  ${playerThreeName} 중 한 명에게 주어집니다. 각 선수는 
${STARTING_POKER_CHIPS} 의 칩을 가지고 시작합니다. 흥미진진한 경기가 될
것입니다. 최고의 선수가 승리하길 바랍니다!`);

let gameHasEnded = false;
gameHasEnded = ((playerOnePoints + playerTwoPoints) == 0) || 
               ((playerTwoPoints + playerThreePoints) == 0) ||
               ((playerOnePoints + playerThreePoints) == 0);
console.log( "Game has ended: ", gameHasEnded);

function displayGreeting (name, salutation="Hello") {
 console .log(` ${salutation} ${name} `);
}

const message = displayGreeting('Ornella');
document.write(message);

function displayDone () {
 console.log('Done!');
}

setTimeout(
    function() {
// anonymous function
        console.log('Done!');
    }, 3000 //3 seconds
)

setTimeout(() => console.log('Done!'), 3000); // arrow function

setTimeout( () => {document.write('...Hello again!');}, 2000);

setTimeout(displayDone(), 3000); // 즉시 실행
setTimeout(displayDone, 3000);// 3초후 실행



