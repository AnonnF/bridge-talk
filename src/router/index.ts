import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import PracticePage from '../views/PracticePage.vue'
import ScenarioQuizPage from '../views/ScenarioQuizPage.vue'
import LoginPage from '../views/LoginPage.vue'
import SignupPage from '../views/SignupPage.vue'
import { supabase } from '@/lib/supabase'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/signup', name: 'signup', component: SignupPage },
    { path: '/', name: 'home', component: HomePage, meta: { requiresAuth: true } },
    {
      path: '/learn',
      name: 'learn',
      component: PracticePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/learn/:scenarioId',
      name: 'scenario-quiz',
      component: ScenarioQuizPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/reflect',
      name: 'reflect',
      component: () => import('@/views/ReflectView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reflect/new',
      name: 'reflect-new',
      component: () => import('@/views/ReflectNewView.vue'),
      meta: { requiresAuth: true },
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
  if (!to.meta.requiresAuth) return true

  const { data } = await supabase.auth.getSession()
  const session = data.session

  if (!session) {
    return { name: 'login' }
  }

  if (to.meta.requiresRole) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== to.meta.requiresRole) {
      return { name: 'home' }
    }
  }

  return true
})
