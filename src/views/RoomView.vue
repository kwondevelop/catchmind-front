<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import axios from 'axios';
import CanvasBoard from '../components/CanvasBoard.vue';
import ChatWindow from '../components/ChatWindow.vue';
import PlayerList from '../components/PlayerList.vue';
import { stompService } from '../services/stompClient';
import { globalState } from '../store';

const route = useRoute();
const router = useRouter();

const currentRoomId = route.params.id;
const roomName = ref('로딩중...');

onMounted(async () => {
    globalState.isPlaying = false;
    globalState.drawerId = null;
    globalState.timeLeft = 180;
    globalState.currentRound = 1;
    globalState.maxRound = 10; // 기본값
    globalState.players = [];

    try {
        const res = await axios.get(`http://${window.location.hostname}:8085/api/lobby/rooms`);
        const currentRoom = res.data.find(r => r.roomId === currentRoomId);
        if (currentRoom) {
            roomName.value = currentRoom.roomName;
            // 방 생성 시 설정한 최대 라운드 값을 전역 상태에 반영!
            if (currentRoom.maxRound) {
                globalState.maxRound = currentRoom.maxRound;
            }
        } else {
            roomName.value = '알 수 없는 방';
        }
    } catch (e) {
        console.error("방 정보 불러오기 실패", e);
        roomName.value = '방 정보 오류';
    }
});

const goLobby = () => {
    router.push('/lobby');
};

onBeforeRouteLeave((to, from, next) => {
    stompService.sendLeave(currentRoomId, globalState.myNickname);
    // 방을 나갈 때도 전역 상태를 초기화.
    globalState.isPlaying = false;
    globalState.drawerId = null;
    globalState.players = [];
    next();
});
</script>

<template>
<div class="game-container">
    <div class="room-header">
        <div class="header-spacer"></div>
        <h2 class="room-title">
            {{ roomName }} <span class="room-id">#{{ currentRoomId }}</span>
        </h2>
        <button @click="goLobby" class="btn-leave">로비로 나가기</button>
    </div>
    
    <div class="game-layout">
        <PlayerList :roomId="currentRoomId" class="layout-item player-list-area" />
        <CanvasBoard :roomId="currentRoomId" class="layout-item canvas-area" />
        <ChatWindow :roomId="currentRoomId" class="layout-item chat-area" />
    </div>
<<<<<<< HEAD

    <!-- 재연결 중 오버레이 -->
    <div v-if="globalState.isReconnecting" class="reconnect-overlay">
        <div class="reconnect-content">
            <div class="spinner"></div>
            <h3>서버와 연결이 끊어졌습니다.</h3>
            <p>재연결을 시도 중입니다...</p>
        </div>
    </div>
=======
>>>>>>> 7a65796ae172e889445a3e7c1d1ec56aa6d82fc8
</div>
</template>

<style scoped>
.game-container { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    height: 100vh; 
    max-height: 100vh;
    padding: 15px 20px; 
    box-sizing: border-box; 
    overflow: hidden;
    background-color: var(--bg-color, #f4f6f8);
}

.room-header { 
    width: 100vw; 
    max-width: 1440px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    margin-bottom: 15px; 
    padding: 12px 25px; 
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    border: 2px solid var(--border-color, #ced4da);
    flex-shrink: 0; 
    box-sizing: border-box;
}

.header-spacer { 
    width: 110px; 
}

.room-title { 
    margin: 0; 
    color: var(--text-main); 
    font-size: 22px; 
    display: flex;
    align-items: center;
    gap: 10px;
}

.room-id { 
    color: var(--primary-color); 
    font-size: 18px; 
    font-weight: normal; 
}

.btn-leave { 
    padding: 8px 16px; 
    background-color: var(--danger-color, #ff6b6b); 
    color: white; 
    border: none; 
    border-radius: 10px; 
    font-size: 14px; 
    font-weight: bold;
    cursor: pointer; 
    box-shadow: 0 4px 6px rgba(250, 82, 82, 0.2);
    transition: all 0.2s;
}

.btn-leave:hover { 
    filter: brightness(0.9); 
    transform: translateY(-2px);
}

.game-layout {
    display: flex;
    gap: 20px;
    /* stretch 대신 flex-start를 주어 사이드바들이 그림판 전체 높이에 끌려가지 않고 적당한 비율을 유지하도록 함 */
    align-items: flex-start; 
    justify-content: center;
    width: 100%;
    max-width: 1440px;
    flex: 1;
    min-height: 0; 
    box-sizing: border-box;
}

/* 양옆 패널(참여자 목록, 채팅창)의 고정 높이를 그림판 구역과 조화롭게 맞춤 */
.player-list-area,
.chat-area {
    height: 735px; /* 그림판(상단바+툴바+캔버스)의 총 높이와 일치시킴 */
}

@media (max-width: 1200px) {
    .game-container {
        height: auto;
        max-height: none;
        overflow-y: auto;
    }
    .game-layout {
        flex-direction: column;
        align-items: center;
    }
}
<<<<<<< HEAD

/* 재연결 오버레이 스타일 */
.reconnect-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.reconnect-content {
    background: white;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.reconnect-content h3 {
    margin: 20px 0 10px 0;
    color: var(--danger-color, #ff6b6b);
}

.reconnect-content p {
    margin: 0;
    color: var(--text-main);
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid var(--primary-color, #20c997);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
=======
>>>>>>> 7a65796ae172e889445a3e7c1d1ec56aa6d82fc8
</style>