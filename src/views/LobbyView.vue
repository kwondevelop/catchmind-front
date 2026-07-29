<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import axios from 'axios';
import { useRouter } from 'vue-router';
import { globalState } from '../store'; 

const rooms = ref([]);
const router = useRouter();

let pollingInterval = null; 

// 방 생성 모달 상태 및 설정 데이터
const showCreateModal = ref(false);
const newRoomConfig = ref({
    roomName: '',
    maxPlayers: 8,
    maxRound: 5
});

// 공통 알림 모달 상태
const showAlertModal = ref(false);
const alertMessage = ref('');

const showAlert = (message) => {
    alertMessage.value = message;
    showAlertModal.value = true;
};

const closeAlert = () => {
    showAlertModal.value = false;
};

const fetchRooms = async () => {
    try {
        const res = await axios.get(`http://${window.location.hostname}:8085/api/lobby/rooms`);
        rooms.value = res.data || [];
    } catch (e) {
        console.error('방 목록 불러오기 실패:', e);
        rooms.value = [];
    }
};

// 방 생성 모달 열기/닫기 함수
const openModal = () => {
    newRoomConfig.value = { roomName: '', maxPlayers: 8, maxRound: 5 }; // 초기화
    showCreateModal.value = true;
};

const closeModal = () => {
    showCreateModal.value = false;
};

const createRoom = async () => {
    if (!newRoomConfig.value.roomName.trim()) {
        showAlert('방 제목이 입력되지 않았습니다.');
        return;
    }
    
    try {
        // 서버로 방 제목, 최대 인원, 라운드 수 전송
        const res = await axios.post(`http://${window.location.hostname}:8085/api/lobby/room`, {
            roomName: newRoomConfig.value.roomName,
            maxPlayers: newRoomConfig.value.maxPlayers,
            maxRound: newRoomConfig.value.maxRound
        });
        
        closeModal();
        await fetchRooms();     
        joinRoom(res.data);     
    } catch (e) {
        console.error('방 생성 실패:', e);
        showAlert('방 생성에 실패했습니다.');
    }
};

const joinRoom = (room) => {
    if (room.playing || room.isPlaying) {
        showAlert('이미 게임이 진행 중인 방입니다.');
        return;
    }
    if (room.currentPlayers >= room.maxPlayers) {
        showAlert('인원이 가득 찬 방입니다.');
        return;
    }
    router.push(`/room/${room.roomId}`);
};

onMounted(() => {
    if (!globalState.myNickname) {
        router.push('/');
        return;
    }
    fetchRooms(); 
    
    pollingInterval = setInterval(fetchRooms, 1000); 
});

onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<template>
<div class="lobby-wrapper">
    <header class="lobby-header">
        <h1 class="logo">대기실</h1>
            <div class="user-badge">
                <span class="greeting">환영합니다,</span>
                <span class="nickname">{{ globalState.myNickname }}</span> 님!
            </div>
    </header>

    <div class="controls-section">
        <button @click="fetchRooms" class="btn-refresh">새로고침</button>
        <button @click="openModal" class="btn-create">방 만들기</button>
    </div>

    <div class="room-grid">
        <div v-if="rooms.length === 0" class="empty-state">
            현재 만들어진 방이 없습니다. <br/>방을 생성해주세요!
        </div>

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
                        <span v-if="room.playing || room.isPlaying" class="badge playing">게임 중</span>
                        <span v-else class="badge waiting">대기 중</span>
                    </div>
                </div>
        
                <button 
                    v-if="room"
                    @click="joinRoom(room)" 
                    class="btn-join"
                    :disabled="room.currentPlayers >= room.maxPlayers || room.playing || room.isPlaying"
                >
                {{ room.playing || room.isPlaying ? '게임 진행 중' : (room.currentPlayers >= room.maxPlayers ? '가득 참' : '입장하기') }}
                </button>
            </div>
    </div>

    <!-- 방 생성 모달 영역 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <h2 class="modal-title">새로운 방 만들기</h2>
            
            <div class="form-group">
                <label>방 제목</label>
                <input v-model="newRoomConfig.roomName" placeholder="방 제목을 입력하세요" maxlength="20" @keyup.enter="createRoom" />
            </div>

            <div class="form-row">
                <div class="form-group half">
                    <label>최대 인원</label>
                    <select v-model="newRoomConfig.maxPlayers">
                        <option :value="2">2명</option>
                        <option :value="4">4명</option>
                        <option :value="6">6명</option>
                        <option :value="8">8명 (기본)</option>
                    </select>
                </div>
                <div class="form-group half">
                    <label>라운드 수</label>
                    <select v-model="newRoomConfig.maxRound">
                        <option :value="3">3 라운드</option>
                        <option :value="5">5 라운드 (기본)</option>
                        <option :value="7">7 라운드</option>
                        <option :value="10">10 라운드</option>
                    </select>
                </div>
            </div>

            <div class="modal-actions">
                <button @click="closeModal" class="btn-cancel">취소</button>
                <button @click="createRoom" class="btn-submit">생성하기</button>
            </div>
        </div>
    </div>

    <!-- 공통 알림 모달 영역 -->
    <div v-if="showAlertModal" class="modal-overlay alert-overlay" @click.self="closeAlert">
        <div class="modal-content alert-content">
            <p class="alert-text">{{ alertMessage }}</p>
            <button @click="closeAlert" class="btn-submit alert-btn">확인</button>
        </div>
    </div>
</div>
</template>

<style scoped>
.lobby-wrapper {
    max-width: 900px;
    margin: 40px auto;
    background-color: var(--box-bg);
    padding: 30px 40px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

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

.controls-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.btn-refresh {
    background-color: white;
    color: var(--text-main);
    border: 2px solid var(--border-color);
    padding: 12px 24px; 
    border-radius: 12px;
    font-size: 18px; 
    cursor: pointer;
    font-weight: bold;
}

.btn-refresh:hover { 
    background-color: var(--bg-color); 
}

.btn-create {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
}

.btn-create:hover { 
    filter: brightness(0.9); 
}

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

/* 모달 관련 스타일 */
.modal-overlay {
    position: fixed;
    top: 0; 
    left: 0; 
    width: 100vw; 
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 30px 40px;
    border-radius: 20px;
    width: 400px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.modal-title {
    margin: 0 0 10px 0;
    font-size: 24px;
    color: var(--text-main);
    text-align: center;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-weight: bold;
    color: #495057;
}

.form-group input, .form-group select {
    padding: 12px;
    border: 2px solid var(--border-color);
    border-radius: 10px;
    font-size: 16px;
    outline: none;
    font-family: inherit;
}

.form-group input:focus, .form-group select:focus {
    border-color: var(--primary-color);
}

.form-row {
    display: flex;
    gap: 15px;
}

.form-group.half {
    flex: 1;
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.btn-cancel {
    flex: 1;
    padding: 12px;
    background-color: #f1f3f5;
    color: #495057;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
}

.btn-cancel:hover { 
    background-color: #e9ecef; 
}

.btn-submit {
    flex: 2;
    padding: 12px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
}

.btn-submit:hover { 
    filter: brightness(0.9); 
}

/* 공통 알림 모달 전용 스타일 */
.alert-overlay {
    z-index: 2000; /* 방 생성 모달보다 위에 뜨도록 설정 */
}

.alert-content {
    width: 320px;
    align-items: center;
    text-align: center;
    padding: 40px 30px 30px;
}

.alert-text {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-main);
    margin: 0 0 20px 0;
    line-height: 1.5;
}

.alert-btn {
    width: 100%;
}
</style>