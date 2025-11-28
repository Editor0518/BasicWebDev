// 변수들을 넣어줌
// form fields
 const form = document.querySelector('.form-data');
 const region = document.querySelector('.region-name');
 const apiKey = document.querySelector('.api-key');
 // results
 const errors = document.querySelector('.errors');
 const loading = document.querySelector('.loading');
 const results = document.querySelector('.result-container');
 const usage = document.querySelector('.carbon-usage');
 const fossilfuel = document.querySelector('.fossil-fuel');
 const myregion = document.querySelector('.my-region');
 const clearBtn = document.querySelector('.clear-btn');

 form.addEventListener('submit', (e) => handleSubmit(e)); //리스너 추가
 clearBtn.addEventListener('click', (e) => reset(e));
 init();

function reset(e) { //리셋 함수
    e.preventDefault();
    localStorage.removeItem('regionName');
    init();
 }
 
function init() { //init 함수 초기화 함수
    const storedApiKey = localStorage.getItem('apiKey');
    const storedRegion = localStorage.getItem('regionName');
    //set icon to be generic green
    //todo
    if (storedApiKey === null || storedRegion === null) {
        form.style.display = 'block';
        results.style.display = 'none';
        loading.style.display = 'none';
        clearBtn.style.display = 'none';
        errors.textContent = '';
    } else {
        displayCarbonUsage(storedApiKey, storedRegion);
        results.style.display = 'none';
        form.style.display = 'none';
        clearBtn.style.display = 'block';
    }
 };

 function handleSubmit(e) { //handleSubmit 함수: form 제출 처리
    e.preventDefault();
    setUpUser(apiKey.value, region.value);
 }

 function setUpUser(apiKey, regionName) { //setUpUser 함수: apiKey, regionName 로컬 저장소 값 설정
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('regionName', regionName);
    loading.style.display = 'block';
    errors.textContent = '';
    clearBtn.style.display = 'block';
    displayCarbonUsage(apiKey, regionName);
 }