<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { stompService } from '../services/stompClient';
import { globalState } from '../store';

const props = defineProps({ roomId: String });
const messages = ref([]);
const chatInput = ref('');
const messageListRef = ref(null);
const timeLeft = ref(null);

const isHost = computed(() => {
    const me = globalState.players.find(p => p.nickname === globalState.myNickname);
    return me?.host || false;
});

const canStart = computed(() => {
    if (!isHost.value) return false;
    const others = globalState.players.filter(p => !p.host);
    if (others.length === 0) return false;
    return others.every(p => p.ready);
});

// 내가 정답자이고, 게임이 진행 중(타이머 동작)일 때만 스킵 투표 가능
const canVoteSkip = computed(() => {
    return timeLeft.value !== null && globalState.drawerId !== globalState.myNickname;
});

// 투표 버튼 클릭 시 서버로 신호 전송
const requestSkipVote = () => {
    stompService.sendSkipVote(props.roomId, globalState.myNickname);
};

onMounted(() => {
    setTimeout(() => {
        stompService.subscribeChat(props.roomId, (receivedMsg) => {
            if (receivedMsg.type === 'PLAYERS') {
                globalState.players = receivedMsg.data;
                return; 
            }

            if (receivedMsg.type === 'TIME') {
                timeLeft.value = Number(receivedMsg.message);
                return;
            }
            if (receivedMsg.type === 'START') {
                globalState.drawerId = receivedMsg.drawerId;
                if (receivedMsg.drawerId === globalState.myNickname) {
                    receivedMsg.message = `게임 시작! (제시어 : ${receivedMsg.message})`;
                } else {
                    receivedMsg.message = `게임 시작! (어떤 그림일까요? 맞춰보세요!)`;
                }
            }
            if (receivedMsg.type === 'SYSTEM' && (receivedMsg.message.includes('정답') || receivedMsg.message.includes('시간 초과'))) {
                timeLeft.value = null;
                globalState.drawerId = null;
            }
            messages.value.push(receivedMsg);
            scrollToBottom();
        });

        stompService.sendEnter(props.roomId, globalState.myNickname);

    }, 1000);
});

const requestStartGame = () => {
    if (canStart.value) {
        stompService.sendStartGame(props.roomId, globalState.myNickname);
    }
};

const sendMessage = () => {
    if (!chatInput.value.trim()) return;

    const chatData = {
        type: 'CHAT',
        sender: globalState.myNickname,
        message: chatInput.value
    };

    stompService.sendChatMessage(props.roomId, chatData);
    chatInput.value = '';
};

const scrollToBottom = async () => {
    await nextTick();
    if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
};
</script>

<template>
<div class="chat-wrapper">
    <div class="chat-header">
        <div class="header-info">
            <span>채팅창</span>
            <span v-if="timeLeft !== null" class="timer-badge">{{ timeLeft }}초</span>
        </div>

        <div class="button-group">
            <button 
                v-if="canVoteSkip" 
                class="skip-btn" 
                @click="requestSkipVote"
            >
            스킵 투표
            </button>

            <button 
                v-if="isHost"
                class="start-btn" 
                @click="requestStartGame" 
                :disabled="timeLeft !== null || !canStart"
            >
            게임 시작
            </button>
        </div>
    </div>
    
    <div class="message-list" ref="messageListRef">
        <div 
            v-for="(msg, idx) in messages" 
            :key="idx" 
            :class="['message-item', msg.type === 'SYSTEM' || msg.type === 'START' ? 'system-msg' : '']"
        >
            <span v-if="msg.type === 'CHAT'" class="sender">{{ msg.sender }}:</span>
            <span class="text">{{ msg.message }}</span>
        </div>
    </div>

    <div class="input-area">
        <input 
            v-model="chatInput" 
            @keyup.enter="sendMessage" 
            placeholder="정답을 입력하세요" 
        />
        <button class="send-btn" @click="sendMessage">전송</button>
    </div>
</div>
</template>

<style scoped>
/* 채팅창 넓이 확장 및 세로 고정 (무한 증식 원천 차단) */
.chat-wrapper {
    width: 380px; 
    min-width: 380px;
    height: 90%;         /* 💡 고정 600px 대신 그림판 높이에 동적으로 맞춤 */
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 2px solid var(--border-color, #ced4da);
    border-radius: 16px;
    background-color: var(--box-bg, white);
    box-sizing: border-box;
    overflow: hidden; 
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background-color: #f8f9fa;
    font-weight: bold;
    border-bottom: 2px solid var(--border-color, #ced4da);
    flex-shrink: 0;
}

.header-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
}

.timer-badge {
    background-color: #ffec99;
    color: #f08c00;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
}

.button-group {
    display: flex;
    gap: 8px;
}

.start-btn {
    background-color: var(--primary-color, #20c997);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
    transition: all 0.2s ease;
}

.start-btn:disabled {
    background-color: #adb5bd;
    color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.7;
}

.skip-btn {
    background-color: var(--accent-color, #845ef7);
    color: white;
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.skip-btn:hover { 
    background-color: #7950f2; 
}

/* 메시지 리스트 영역 내부에서만 스크롤바가 돌도록 설정 */
.message-list {
    flex: 1;
    overflow-y: auto; 
    overflow-x: hidden;  /* 가로 스크롤 바 차단 */
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
}

.message-item {
    font-size: 15px; 
    word-break: break-word; 
    white-space: pre-wrap; 
    overflow-wrap: break-word;
    line-height: 1.5;
    display: block;
    width: 100%;
}

.sender {
    font-weight: 800;
    margin-right: 6px;
    color: var(--text-main, #343a40);
}

.system-msg {
    color: var(--danger-color, #fa5252);
    font-weight: 700;
    text-align: center;
    background-color: #fff5f5;
    padding: 10px;
    border-radius: 8px;
    border: 1px dashed #ffa8a8;
}

.input-area {
    display: flex;
    flex-direction: row;
    padding: 12px;
    border-top: 2px solid var(--border-color, #ced4da);
    background-color: #f8f9fa;
    box-sizing: border-box;
    flex-shrink: 0;
}

.input-area input {
    flex: 1;
    width: 100%;
    min-width: 0;
    padding: 10px 12px;
    border: 2px solid #adb5bd;
    border-radius: 8px;
    margin-right: 8px;
    box-sizing: border-box;
    outline: none;
    font-family: inherit;
    font-size: 15px;
}

.input-area input:focus {
    border-color: var(--secondary-color, #339af0);
}

.send-btn {
    width: 70px;
    padding: 10px;
    flex-shrink: 0;
    background-color: var(--secondary-color, #339af0);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    font-size: 15px;
    transition: all 0.2s ease;
}

.send-btn:hover { 
    filter: brightness(0.9); 
}
</style>