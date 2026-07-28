<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import axios from 'axios';
import { useRouter } from 'vue-router';
import { globalState } from '../store'; // 전역 상태관리 import 추가 (필수)

const rooms = ref([]);
const newRoomName = ref('');
const router = useRouter();

let pollingInterval = null; // 폴링(반복) 타이머 변수 선언

const fetchRooms = async () => {
    try {
        const res = await axios.get(`http://${window.location.hostname}:8085/api/lobby/rooms`);
        rooms.value = res.data || [];
    } catch (e) {
        console.error('방 목록 불러오기 실패:', e);
        rooms.value = [];
    }
};

const createRoom = async () => {
    if (!newRoomName.value.trim()) return;
    try {
        const res = await axios.post(`http://${window.location.hostname}:8085/api/lobby/room`, {
            roomName: newRoomName.value
        });
        joinRoom(res.data.roomId);
    } catch (e) {
        console.error('방 생성 실패:', e);
    }
};

const joinRoom = (roomId) => {
    router.push(`/room/${roomId}`);
};

onMounted(() => {
    if (!globalState.myNickname) {
        router.push('/');
        return;
    }
    fetchRooms(); // 처음 진입 시 1회 불러오기
    
    // 1초마다 방 목록 지속 갱신 (늦게 온 사람도 최신 상태 확인 가능)
    pollingInterval = setInterval(fetchRooms, 1000); 
});

// 컴포넌트가 파괴될 때(방에 입장할 때 등) 타이머 종료 (메모리 누수 방지)
onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<template>
<div class="lobby-wrapper">
    <!-- 헤더 영역 -->
    <header class="lobby-header">
        <h1 class="logo">캐치마인드 대기실</h1>
            <div class="user-badge">
                <span class="greeting">환영합니다,</span>
                <span class="nickname">{{ globalState.myNickname }}</span> 님!
            </div>
    </header>

    <!-- 컨트롤 영역 -->
    <div class="controls-section">
        <button @click="fetchRooms" class="btn-refresh">새로고침</button>
        <div class="create-box">
            <input 
                v-model="newRoomName" 
                placeholder="방 제목을 입력하세요!" 
                @keyup.enter="createRoom" 
                maxlength="20"
            />
            <button @click="createRoom" class="btn-create">방 만들기</button>
        </div>
    </div>

    <!-- 방 목록 그리드 -->
    <div class="room-grid">
        <div v-if="rooms.length === 0" class="empty-state">
            현재 만들어진 방이 없습니다. <br/>방을 생성해주세요!
        </div>

            <!-- v-for 반복문 시작 -->
            <div 
                v-for="room in rooms" 
                :key="room?.roomId" 
                class="room-card"
            >
                <div class="room-info" v-if="room">
                <h3 class="room-title">{{ room.roomName }}</h3>
                    <div class="room-meta">
                        <span class="player-count">
                            인원: {{ room.currentPlayers }} / {{ room.maxPlayers }}
                        </span>
                        <!-- DB의 isPlaying 필드는 JSON 변환 시 playing으로 넘어올 수 있습니다 -->
                        <span v-if="room.playing || room.isPlaying" class="badge playing">게임중</span>
                        <span v-else class="badge waiting">대기중</span>
                    </div>
                </div>
        
                <button 
                    v-if="room"
                    @click="joinRoom(room.roomId)" 
                    class="btn-join"
                    :disabled="room.currentPlayers >= room.maxPlayers"
                >
                {{ room.currentPlayers >= room.maxPlayers ? '가득 참' : '입장하기' }}
                </button>
            </div>
    </div>
</div>
</template>

<style scoped>
/* 로비 전체 래퍼 */
.lobby-wrapper {
    max-width: 900px;
    margin: 40px auto;
    background-color: var(--box-bg);
    padding: 30px 40px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

/* 헤더 */
.lobby-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px dashed var(--border-color);
    padding-bottom: 20px;
    margin-bottom: 25px;
}

.logo { 
    margin: 0; 
    color: var(--primary-color); 
    font-size: 32px; 
}

.user-badge { 
    background: #e6fcf5; 
    padding: 10px 20px; 
    border-radius: 30px; 
    border: 2px solid var(--primary-color); 
}

.greeting { 
    color: #868e96;
    margin-right: 5px; 
}

.nickname { 
    color: var(--primary-color); 
    font-size: 20px; 
    font-weight: bold; 
}

/* 컨트롤(새로고침, 생성) 영역 */
.controls-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    gap: 20px;
    flex-wrap: wrap;
}

.btn-refresh {
    background-color: white;
    color: var(--text-main);
    border: 2px solid var(--border-color);
    padding: 12px 24px; /* 6번 해결: 버튼 가독성 위해 패딩 확대 */
    border-radius: 12px;
    font-size: 18px; /* 6번 해결: 폰트 확대 */
    cursor: pointer;
    font-weight: bold;
}

.btn-refresh:hover { 
    background-color: var(--bg-color); 
}

.create-box { 
    display: flex; 
    gap: 10px; 
    flex: 1; 
    justify-content: flex-end; 
}

.create-box input {
    width: 250px;
    padding: 12px 15px;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    font-family: inherit;
    font-size: 18px; /* 6번 해결: 입력창 폰트 확대 */
    outline: none;
}

.create-box input:focus { 
    border-color: var(--primary-color); 
}

.btn-create {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
}

.btn-create:hover { 
    filter: brightness(0.9); 
}

/* 방 목록 그리드 */
.room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 0;
    color: #adb5bd;
    font-size: 20px;
    background: #f8f9fa;
    border-radius: 16px;
    border: 2px dashed #dee2e6;
}

/* 개별 방 카드 */
.room-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: white;
    border: 2px solid var(--border-color);
    border-radius: 16px;
    transition: all 0.2s ease;
}

.room-card:hover {
    transform: translateY(-5px);
    border-color: var(--secondary-color);
    box-shadow: 0 8px 20px rgba(51, 154, 240, 0.15);
}

.room-info { 
    display: flex; 
    flex-direction: column; 
    gap: 10px; 
}

.room-title { 
    margin: 0; 
    font-size: 22px; 
    color: var(--text-main); 
}

.room-meta { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    font-size: 16px; 
    color: #495057; 
}

/* 뱃지 */
.badge { 
    padding: 6px 10px; 
    border-radius: 6px; 
    font-size: 14px; 
    font-weight: bold;
    color: white; 
}

.badge.waiting { 
    background-color: var(--primary-color); 
}

.badge.playing { 
    background-color: var(--danger-color); 
}

.btn-join {
    background-color: var(--secondary-color);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
}

.btn-join:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
}

.btn-join:not(:disabled):hover { 
    filter: brightness(0.9); 
}
</style>