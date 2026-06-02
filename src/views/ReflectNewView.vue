<template>
  <div class="reflect-form">
    <!-- Step indicator: 1 of 4 -->
    <p class="step-label">Step {{ step }} of 4</p>
    <h2>{{ prompts[step - 1].label }}</h2>
    <textarea
      v-model="answers[step - 1]"
      :placeholder="prompts[step - 1].placeholder"
    />

    <div class="actions">
      <button v-if="step > 1" @click="step--">Back</button>
      <button v-if="step < 4" :disabled="!answers[step - 1]" @click="step++">
        Next
      </button>
      <button v-if="step === 4" :disabled="!answers[3]" @click="submit">
        Save entry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useJournal } from '@/composables/useJournal'

const router = useRouter()
const { addEntry } = useJournal()

const step = ref(1)
const answers = ref(['', '', '', ''])

const prompts = [
  {
    label: 'What was the situation?',
    placeholder: 'e.g. I needed to ask my tutor for help after a lecture...',
  },
  {
    label: 'What went well?',
    placeholder: 'e.g. I managed to approach them before they left...',
  },
  {
    label: 'What was hard?',
    placeholder: 'e.g. I froze when they asked a follow-up question...',
  },
  {
    label: 'What would I do differently?',
    placeholder: 'e.g. Prepare one specific question in advance...',
  },
]

function submit() {
  addEntry({
    situation: answers.value[0],
    wentWell: answers.value[1],
    wasHard: answers.value[2],
    doDifferently: answers.value[3],
    sharedWithCounsellor: false,
  })
  router.push('/reflect')
}
</script>
