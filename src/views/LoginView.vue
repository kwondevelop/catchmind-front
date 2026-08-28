<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { setNickname } from '../store';

const nickname = ref('');
const router = useRouter();

const enterLobby = async () => {
    if (!nickname.value.trim()) return;
    try {
        // 백엔드 API로 닉네임 전송 및 저장
        const res = await axios.post(`http://${window.location.hostname}:8085/api/lobby/player`, {
        nickname: nickname.value 
        });
        
        // 글로벌 스토어에 닉네임 저장
        setNickname(res.data.nickname);
    
        // 로비로 이동
        router.push('/lobby');
    } catch (error) {
        console.error("닉네임 생성 실패:", error);
        alert("오류가 발생했습니다.");
    }
};
</script>

<template>
<div class="login-container">
    <h1>캐치마인드</h1>
    <div class="input-box">
        <input 
            v-model="nickname" 
            @keyup.enter="enterLobby" 
            placeholder="사용할 닉네임을 입력하세요" 
        />
        <button @click="enterLobby">입장하기</button>
    </div>
</div>
</template>

<style scoped>
.login-container { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    height: 100vh; 
}

.input-box { 
    display: flex; 
    gap: 8px; 
    margin-top: 20px; 

}
input { 
    padding: 10px; 
    font-size: 16px; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
}

button { 
    padding: 10px 16px; 
    font-size: 16px; 
    background-color: #20c997; 
    color: white; 
    border: none; 
    border-radius: 4px; 
    cursor: pointer; 
}
</style>