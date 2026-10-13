// Servidor para desenvolvimento local (npm run dev). Na Vercel este arquivo não é usado.
import app from './app.js'

const porta = Number(process.env.PORT ?? 3000)
app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta} [${process.env.APP_ENV ?? 'LOCAL'}]`)
})
