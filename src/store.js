import { reactive } from 'vue';

// 앱 전체에서 공유할 글로벌의 상태
export const globalState = reactive({
    // 접속할 때 한 번 부여되는 내 고유 닉네임
    // 세션 스토리지에 닉네임이 있으면 가져오고, 없으면 빈 문자열
    myNickname: sessionStorage.getItem('nickname') || "",
    // 출제자 닉네임
    drawerId: null,
    // 현재 접속한 플레이어들의 닉네임
    players: [],
    // 게임 진행 여부
    isPlaying: false,
    // 남은 시간(초)
    timeLeft: 180,
    // 현재 라운드
    currentRound: 1,
    // 최대 라운드
<<<<<<< HEAD
    maxRound: 5,
    // 재연결 상태 표시
    isReconnecting: false
=======
    maxRound: 5
>>>>>>> 7a65796ae172e889445a3e7c1d1ec56aa6d82fc8
});

// 닉네임 저장 함수
export const setNickname = (name) => {
    globalState.myNickname = name;
    sessionStorage.setItem('nickname', name);
};