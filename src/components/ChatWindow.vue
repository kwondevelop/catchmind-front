<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { stompService } from '../services/stompClient';
import { globalState } from '../store';

const props = defineProps({ roomId: String });
const messages = ref([]);
const chatInput = ref('');
const messageListRef = ref(null);

// 내가 정답자이고, 게임이 진행 중일 때만 스킵 투표 가능
const canVoteSkip = computed(() => {
    return globalState.isPlaying && globalState.drawerId !== globalState.myNickname;
});

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
                if (globalState.isPlaying) {
                    globalState.timeLeft = Number(receivedMsg.message);
                }
                return;
            }
            if (receivedMsg.type === 'START') {
                globalState.isPlaying = true; 
                globalState.drawerId = receivedMsg.drawerId;
                
                // 값이 존재할 경우(0 이상일 경우) 전역 상태에 정상 반영
                if (receivedMsg.currentRound !== undefined && receivedMsg.currentRound !== null) {
                    globalState.currentRound = receivedMsg.currentRound;
                }
                if (receivedMsg.maxRound !== undefined && receivedMsg.maxRound !== null) {
                    globalState.maxRound = receivedMsg.maxRound;
                }

                if (receivedMsg.drawerId === globalState.myNickname) {
                    receivedMsg.message = `게임 시작! \n(제시어 : ${receivedMsg.message})`;
                } else {
                    receivedMsg.message = `게임 시작! \n(어떤 그림일까요? 맞춰보세요!)`;
                }
            }
            if (receivedMsg.type === 'SYSTEM') {
                if (receivedMsg.message.includes('정답') || receivedMsg.message.includes('시간 초과') || receivedMsg.message.includes('스킵')) {
                    globalState.drawerId = null;
                }
                if (receivedMsg.message.includes('게임 종료')) {
                    globalState.isPlaying = false;
                }
            }
            messages.value.push(receivedMsg);
            scrollToBottom();
        });

        stompService.sendEnter(props.roomId, globalState.myNickname);
    }, 1000);
});

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
        <!-- 채팅창 제목과 스킵 투표 버튼을 Flex로 나란히 정렬하여 밖으로 튀어나가지 않게 수정 -->
        <span class="chat-title">채팅창</span>
        <button 
            v-if="canVoteSkip" 
            class="skip-btn" 
            @click="requestSkipVote"
        >
            스킵 투표
        </button>
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
.chat-wrapper {
    width: 380px; 
    min-width: 380px;
    height: 100%;        
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 2px solid var(--border-color, #ced4da);
    border-radius: 16px;
    background-color: var(--box-bg, white);
    box-sizing: border-box;
    overflow: hidden; 
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    align-self: stretch; 
}

/* 헤더 내부 정렬 깔끔하게 맞춤 */
.chat-header {
    position: relative;
    display: flex;
    justify-content: center; /* 타이틀 중앙 정렬 */
    align-items: center;
    padding: 14px 16px;
    background-color: #f8f9fa;
    font-weight: bold;
    border-bottom: 2px solid var(--border-color, #ced4da);
    flex-shrink: 0;
}

.chat-title {
    font-size: 16px;
    color: var(--text-main);
}

.skip-btn {
    position: absolute;
    right: 16px;
    background-color: var(--accent-color, #845ef7);
    color: white;
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.skip-btn:hover { 
    background-color: #7950f2; 
}

.message-list {
    flex: 1;
    overflow-y: auto; 
    overflow-x: hidden; 
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
    box-sizing: border-box;
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
    width: 100%;
    box-sizing: border-box;
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