import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class StompService {
    constructor() {
    this.client = null;
    this.connected = false;
    }

    // 1. 웹소켓 및 STOMP 연결
    connect(roomId, onMessageReceived) {

        this.client = new Client({

        // 기존: webSocketFactory: () => new SockJS('http://localhost:8085/ws-game'),
        webSocketFactory: () => new SockJS(`http://${window.location.hostname}:8085/ws-game`),
        debug: (str) => console.log('[STOMP]', str),
        reconnectDelay: 5000,
        
        onConnect: () => {
            this.connected = true;
            console.log('STOMP 서버에 연결되었습니다.');
        
        // 연결 성공 시 해당 방의 그림 데이터 구독
        this.client.subscribe(`/topic/room/${roomId}/draw`, (message) => {
            const drawData = JSON.parse(message.body);
            onMessageReceived(drawData);
        });
        },

onStompError: (frame) => {
    console.error('STOMP 오류 발생:', frame.headers['message']);
    },
});

this.client.activate();
}

// 2. 내 캔버스 좌표 데이터를 서버로 전송
sendDrawData(roomId, drawData) {
    if (!this.client || !this.connected) return;

    this.client.publish({
        destination: `/app/room/${roomId}/draw`,
        body: JSON.stringify(drawData),
    });
}

// 3. 연결 종료
disconnect() {
    if (this.client && this.connected) {
        this.client.deactivate();
        this.connected = false;
        console.log('STOMP 연결이 해제되었습니다.');
    }
}

// 4. 채팅 구독 (방금 추가된 부분)
subscribeChat(roomId, onChatReceived) {
    if (!this.client || !this.connected) return;
    
    this.client.subscribe(`/topic/room/${roomId}/chat`, (message) => {
        const chatData = JSON.parse(message.body);
        onChatReceived(chatData);
    });
}

// 5. 채팅 메시지 전송 (방금 추가된 부분)
sendChatMessage(roomId, chatData) {
    if (!this.client || !this.connected) return;
    
    this.client.publish({
        destination: `/app/room/${roomId}/chat`,
        body: JSON.stringify(chatData),
    });
}

// 6. 게임 시작 신호 전송 (수정됨)
sendStartGame(roomId, myNickname) {
    if (!this.client || !this.connected) return;
    
    this.client.publish({
        destination: `/app/room/${roomId}/start`,
        body: JSON.stringify({ sender: myNickname }), // 내 닉네임을 전송
    });
}

// 7. 유저 입장 알림
sendEnter(roomId, myNickname) {
    if (!this.client || !this.connected) return;
    this.client.publish({
        destination: `/app/room/${roomId}/enter`,
        body: JSON.stringify({ sender: myNickname }),
    });
}

// 8. 유저 준비(Ready) 토글
sendReady(roomId, myNickname) {
    if (!this.client || !this.connected) return;
    this.client.publish({
        destination: `/app/room/${roomId}/ready`,
        body: JSON.stringify({ sender: myNickname }),
    });
}

// 9. 유저 퇴장 알림
sendLeave(roomId, myNickname) {
    if (!this.client || !this.connected) return;
    this.client.publish({
        destination: `/app/room/${roomId}/leave`,
        body: JSON.stringify({ sender: myNickname }),
    });
}

// 10. 스킵 투표 신호 전송
sendSkipVote(roomId, myNickname) {
    if (!this.client || !this.connected) return;
    this.client.publish({
        destination: `/app/room/${roomId}/skip`,
        body: JSON.stringify({ sender: myNickname }),
    });
}

}

// 싱글톤 인스턴스로 내보내기
export const stompService = new StompService();