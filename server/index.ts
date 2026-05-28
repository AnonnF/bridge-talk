import { createApp } from './app.js'
import { loadQuestionBank } from './data/loadQuestionBank.js'

const port = Number(process.env.PORT) || 3001
loadQuestionBank()

const app = createApp()

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
