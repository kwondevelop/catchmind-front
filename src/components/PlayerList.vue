<script setup>
import { computed } from 'vue';
import { globalState } from '../store';
import { stompService } from '../services/stompClient';

const props = defineProps({ roomId: String });

const myInfo = computed(() => globalState.players.find(p => p.nickname === globalState.myNickname));
const isMyHost = computed(() => myInfo.value?.host || false);
const amIReady = computed(() => myInfo.value?.ready || false);

const toggleReady = () => {
    stompService.sendReady(props.roomId, globalState.myNickname);
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
                <span v-if="player.host" class="crown">👑</span>
                <span class="nickname">{{ player.nickname }}</span>
            </div>
        
            <span v-if="player.host" class="badge host">방장</span>
            <span v-else-if="player.ready" class="badge ready">준비 완료</span>
            <span v-else class="badge wait">대기중</span>
        </li>
    </ul>

    <div v-if="!isMyHost" class="action-area">
        <button :class="['ready-btn', amIReady ? 'cancel' : '']" @click="toggleReady">
            {{ amIReady ? '준비 취소' : '준비' }}
        </button>
    </div>
</div>
</template>

<style scoped>
.player-list-wrapper {
    width: 240px;
    min-width: 240px;
    height: 90%;         /* 💡 고정 600px 대신 그림판 높이에 동적으로 맞춤 */
    flex-shrink: 0;
    background-color: var(--box-bg);
    border: 2px solid var(--border-color);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
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
    font-size: 16px;
}

.crown { 
    margin-right: 5px; font-size: 14px; 
}

.nickname { 
    max-width: 90px; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap; 
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

.ready-btn {
    width: 100%;
    padding: 12px;
    background-color: var(--secondary-color);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(51, 154, 240, 0.2);
}

.ready-btn.cancel {
    background-color: var(--danger-color);
    box-shadow: 0 4px 6px rgba(250, 82, 82, 0.2);
}

.ready-btn:hover { 
    filter: brightness(0.9); 
}
</style>