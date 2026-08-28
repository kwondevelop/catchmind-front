<script setup>
</script>

<template>
  <router-view />
</template>

<style>
/* 1. 구글 폰트 'Jua' 임포트 */
@import url('https://fonts.googleapis.com/css2?family=Jua&display=swap');

/* 2. 전역 컬러 팔레트 변수 설정 (:root) */
:root {
  --primary-color: #20c997;    /* 메인 초록색 (성공, 시작) */
  --secondary-color: #339af0;  /* 서브 파란색 (버튼, 준비) */
  --accent-color: #845ef7;     /* 강조 보라색 (스킵, 특별한 액션) */
  --danger-color: #fa5252;     /* 경고 빨간색 (나가기, 취소) */
  --bg-color: #f4f6f8;         /* 전체 배경색 (연한 회색) */
  --box-bg: #ffffff;           /* 컴포넌트 배경색 (흰색) */
  --text-main: #343a40;        /* 기본 텍스트 (진한 회색) */
  --border-color: #ced4da;     /* 테두리 색상 */
}

/* 3. 전역 기본 스타일 덮어쓰기 */
body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  font-family: 'Jua', sans-serif; /* 둥근 폰트 적용 */
  font-size: 16px;
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
}

/* 4. 버튼 공통 스타일 (선택 사항이지만 해두면 편합니다) */
button {
  font-family: 'Jua', sans-serif; /* 버튼에도 폰트 강제 적용 */
  transition: all 0.2s ease;      /* 버튼 누를 때 부드러운 애니메이션 */
}

button:active {
  transform: scale(0.95);         /* 클릭 시 살짝 작아지는 효과 */
}
</style>