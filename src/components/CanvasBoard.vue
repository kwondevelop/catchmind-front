<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { stompService } from '../services/stompClient';
import { globalState } from '../store'; 

const props = defineProps({ roomId: { type: String, default: 'room-1' } });

const canvasRef = ref(null);
let ctx = null;

const isDrawing = ref(false);
const penColor = ref('#000000');
const penWidth = ref(5);
const currentTool = ref('pen');
const history = ref([]);

let lastX = 0;
let lastY = 0;
let lastSendTime = 0; // 💡 통신 과부하를 막기 위한 마지막 전송 시간 기록 변수

const isMyTurn = computed(() => {
    return globalState.drawerId === globalState.myNickname;
});

// 전역 상태(globalState)에서 타이머와 라운드 정보를 실시간으로 가져옴
const timerPercent = computed(() => {
    return (globalState.timeLeft / 180) * 100;
});

onMounted(() => {
    const canvas = canvasRef.value;
    ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    saveState(); 

    stompService.connect(props.roomId, (receivedData) => {
        if (receivedData.senderId === globalState.myNickname) return;
        renderDrawData(receivedData);
    });
});

onUnmounted(() => {
    stompService.disconnect();
});

const saveState = () => {
    if (!canvasRef.value) return;
    if (history.value.length >= 20) history.value.shift();
    history.value.push(canvasRef.value.toDataURL());
};

// 되돌리기(Undo) 시 참여자들에게도 변경된 캔버스 상태(이미지)를 전송
const undo = () => {
    if (!isMyTurn.value || history.value.length <= 1) return;
    
    history.value.pop(); // 현재 상태 제거
    const previousStateUrl = history.value[history.value.length - 1];
    
    const img = new Image();
    img.src = previousStateUrl;
    img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
        ctx.drawImage(img, 0, 0);
    };

    // 참여자들에게 되돌린 상태 동기화 전송 (이미지 대신 이벤트만 전송하여 서버 통신 에러 방지)
    const undoData = {
        type: 'UNDO',
        senderId: globalState.myNickname
    };
    stompService.sendDrawData(props.roomId, undoData);
};

const startDrawing = (e) => {
    if (!isMyTurn.value) return;
    isDrawing.value = true;
    const { x, y } = getMousePos(e);
    lastX = x;
    lastY = y;
};

const draw = (e) => {
    if (!isDrawing.value || !isMyTurn.value) return;

    const { x, y } = getMousePos(e);
    const colorToUse = currentTool.value === 'eraser' ? '#ffffff' : penColor.value;
    const widthToUse = currentTool.value === 'eraser' ? Number(penWidth.value) * 3 : Number(penWidth.value);

    const drawData = {
        type: 'DRAW',
        senderId: globalState.myNickname,
        color: colorToUse,
        width: widthToUse,
        startX: lastX,
        startY: lastY,
        endX: x,
        endY: y
    };

    // 1. 내 화면에는 즉시 그림을 렌더링 (끊김 없이 부드럽게)
    renderDrawData(drawData); 

    // 2. 서버 전송은 30ms 단위로 묶어서 전송 (쓰로틀링 기법 적용)
    const now = Date.now();
    if (now - lastSendTime > 30) {
        stompService.sendDrawData(props.roomId, drawData); 
        lastSendTime = now;
    }

    lastX = x;
    lastY = y;
};

const stopDrawing = () => { 
    if (isDrawing.value) {
        isDrawing.value = false;
        saveState();
        
        // 내가 그린 획이 끝났음을 다른 참여자들에게도 알려서 그들도 상태를 저장하게 함
        if (isMyTurn.value) {
            stompService.sendDrawData(props.roomId, {
                type: 'STOP',
                senderId: globalState.myNickname
            });
        }
    }
};

const emitClearCanvas = () => {
    if (!isMyTurn.value) return; 
    const clearData = { type: 'CLEAR', senderId: globalState.myNickname };
    renderDrawData(clearData);
    stompService.sendDrawData(props.roomId, clearData);
    saveState();
};

const getMousePos = (evt) => {
    const rect = canvasRef.value.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
};

// UNDO 타입 메시지 수신 시 참여자 캔버스에도 동일하게 반영
const renderDrawData = (data) => {
    if (data.type === 'CLEAR') {
        ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
        // 수신자(참여자)도 CLEAR 후 상태 저장 (단, 내가 보낸 건 무시되므로 중복 저장 안됨)
        saveState();
        return;
    }
    if (data.type === 'STOP') {
        // 출제자의 선 긋기가 끝났으므로 수신자(참여자)도 현재 캔버스 상태 저장
        saveState();
        return;
    }
    if (data.type === 'UNDO') {
        if (history.value.length > 1) {
            history.value.pop();
            const previousStateUrl = history.value[history.value.length - 1];
            const img = new Image();
            img.src = previousStateUrl;
            img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
                ctx.drawImage(img, 0, 0);
            };
        }
        return;
    }
    ctx.beginPath();
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
        <!-- 가로 길이를 캔버스(800px)와 맞추고 전역 상태 연동 -->
        <div class="game-info-bar">
            <div class="round-indicator">
                라운드 <strong>{{ globalState.currentRound }} / {{ globalState.maxRound }}</strong>
            </div>
            <div class="timer-container">
                <div class="timer-bar" :style="{ width: timerPercent + '%' }"></div>
                <span class="timer-text">
                    {{ Math.floor(globalState.timeLeft / 60) }}:{{ String(globalState.timeLeft % 60).padStart(2, '0') }}
                </span>
            </div>
        </div>

        <!-- 상단 도구 모음 -->
        <div class="toolbar">
            <div :class="['tool-group', { disabled: !isMyTurn }]">
                <button 
                    :class="['tool-mode-btn', { active: currentTool === 'pen' }]" 
                    @click="currentTool = 'pen'"
                >
                    펜
                </button>
                <button 
                    :class="['tool-mode-btn', { active: currentTool === 'eraser' }]" 
                    @click="currentTool = 'eraser'"
                >
                    지우개
                </button>
            </div>

            <div :class="['tool-group', { disabled: !isMyTurn || currentTool === 'eraser' }]">
                <label for="colorPicker">색상</label>
                <input 
                    id="colorPicker" 
                    type="color" 
                    v-model="penColor" 
                    :disabled="!isMyTurn || currentTool === 'eraser'"
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
            
            <button v-if="isMyTurn" class="action-btn undo-btn" @click="undo">
                되돌리기
            </button>

            <button v-if="isMyTurn" class="action-btn clear-btn" @click="emitClearCanvas">
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
    gap: 12px;
    padding: 0;
}

/* 캔버스 폭(800px)과 정확히 일치시킴 */
.game-info-bar {
    width: 800px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    padding: 10px 20px;
    border-radius: 12px;
    border: 2px solid #dee2e6;
    box-sizing: border-box;
    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}

.round-indicator {
    font-size: 16px;
    color: #495057;
}

.timer-container {
    position: relative;
    width: 300px;
    height: 20px;
    background-color: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.timer-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: var(--primary-color, #20c997);
    transition: width 0.3s linear;
}

.timer-text {
    position: relative;
    font-size: 12px;
    font-weight: bold;
    color: #343a40;
}

.toolbar {
    width: 800px;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    gap: 15px; 
    padding: 12px 20px; 
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 2px solid #dee2e6;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    align-items: center;
}

.tool-group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #343a40;
    font-size: 15px; 
}

.tool-group.disabled {
    opacity: 0.4;
    pointer-events: none;
}

.tool-mode-btn {
    padding: 6px 10px;
    background-color: #e9ecef;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
}

.tool-mode-btn.active {
    background-color: var(--primary-color, #20c997);
    color: white;
}

input[type="color"] {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

input[type="range"] {
    width: 100px;
    cursor: pointer;
}

.action-btn {
    padding: 8px 14px;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px; 
    transition: all 0.2s ease;
}

.undo-btn {
    background-color: #748ffc;
}
.undo-btn:hover {
    background-color: #5c7cfa;
}

.clear-btn {
    background-color: var(--danger-color, #ff6b6b);
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

.can-draw {
    cursor: crosshair !important;
}

/* 브라우저 단에서 마우스 클릭/드래그 이벤트를 원천 차단 */
.cannot-draw {
    cursor: not-allowed !important;
    pointer-events: none !important; 
}
</style>