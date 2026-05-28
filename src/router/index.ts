import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import PracticePage from '../views/PracticePage.vue'
import ScenarioQuizPage from '../views/ScenarioQuizPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/practice', name: 'practice', component: PracticePage },
    {
      path: '/practice/:scenarioId',
      name: 'scenario-quiz',
      component: ScenarioQuizPage,
    },
  ],
})
