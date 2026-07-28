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
    try {
        const res = await axios.get(`http://${window.location.hostname}:8085/api/lobby/rooms`);
        const currentRoom = res.data.find(r => r.roomId === currentRoomId);
        if (currentRoom) {
            roomName.value = currentRoom.roomName;
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
    globalState.players = [];
    next();
});
</script>

<template>
<div class="game-container">
    <div class="room-header">
        <button @click="goLobby" class="btn-leave">로비로 나가기</button>

        <h2 class="room-title">
            {{ roomName }} <span class="room-id">#{{ currentRoomId }}</span>
        </h2>

        <div class="header-spacer"></div>
    </div>
    
    <div class="game-layout">
        <!-- 부모 고정 레이아웃 -->
        <PlayerList :roomId="currentRoomId" class="layout-item player-list-area" />
        <CanvasBoard :roomId="currentRoomId" class="layout-item canvas-area" />
        <ChatWindow :roomId="currentRoomId" class="layout-item chat-area" />
    </div>
</div>
</template>

<style scoped>
/* 화면 전체를 꽉 채우되 절대 밖으로 스크롤이 새어나가지 않도록 고정 */
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
    width: 100%; 
    max-width: 1500px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    margin-bottom: 15px; 
    flex-shrink: 0; /* 헤더가 찌그러지지 않도록 고정 */
}

.room-title { 
    margin: 0; 
    color: var(--text-main); 
    font-size: 26px; 
}

.room-id { 
    color: var(--primary-color); 
    font-size: 20px; 
    font-weight: normal; 
}

.btn-leave { 
    padding: 10px 18px; 
    background-color: var(--danger-color, #ff6b6b); 
    color: white; 
    border: none; 
    border-radius: 12px; 
    font-size: 15px; 
    font-weight: bold;
    cursor: pointer; 
    box-shadow: 0 4px 6px rgba(250, 82, 82, 0.2); 
}

.btn-leave:hover { 
    filter: brightness(0.9); 
}

.header-spacer { 
    width: 130px; 
}

/* 각 컴포넌트가 자기 영역 안에서만 놀도록 배치 */
.game-layout {
    display: flex;
    gap: 20px;
    align-items: stretch; /* 💡 그림판 높이에 맞춰 양옆 창들도 똑같이 늘어나도록 설정 */
    justify-content: center;
    width: 100%;
    max-width: 1500px;
    flex: 1;
    min-height: 0; 
    box-sizing: border-box;
}

/* 태블릿이나 모바일 환경 대응 */
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
</style>