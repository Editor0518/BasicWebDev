let lastZIndex=10; //plant zindex

 function dragElement(terrariumElement) {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;


    let startPosX, startPosY, endPosX, endPosY;
    terrariumElement.onpointerdown = pointerDrag;

    terrariumElement.ondblclick = dblClickToFront;

    function pointerDrag(e) {//1번만 실행
        e.preventDefault();
        //console.log(e);
        pos3 = e.clientX;
        pos4 = e.clientY;

        startPosX=pos3;
        startPosY=pos4;

        document.onpointermove = elementDrag;
        document.onpointerup = stopElementDrag;
    }
    function elementDrag(e) {//여러번 실행
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        //console.log(pos1, pos2, pos3, pos4);
        terrariumElement.style.top = terrariumElement.offsetTop - pos2 + 'px';
        terrariumElement.style.left = terrariumElement.offsetLeft - pos1 + 'px';
    }
    function stopElementDrag(e) {
        endPosX=e.clientX;
        endPosY=e.clientY;

        if(startPosX!==endPosX && startPosY!==endPosY){
            bringToFront(terrariumElement); //선택한 식물에서 포인터를 떼었을 때, 맨 앞으로 옮기려는 경우
            console.log("moved", startPosX, startPosY, endPosX, endPosY);
        }
        document.onpointerup = null;
        document.onpointermove = null;
        
    }

    function dblClickToFront(e) {
        bringToFront(terrariumElement);
        console.log("dblclicked");
    }
}
function bringToFront(element){
    element.style.zIndex = ++lastZIndex;
}

console.log(document.getElementById('plant1'));
dragElement(document.getElementById('plant1'));
dragElement(document.getElementById('plant2'));
dragElement(document.getElementById('plant3'));
dragElement(document.getElementById('plant4'));
dragElement(document.getElementById('plant5'));
dragElement(document.getElementById('plant6'));
dragElement(document.getElementById('plant7'));
dragElement(document.getElementById('plant8'));
dragElement(document.getElementById('plant9'));
dragElement(document.getElementById('plant10'));
dragElement(document.getElementById('plant11'));
dragElement(document.getElementById('plant12'));
dragElement(document.getElementById('plant13'));
dragElement(document.getElementById('plant14'));
