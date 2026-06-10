import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import PracticePage from '../views/PracticePage.vue'
import ScenarioQuizPage from '../views/ScenarioQuizPage.vue'
import LoginPage from '../views/LoginPage.vue'
import SignupPage from '../views/SignupPage.vue'
import { useAuth } from '@/composables/useAuth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/signup', name: 'signup', component: SignupPage },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordPage.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAuth: true, requiresRole: 'user' },
    },
    {
      path: '/learn',
      name: 'learn',
      component: PracticePage,
      meta: { requiresAuth: true, requiresRole: 'user' },
    },
    {
      path: '/learn/:scenarioId',
      name: 'scenario-quiz',
      component: ScenarioQuizPage,
      meta: { requiresAuth: true, requiresRole: 'user' },
    },
    {
      path: '/reflect',
      name: 'reflect',
      component: () => import('@/views/ReflectView.vue'),
      meta: { requiresAuth: true, requiresRole: 'user' },
    },
    {
      path: '/reflect/new',
      name: 'reflect-new',
      component: () => import('@/views/ReflectNewView.vue'),
      meta: { requiresAuth: true, requiresRole: 'user' },
    },
    {
      path: '/chat',
      name: 'human-chat',
      component: () => import('@/views/HumanChatView.vue'),
      meta: { requiresAuth: true, requiresRole: 'user' },
    },
    {
      path: '/counsellor',
      name: 'counsellor-dashboard',
      component: () => import('@/views/CounsellorDashboard.vue'),
      meta: { requiresAuth: true, requiresRole: 'counsellor' },
    },
  ],
})

router.beforeEach(async (to) => {
  const { ready, user, profile } = useAuth()
  await ready

  const isAuthed = !!user.value
  const role = profile.value?.role

  // Redirect authenticated users away from login/signup
  if (to.name === 'login' || to.name === 'signup') {
    if (isAuthed) {
      return role === 'counsellor'
        ? { name: 'counsellor-dashboard' }
        : { name: 'home' }
    }
    return true
  }

  if (!to.meta.requiresAuth) return true

  if (!isAuthed) return { name: 'login' }

  if (to.meta.requiresRole && role !== to.meta.requiresRole) {
    return role === 'counsellor'
      ? { name: 'counsellor-dashboard' }
      : { name: 'home' }
  }

  return true
})
