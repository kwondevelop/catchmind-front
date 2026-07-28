<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { stompService } from '../services/stompClient';
import { globalState } from '../store'; // 상태 관리 파일 import

const props = defineProps({ roomId: { type: String, default: 'room-1' } });

const canvasRef = ref(null);
let ctx = null;

const isDrawing = ref(false);
const penColor = ref('#000000');
const penWidth = ref(5);

let lastX = 0;
let lastY = 0;

// 내가 출제자인지 확인하는 계산된 속성
const isMyTurn = computed(() => {
    return globalState.drawerId === globalState.myNickname;
});

onMounted(() => {
    const canvas = canvasRef.value;
    ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    stompService.connect(props.roomId, (receivedData) => {
        // 공통 닉네임을 사용해 에코 방지 (내가 보낸 건 무시)
        if (receivedData.senderId === globalState.myNickname) return;
        renderDrawData(receivedData);
    });
});

onUnmounted(() => {
    stompService.disconnect();
});

const startDrawing = (e) => {
    if (!isMyTurn.value) return; // 출제자가 아니면 그리기 시작 차단

    isDrawing.value = true;
    const { x, y } = getMousePos(e);
    lastX = x;
    lastY = y;
};

const draw = (e) => {
    if (!isDrawing.value || !isMyTurn.value) return;

    const { x, y } = getMousePos(e);

    const drawData = {
        type: 'DRAW',
        senderId: globalState.myNickname,
        color: penColor.value,
        width: Number(penWidth.value),
        startX: lastX,
        startY: lastY,
        endX: x,
        endY: y
    };

    renderDrawData(drawData); // 내 화면에 먼저 그리기
    stompService.sendDrawData(props.roomId, drawData); // 서버로 전송

    lastX = x;
    lastY = y;
};

const stopDrawing = () => { isDrawing.value = false; };

const emitClearCanvas = () => {
    if (!isMyTurn.value) return; 
    const clearData = { type: 'CLEAR', senderId: globalState.myNickname };
    renderDrawData(clearData);
    stompService.sendDrawData(props.roomId, clearData);
};

const getMousePos = (evt) => {
    const rect = canvasRef.value.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
};

const renderDrawData = (data) => {
    if (data.type === 'CLEAR') {
        ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
        return;
    }
    ctx.beginPath();
    // 9번 문제 해결의 핵심: 전달받은 색상과 두께를 캔버스에 적용
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
    ctx.moveTo(data.startX, data.startY);
    ctx.lineTo(data.endX, data.endY);
    ctx.stroke();
    ctx.closePath();
};
</script>

<template>
    <div class="canvas-wrapper">
        <!-- 상단 도구 모음 -->
        <div class="toolbar">
            <!-- 출제자가 아닐 경우 disabled 클래스를 부여하여 흐리게 처리 -->
            <div :class="['tool-group', { disabled: !isMyTurn }]">
                <label for="colorPicker">색상</label>
                <input 
                    id="colorPicker" 
                    type="color" 
                    v-model="penColor" 
                    :disabled="!isMyTurn"
                />
            </div>

            <div :class="['tool-group', { disabled: !isMyTurn }]">
                <label for="lineWidth">두께 ({{ penWidth }}px)</label>
                <input 
                    id="lineWidth" 
                    type="range" 
                    v-model="penWidth" 
                    min="1" 
                    max="20" 
                    :disabled="!isMyTurn"
                />
            </div>
            
            <!-- 전체 지우기 버튼은 출제자에게만 보이도록 설정 -->
            <button 
                v-if="isMyTurn" 
                class="clear-btn" 
                @click="emitClearCanvas"
            >
            전체 지우기
            </button>
        </div>

        <!-- 캔버스 영역 -->
        <canvas
            ref="canvasRef"
            width="800"
            height="600"
            :class="['drawing-board', isMyTurn ? 'can-draw' : 'cannot-draw']" 
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
        ></canvas>
    </div>
</template>

<style scoped>
.canvas-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 0;
}

.toolbar {
    display: flex;
    gap: 30px; /* 도구 간격 넓힘 */
    padding: 16px 30px; /* 전체 여백 넓힘 */
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    align-items: center;
}

/* 6번 문제 해결: 도구 이름 가독성 완화 (폰트 키움) */
.tool-group {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 700;
    color: #343a40;
    font-size: 18px; /* 글씨 크기 증가 */
    transition: opacity 0.2s;
}

/* 출제자가 아닐 때 도구창 비활성화 효과 */
.tool-group.disabled {
    opacity: 0.4;
    pointer-events: none;
}

/* 색상 선택기 크기 증가 */
input[type="color"] {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

/* 두께 조절 슬라이더 크기 증가 */
input[type="range"] {
    width: 150px;
    cursor: pointer;
}

/* 6번 문제 해결: 지우기 버튼 큼직하게 변경 */
.clear-btn {
    padding: 10px 20px;
    background-color: var(--danger-color, #ff6b6b);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    font-size: 16px; /* 버튼 글자 크기 증가 */
    transition: all 0.2s ease;
}

.clear-btn:hover {
    background-color: #fa5252;
}

.drawing-board {
    border: 3px solid #dee2e6;
    border-radius: 12px;
    background-color: #ffffff;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

/* 출제자일 때 커서 */
.can-draw {
    cursor: crosshair !important;
}

/* 정답자일 때 커서 */
.cannot-draw {
    cursor: not-allowed !important;
}
</style>