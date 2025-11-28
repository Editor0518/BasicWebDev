//Drag and Drop API 방식으로 인해 이미지가 복사되는데, 기존 식물 이미지를 안보이게 하는 버그가 도저히 해결이 안되서 AI에게 물어봤습니다.
let lastZIndex = 10; 
const terrariumContainer = document.getElementById('terrarium-container');
const dropZone = document.body; 

let draggedElement = null;
let dropSuccess = false; // drop 성공 여부 플래그

function bringToFront(element) {
    element.style.zIndex = ++lastZIndex;
}

// -------------------------------------------------------------
// 1. HTML Drag and Drop API 기반 드래그 로직 (수정됨: 복사 버그 해결)

function initializePlantDrag(plantElement) {
    plantElement.setAttribute('draggable', 'true');

    plantElement.addEventListener('dragstart', (e) => {
        const targetElement = e.target.closest('.plant') || e.target;
        
        e.dataTransfer.setData('text/plain', targetElement.id);
        e.dataTransfer.effectAllowed = 'move'; 
        
        draggedElement = targetElement;
        dropSuccess = false; // 매 드래그 시작 시 초기화
        
        //원본 요소를 DOM에서 임시 제거
        setTimeout(() => {
            targetElement.style.display = 'none';
            // targetElement.remove(); // 완전 제거하는 대신 display:none을 유지합니다.
        }, 0);
        
        targetElement.style.position = 'absolute';
        bringToFront(targetElement); 
    });

    // 1-4. dragend: 드래그 종료 시 (복사 버그 최종 해결)
    plantElement.addEventListener('dragend', (e) => {
        
        // ✨ 핵심 해결: dropSuccess가 false이면 (drop 이벤트가 실패했거나, 휴지통이 아닌 곳에 드롭했거나)
        // 숨겼던 원본 요소를 다시 표시하여 복사 버그를 해결합니다.
        if (!dropSuccess && draggedElement) {
            draggedElement.style.display = 'block';
        }

        draggedElement = null;
    });

    // 1-5. dblclick: 맨 앞으로 가져오기 기능 유지
    plantElement.addEventListener('dblclick', (e) => {
        bringToFront(e.currentTarget);
    });
}

// ... (2. 초기 식물에 드래그 기능 적용 로직은 동일) ...
const initialPlantIds = [
    'plant1', 'plant2', 'plant3', 'plant4', 'plant5', 'plant6', 'plant7',
    'plant8', 'plant9', 'plant10', 'plant11', 'plant12', 'plant13', 'plant14'
];

initialPlantIds.forEach(id => {
    const plant = document.getElementById(id);
    if (plant) {
        initializePlantDrag(plant);
    }
});


// -------------------------------------------------------------
// 3. 화면 전체(body)를 드롭 존으로 설정 및 이동/로드 로직 (수정됨: 이동 범위 확장)

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    
    // 테라리움 컨테이너 위로 드래그할 때만 피드백 제공
    if (e.target.closest('#terrarium-container')) {
        terrariumContainer.style.border = '2px dashed blue';
    } else {
        terrariumContainer.style.border = 'none'; // 유리병 밖에서는 피드백 제거
    }
});

dropZone.addEventListener('dragleave', (e) => {
    // leave 이벤트는 복잡하므로, dropover에서 처리된 피드백을 유지합니다.
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); 
    terrariumContainer.style.border = 'none'; 

    const files = e.dataTransfer.files;
    const dataId = e.dataTransfer.getData('text/plain');
    const isOverTerrarium = e.target.closest('#terrarium-container');
    
    // 1. 파일 드롭 (테라리움 위에서만 가능)
    if (files.length > 0 && isOverTerrarium) {
        // ... (파일 드롭 로직은 동일) ...
        const file = files[0]; 
        if (file.type.startsWith('image/')) {
            // ... (newPlant 생성 로직) ...
            const reader = new FileReader();
            reader.onload = (event) => {
                const newPlant = document.createElement('img');
                newPlant.src = event.target.result;
                newPlant.classList.add('plant', 'user-added'); 
                newPlant.id = `user-plant-${Date.now()}`; 
                newPlant.style.position = 'absolute'; 
                newPlant.style.width = '100px'; 
                newPlant.style.height = '100px';
                initializePlantDrag(newPlant); 
                
                const rect = terrariumContainer.getBoundingClientRect();
                const dropX = e.clientX - rect.left;
                const dropY = e.clientY - rect.top;
                
                newPlant.style.left = `${dropX - 50}px`; 
                newPlant.style.top = `${dropY - 50}px`;

                terrariumContainer.appendChild(newPlant);
                bringToFront(newPlant);
            };
            reader.readAsDataURL(file); 
            dropSuccess = true; // 파일 드롭 성공!

        } else {
            alert('이미지 파일만 드롭할 수 있습니다.');
        }

    } else if (dataId && draggedElement) {
        // 2. 식물 이동 (드래그 앤 드롭)
        
        if (isOverTerrarium) {
            // **A. 테라리움 범위 내에 드롭된 경우: 이동 처리**
            
            // 1. DOM에 다시 추가하고 보이게 함
            draggedElement.style.display = 'block';

            // 2. 부모 변경 (최초 드래그 시 plant-holder에서 분리)
            if (draggedElement.parentElement !== terrariumContainer) {
                 terrariumContainer.appendChild(draggedElement);
            }

            // 3. 정확한 위치 업데이트
            const rect = terrariumContainer.getBoundingClientRect();
            const dropX = e.clientX - rect.left;
            const dropY = e.clientY - rect.top;

            draggedElement.style.left = `${dropX - (draggedElement.clientWidth / 2)}px`;
            draggedElement.style.top = `${dropY - (draggedElement.clientHeight / 2)}px`;
            bringToFront(draggedElement);
            
            dropSuccess = true; // 이동 성공!
            
        } else {
             // **B. 테라리움 범위 외부에 드롭된 경우: 원본 복원**
            draggedElement.style.display = 'block';
            dropSuccess = false; // drop은 발생했으나 이동은 실패
        }
        
    }
});


// -------------------------------------------------------------
// 4. 휴지통 기능 (수정됨: 복사 버그 해결)

const trashCan = document.getElementById('trash-can'); 

if (trashCan) {
    trashCan.addEventListener('drop', (e) => {
        e.preventDefault();
        trashCan.style.backgroundColor = 'transparent';

        const plantId = e.dataTransfer.getData('text/plain'); 
        const plantToRemove = document.getElementById(plantId);
        
        if (plantToRemove) {
             //DOM에서 제거하기 전에 display: block으로 복구
             plantToRemove.style.display = 'block'; 
             plantToRemove.remove();
             dropSuccess = true; // 삭제 성공!
        }
    });
}

// -------------------------------------------------------------
// 5. 초기화 버튼 기능 (로직 변경 없음)

const resetButton = document.getElementById('reset-button'); 

if (resetButton) {
    resetButton.addEventListener('click', () => {
        const userPlants = terrariumContainer.querySelectorAll('.user-added');
        userPlants.forEach(plant => plant.remove());
        window.location.reload(); 
    });
}