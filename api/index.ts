import { createApp } from '../server/app.js'
import { loadQuestionBank } from '../server/data/loadQuestionBank.js'

loadQuestionBank()

export default createApp()
