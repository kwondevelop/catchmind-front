import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // 라우터 불러오기

const app = createApp(App);
app.use(router); // 앱에 라우터 적용
app.mount('#app');