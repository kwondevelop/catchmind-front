import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import LobbyView from '../views/LobbyView.vue';
import RoomView from '../views/RoomView.vue';

const routes = [
    { path: '/', component: LoginView },
    { path: '/lobby', component: LobbyView },
    { path: '/room/:id', component: RoomView, props: true } // 주소의 id를 props로 전달
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;