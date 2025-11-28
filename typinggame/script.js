document.addEventListener('DOMContentLoaded', () => { //DOM이 로드되지 않아 뜨는 오류가 있어서 수정

const quotes = [
    'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    'There is nothing more deceptive than an obvious fact.',
    'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
    'I never make exceptions. An exception disproves the rule.',
    'What one man can invent another can discover.',
    'Nothing clears up a case so much as stating it to another person.',
    'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
];

let words = [];
let wordIndex = 0;
let startTime = Date.now();
let currentQuoteIndex = -1;

const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');

//모달 관련
const modal = document.getElementById('result-modal');
const modalTimeResult = document.getElementById('modal-time-result');
const modalBestTime = document.getElementById('modal-best-time');

const closeButton = document.querySelector('.close-button');
const modalStartButton = document.getElementById('modal-start-button');
const startButton = document.getElementById('start'); // 기존 start 버튼 재사용

document.getElementById('start').addEventListener('click', () => {

    const quoteIndex = Math.floor(Math.random() * quotes.length);  // 무작위 인덱스 생성
    currentQuoteIndex = quoteIndex;
    const quote = quotes[quoteIndex]; // 무작위 인덱스 값으로 인용문 선택

    words = quote.split(' ');  // 공백 문자를 기준으로 words 배열에 저장
    wordIndex = 0;

    const spanWords = words.map(function(word) { return `<span>${word} </span>`}); // span 태그로 감싼 후 배열에 저장
    quoteElement.innerHTML = spanWords.join('');  // 하나의 문자열로 결합 및 설정
    quoteElement.childNodes[0].className = 'highlight'; // 첫번째 단어 강조
    messageElement.innerText = ''; // 메시지 요소 초기화
    typedValueElement.disabled = false; // 텍스트 상자 활성화
    typedValueElement.value = '';  //입력 필드 초기화
    typedValueElement.focus();

    //input에 type here...이라는 텍스트 추가하기
    typedValueElement.setAttribute('placeholder', 'Type here...');

    // Practice your typing skills with a quote from Sherlock Holmes. 를 숨기기
    document.getElementById('info').style.display = 'none';
    document.getElementById('start-info').style.display = 'none';

    //start button 비활성화
    document.getElementById('start').disabled = true;

    startTime = new Date().getTime(); // 타이핑 시작 시간 기록
});

typedValueElement.addEventListener('input', () => {
    const currentWord = words[wordIndex];
    const typedValue = typedValueElement.value;

    // 마지막 단어인지 확인
    const isLastWord = wordIndex === words.length - 1;

    const timeElement = document.getElementById('time');
    const elapsedTimeInSeconds = ((new Date().getTime() - startTime) / 1000).toFixed(2); 
    timeElement.innerHTML = `<i class="fa-solid fa-clock"></i> Time: ${elapsedTimeInSeconds} seconds`;

    if (isLastWord && (typedValue === currentWord)) {
        const elapsedTime = new Date().getTime() - startTime; // 게임 완료
        
        // 1. 모달창 표시 함수 호출
        showModal(elapsedTime);
        
        // 게임 완료 후 입력 필드 및 상태 정리
        messageElement.innerText = '';
        typedValueElement.value = '';
        typedValueElement.className = ''; 
        wordIndex = 0; 
        quoteElement.childNodes.forEach(child => child.className = ''); 
        
        // startButton.disabled는 closeModal()에서 처리

       } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) { // 입력된 값이 공백으로 끝났는지와 공백을 제거한 값이 현재 단어와 일치하는 지 확인
        typedValueElement.value = '';
        wordIndex++;
        for (const wordElement of quoteElement.childNodes) { // 모든 강조 표시 제거
            wordElement.className = ''; 
        }
        quoteElement.childNodes[wordIndex].className = 'highlight'; // 다음으로 타이핑할 단어
     } else if (currentWord.startsWith(typedValue)) { //현재 단어의 일부를 맞게 입력하고 있는 지 확인
        typedValueElement.className = ''; 
    } else {
        typedValueElement.className = 'error'; // 틀리면 error 클래스 추가
  }
 });

// 2. 최고 기록을 로컬 스토리지에서 가져와 초기화 함수
function getBestTime() {
    // 'bestTime-0', 'bestTime-1', 'bestTime-2', ...
    const key = `bestTime-${currentQuoteIndex}`;
    const bestTime = localStorage.getItem(key);
    return bestTime ? Number(bestTime) : null;
}

// 모달 닫기 함수
function closeModal() {
    modal.style.display = 'none';
    // 모달 닫기 시 start 버튼 재활성화
    startButton.disabled = false;
    // 입력 필드 다시 비활성화
    typedValueElement.disabled = true;
    typedValueElement.value = '';
}

// 모달 열기 함수 (게임 완료 시 호출)
function showModal(elapsedTime) {
    const timeInSeconds = (elapsedTime / 1000).toFixed(2);
    let bestTimeInSeconds = null;
    
    // 현재 문장의 고유 키 생성
    const key = `bestTime-${currentQuoteIndex}`; // ✅ 저장 키

    // 2. 최고 기록 업데이트 및 표시
    const previousBest = getBestTime(); // ✅ getBestTime은 이미 문장별 키 사용
    let isNewBest = false;

    if (!previousBest || elapsedTime < previousBest) {
        localStorage.setItem(key, elapsedTime); // ✅ 문장별 키에 저장
        bestTimeInSeconds = timeInSeconds; // 새로운 최고 기록
        isNewBest = true;
    } else {
        bestTimeInSeconds = (previousBest / 1000).toFixed(2);
    }

    modalTimeResult.innerHTML = `<i class="fa-solid fa-hourglass-end"></i> 소요 시간: <b>${timeInSeconds} 초</b>`;
    
    if (isNewBest) {
        modalBestTime.innerHTML = `🎉 NEW BEST TIME 🎉`;
        modalBestTime.style.color = 'gold';
    } else {
        // 문장 번호를 표시하여 어떤 문장의 최고 기록인지 알려줄 수도 있습니다.
        modalBestTime.innerHTML = `🏆 최고 기록 (문장 #${currentQuoteIndex + 1}): ${bestTimeInSeconds} 초`;
        modalBestTime.style.color = 'forestgreen';
    }

    modal.style.display = 'block'; // 모달 표시
}


// --- 이벤트 리스너 설정 ---

// 게임 시작 버튼
startButton.addEventListener('click', () => {
    // start-info와 info를 숨기기 위해 다시 설정 (modal 닫기 시 info가 다시 숨겨지지 않을 수 있으므로)
    document.getElementById('info').style.display = 'none';
    document.getElementById('start-info').style.display = 'none';
    
    // 이전에 typedValueElement에 남아있을 수 있는 'error' 클래스를 제거
    typedValueElement.className = '';
    
    // 게임 시작 로직 (기존 코드와 동일)
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[quoteIndex]; 
    words = quote.split(' ');
    wordIndex = 0;

    const spanWords = words.map(function(word) { return `<span>${word} </span>`});
    quoteElement.innerHTML = spanWords.join(''); 
    quoteElement.childNodes[0].className = 'highlight'; 
    messageElement.innerText = '';
    typedValueElement.disabled = false;
    typedValueElement.value = '';
    typedValueElement.focus();
    typedValueElement.setAttribute('placeholder', 'Type here...');
    startButton.disabled = true;

    startTime = new Date().getTime(); 
});

// 모달 닫기 버튼
closeButton.addEventListener('click', closeModal)

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        closeModal();
    }
});

// 모달 내부 "다시 시작" 버튼
modalStartButton.addEventListener('click', () => {
    closeModal();
    startButton.click(); // start 버튼 클릭 이벤트 재실행
});

// input 이벤트 리스너
typedValueElement.addEventListener('input', () => {
    const currentWord = words[wordIndex];
    const typedValue = typedValueElement.value;

    const timeElement = document.getElementById('time');
    const elapsedTimeInSeconds = ((new Date().getTime() - startTime) / 1000).toFixed(2); 
    timeElement.innerHTML = `<i class="fa-solid fa-clock"></i> Time: ${elapsedTimeInSeconds} seconds`;

    if (typedValue === currentWord && wordIndex === words.length - 1) { // 게임 완료
        const elapsedTime = new Date().getTime() - startTime; 
        
        // 1. 모달창 표시 함수 호출
        showModal(elapsedTime); 
        
        // 게임 완료 후 입력 필드 및 상태 정리
        messageElement.innerText = ''; // 모달이 결과를 보여주므로 메시지 창은 비움
        typedValueElement.value = '';
        typedValueElement.className = ''; 
        wordIndex = 0; 
        quoteElement.childNodes.forEach(child => child.className = ''); 
        
        // startButton.disabled는 closeModal()에서 처리

    } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) { // 다음 단어로 이동
        typedValueElement.value = '';
        wordIndex++;
        for (const wordElement of quoteElement.childNodes) {
            wordElement.className = '';
        }
        if (wordIndex < quoteElement.childNodes.length) {
             quoteElement.childNodes[wordIndex].className = 'highlight';
        }
    } else if (currentWord.startsWith(typedValue)) { 
        // 3. input 이벤트 입력 시 CSS 효과: 올바르게 입력 중일 때 'error' 클래스 제거
        typedValueElement.className = ''; 
    } else {
        // 3. input 이벤트 입력 시 CSS 효과: 잘못 입력 중일 때 'error' 클래스 추가
        typedValueElement.className = 'error'; 
    }
});


 /*
 1. (실습) 업그레이드 해보기
    ○ CSS를 추가하여 타이핑 게임 꾸미기
    ○완료 시 이벤트 리스너를 비활성화하고 input 및 button 클릭 시 다시 활성화
    ○font-awesome 아이콘을 사용하여 꾸미기 
    ○게임이 완료되면 텍스트 상자를 비활성화
2. (과제) 더 많은 기능 추가
    ○결과를 더 돋보이게 할 모달창을 표시
    ○ localStorage를 사용하여 최고 점수 저장
    ○ input 이벤트 입력 시 CSS를 추가하여 여러가지 효과 적용해보기
*/

/*
> localStorage.setItem('nums', JSON.stringify([1, 2, 3]))
undefined
> JSON.parse(localStorage.getItem('nums'))
[1, 2, 3]


// 키에 데이터 쓰기
localStorage.setItem("key", value);

// 키로 부터 데이터 읽기
localStorage.getItem("key");

// 키의 데이터 삭제
localStorage.removeItem("key");

// 모든 키의 데이터 삭제
localStorage.clear();

// 저장된 키/값 쌍의 개수
localStorage.length;
*/
});