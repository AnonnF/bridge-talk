import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import PracticePage from '../views/PracticePage.vue'
import ScenarioQuizPage from '../views/ScenarioQuizPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/learn', name: 'learn', component: PracticePage },
    {
      path: '/learn/:scenarioId',
      name: 'scenario-quiz',
      component: ScenarioQuizPage,
    },
    {
      path: '/reflect',
      name: 'reflect',
      component: () => import('@/views/ReflectView.vue'),
    },
    {
      path: '/reflect/new',
      name: 'reflect-new',
      component: () => import('@/views/ReflectNewView.vue'),
    },
  ],
})
