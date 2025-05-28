// 攝影機與紅框設定
const video = document.getElementById('camera');
const btnPH = document.getElementById('btnPH');
const btnOxygen = document.getElementById('btnOxygen');
const btnTurbidity = document.getElementById('btnTurbidity');
const analyzeBtn = document.getElementById('analyzeBtn');
const result = document.getElementById('result');
const redBox1 = document.getElementById('redBox1');
const boxLabel = document.getElementById('boxLabel');

let stream;
let interval;
let logRGBValues = [];

let redBoxPositions = {
    redBox1: { left: 0, top: 0 },
};

// 啟動攝影機功能
async function startCamera() {
    video.setAttribute('playsinline', true);
    video.setAttribute('webkit-playsinline', true);

    try {
        const constraints = {
            video: { facingMode: 'environment' }
        };

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("瀏覽器不支援 getUserMedia");
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        isCameraNotReady = false;
        analyzeBtn.disabled = false;

    } catch (err) {
        console.error("攝影機錯誤: ", err);
        result.innerHTML = `錯誤：無法啟動攝影機。${err.message}`;
        alert("請開啟攝像頭！")
        analyzeBtn.disabled = true;
    }
}

// 開啟相機
startCamera()

// 紅框拖曳功能
function makeDraggable(box) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    function startDragging(e) {
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const parentRect = box.offsetParent.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();

        offsetX = clientX - boxRect.left;
        offsetY = clientY - boxRect.top;

        e.preventDefault();
        e.stopPropagation();
        document.body.style.cursor = 'grabbing';
    }

    function moveDragging(e) {
        if (!isDragging) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const parent = box.offsetParent;
        const camera = document.getElementById('camera');
        const parentRect = parent.getBoundingClientRect();
        const cameraRect = camera.getBoundingClientRect();

        const cameraOffsetLeft = cameraRect.left - parentRect.left;
        const cameraOffsetTop = cameraRect.top - parentRect.top;

        const boxWidth = box.offsetWidth;
        const boxHeight = box.offsetHeight;

        const rawLeft = clientX - parentRect.left - offsetX;
        const rawTop = clientY - parentRect.top - offsetY;

        const minLeft = cameraOffsetLeft;
        const maxLeft = cameraOffsetLeft + camera.offsetWidth - boxWidth;
        const minTop = cameraOffsetTop;
        const maxTop = cameraOffsetTop + camera.offsetHeight - boxHeight;

        const newLeft = Math.max(minLeft, Math.min(rawLeft, maxLeft));
        const newTop = Math.max(minTop, Math.min(rawTop, maxTop));

        box.style.left = `${newLeft}px`;
        box.style.top = `${newTop}px`;

        redBoxPositions[box.id] = { left: newLeft, top: newTop };
    }

    function stopDragging() {
        isDragging = false;
        document.body.style.cursor = 'default';
    }

    box.addEventListener('mousedown', startDragging);
    box.addEventListener('touchstart', startDragging);
    document.addEventListener('mousemove', moveDragging);
    document.addEventListener('touchmove', moveDragging, { passive: false });
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);
}

// 計算紅框 RGB 值平均
function getAverageColor(box) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const videoRect = video.getBoundingClientRect();
    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    const boxLeft = redBoxPositions[box.id].left;
    const boxTop = redBoxPositions[box.id].top;
    const boxWidth = box.offsetWidth;
    const boxHeight = box.offsetHeight;

    const boxX = boxLeft * scaleX;
    const boxY = boxTop * scaleY;
    const boxW = boxWidth * scaleX;
    const boxH = boxHeight * scaleY;

    const safeX = Math.max(0, Math.min(boxX, canvas.width - boxW));
    const safeY = Math.max(0, Math.min(boxY, canvas.height - boxH));

    const imageData = ctx.getImageData(safeX, safeY, boxW, boxH).data;

    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
    }

    return { r: r / count, g: g / count, b: b / count };
}

//拖曳紅框
makeDraggable(redBox1);

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
if (isMobile) {
    document.body.style.overflow = 'hidden';
}

//按鈕功能
//pH
btnPH.addEventListener("click", function () {
        // 1. 改紅框邊框顏色
        redBox1.style.borderColor = '#1976D2';

        // 2. 改標籤文字
         boxLabel.textContent = "酸鹼值";

        //算式

});

//溶氧
btnOxygen.addEventListener("click", function () {
        // 1. 改紅框邊框顏色
        redBox1.style.borderColor = '#4CAF50';

        // 2. 改標籤文字
         boxLabel.textContent = "溶氧量";

        //算式
});

//濁度
btnTurbidity.addEventListener("click", function () {
        // 1. 改紅框邊框顏色
        redBox1.style.borderColor = '#EF6C00';

        // 2. 改標籤文字
         boxLabel.textContent = "濁度";

        //算式
});

//分析
analyzeBtn.addEventListener("click", function () {
    const color = getAverageColor(redBox1);
    result.innerHTML = `R: ${color.r.toFixed(2)}<br>G: ${color.g.toFixed(2)}<br>B: ${color.b.toFixed(2)}`;
    const labelText = boxLabel.textContent.trim();
    
    if(labelText === "酸鹼值")
    {
        // pH值 算式

    }
    else if(labelText === "溶氧量")
    {
        //溶氧量 算式

    }
    else if(labelText === "濁度")
    {
        //濁度 算式

    }
    else
    {
        alert("請選擇檢測項目！");
    }
});