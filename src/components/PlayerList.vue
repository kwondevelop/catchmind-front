<script setup>
import { computed } from 'vue';
import { globalState } from '../store';
import { stompService } from '../services/stompClient';

const props = defineProps({ roomId: String });

const myInfo = computed(() => globalState.players.find(p => p.nickname === globalState.myNickname));
const isMyHost = computed(() => myInfo.value?.host || false);
const amIReady = computed(() => myInfo.value?.ready || false);

const canStart = computed(() => {
    if (!isMyHost.value) return false;
    const others = globalState.players.filter(p => !p.host);
    if (others.length === 0) return false;
    return others.every(p => p.ready);
});

const toggleReady = () => {
    stompService.sendReady(props.roomId, globalState.myNickname);
};

const requestStartGame = () => {
    if (canStart.value) {
        stompService.sendStartGame(props.roomId, globalState.myNickname);
    }
};
</script>

<template>
<div class="player-list-wrapper">
    <div class="header">
        참여자 ({{ globalState.players.length }})
    </div>
    
    <ul class="list">
        <li 
            v-for="player in globalState.players" 
            :key="player.nickname" 
            :class="['player-item', player.nickname === globalState.myNickname ? 'is-me' : '']"
        >
            <div class="info">
                <span class="nickname">{{ player.nickname }}</span>
                <span class="score">{{ player.score || 0 }}점</span>
            </div>
        
            <!-- 게임이 시작되지 않았을 때만 방장/준비완료/대기중 뱃지를 표시함 -->
            <template v-if="!globalState.isPlaying">
                <span v-if="player.host" class="badge host">방장</span>
                <span v-else-if="player.ready" class="badge ready">준비 완료</span>
                <span v-else class="badge wait">대기중</span>
            </template>
        </li>
    </ul>

    <div v-if="!globalState.isPlaying" class="action-area">
        <button 
            v-if="isMyHost" 
            class="start-btn" 
            @click="requestStartGame"
            :disabled="!canStart"
        >
            게임 시작
        </button>

        <button 
            v-else 
            :class="['ready-btn', amIReady ? 'cancel' : '']" 
            @click="toggleReady"
        >
            {{ amIReady ? '준비 취소' : '준비' }}
        </button>
    </div>
</div>
</template>

<style scoped>
.player-list-wrapper {
    width: 240px;
    min-width: 240px;
    height: 100%;        
    flex-shrink: 0;
    background-color: var(--box-bg);
    border: 2px solid var(--border-color);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    align-self: stretch;
}

.header {
    padding: 15px;
    background-color: #f8f9fa;
    color: var(--text-main);
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    border-bottom: 2px solid var(--border-color);
}

.list {
    list-style: none;
    padding: 10px;
    margin: 0;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.player-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 10px;
    background-color: #f8f9fa;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.is-me {
    background-color: #e6fcf5;
    border: 1px solid var(--primary-color);
}

.info {
    display: flex;
    align-items: center;
    gap: 6px; 
    font-size: 16px;
}

.nickname { 
    max-width: 80px; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap; 
}

.score {
    font-size: 13px;
    font-weight: 800;
    color: #f08c00;
    background-color: #ffec99;
    padding: 2px 6px;
    border-radius: 6px;
}

.badge {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 8px;
    color: white;
}

.badge.host { 
    background-color: #fab005; 
}

.badge.ready { 
    background-color: var(--primary-color); 
}

.badge.wait { 
    background-color: #adb5bd; 
}

.action-area {
    padding: 15px;
    border-top: 2px solid var(--border-color);
    background-color: #f8f9fa;
}

.start-btn {
    width: 100%;
    padding: 12px;
    background-color: var(--primary-color, #20c997);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(32, 201, 151, 0.2);
    transition: all 0.2s ease;
}

.start-btn:disabled {
    background-color: #adb5bd;
    color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.7;
    box-shadow: none;
}

.ready-btn {
    width: 100%;
    padding: 12px;
    background-color: var(--secondary-color);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(51, 154, 240, 0.2);
}

.ready-btn.cancel {
    background-color: var(--danger-color);
    box-shadow: 0 4px 6px rgba(250, 82, 82, 0.2);
}

.ready-btn:hover, .start-btn:not(:disabled):hover { 
    filter: brightness(0.9); 
}
</style>