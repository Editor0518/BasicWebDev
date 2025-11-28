// blackjack.js
//player's cards
let cardOne = Math.floor(Math.random() * 10) + 1; //first card (1~10)
let cardTwo = Math.floor(Math.random() * 10) + 1; //second card (1~10)
let cardThree = Math.floor(Math.random() * 10) + 1; //third card (1~10)
let sum = cardOne + cardTwo + cardThree; //sum of player's cards

console.log(`You have ${sum} points (${cardOne} + ${cardTwo} + ${cardThree})`);

//bank's cards
let cardOneBank = Math.floor(Math.random() * 10) + 1; //first card (1~10)
let cardTwoBank = Math.floor(Math.random() * 10) + 1; //second card (1~10)
let cardThreeBank = Math.floor(Math.random() * 10) + 1; //third card (1~10)
let bankSum = cardOneBank + cardTwoBank + cardThreeBank;

console.log(`Bank have ${bankSum} points (${cardOneBank} + ${cardTwoBank} + ${cardThreeBank})`);

// 5. 21점을 초과한 쪽이 무조건 패배. -- 플레이어 
if (sum > 21) {
    console.log('You lost (over 21)');
    return;
}
//2. 플레이어가 21점을 달성하면 블랙잭 (즉시 승리).
else if (sum === 21) {
    console.log('Blackjack! You win');
    return;
}

//3. 딜러는 17점 이상일 때 멈춰야 하고, 그 미만일 때는 추가 카드를 뽑아야 함.
while (bankSum < 17) {
    let cardMoreBank = Math.floor(Math.random() * 10) + 1; // 1~10 사이의 랜덤 숫자
    let previousBankSum = bankSum;
    bankSum += cardMoreBank;
    console.log(`Bank draws a card: ${cardMoreBank}, total points: ${bankSum} (${previousBankSum} + ${cardMoreBank})`);
}

//5. 21점을 초과한 쪽이 무조건 패배. -- 딜러
if (bankSum > 21) {
    console.log('Bank lost (over 21)');
    return;
}
else if (bankSum === 21) {
    console.log('Blackjack! Bank wins');
    return;
}

//1. 플레이어와 딜러의 카드 합계가 21을 넘으면 Bust (패배).
if (sum > 21 && bankSum > 21) {
    console.log('Bust (both over 21)');
    return;
}
// 4. 카드 합계가 같은 경우 무승부 (Draw).
else if (sum === bankSum) {
    console.log('Draw');
    return;
}
else if (sum > bankSum) {
    console.log(`You win (you:${sum} > bank:${bankSum})`);
    return;
}
else {
    console.log(`Bank wins (you:${sum} < bank:${bankSum})`);
    return;
}

/*블랙잭 규칙을 적용하여 blackjack.js 파일을 수정해보세요.
1. 플레이어와 딜러의 카드 합계가 21을 넘으면 Bust (패배).
2. 플레이어가 21점을 달성하면 블랙잭 (즉시 승리).
3. 딜러는 17점 이상일 때 멈춰야 하고, 그 이하일 때는 추가 카드를 뽑아야 함.
4. 카드 합계가 같은 경우 무승부 (Draw).
5. 21점을 초과한 쪽이 무조건 패배.
*/
/*블랙잭?
- 카드 합계 점수가 21을 넘지 않으면서 최대한 21에 가까운 사람이 승리하는 게임
- 숫자 카드 2~10, 그림 카드(J, Q, K)는 10, 에이스(A)는 1 or 10
- 딜러의 합계가 21을 초과하면 플레이어 승리
- 첫 두장의 카드가 21이면 블릭잭이며, 플레이어 승리
- 딜러는 17점 이상이 될 때까지 카드를 받아야 함
- 플레이어와 딜러의 점수가 같으면 무승부
*/