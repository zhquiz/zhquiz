import fastify from 'fastify'
import fastifyExpress from 'fastify-express'
import { build, loadNuxt } from 'nuxt'

import { isDev } from './shared'

async function main() {
  const port = parseInt(process.env.PORT!) || 35594
  process.env.PORT = port.toString()

  const nuxt = await loadNuxt(isDev ? 'dev' : 'start')

  const app = fastify()
  await app.register(fastifyExpress)

  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      next()
      return
    }

    nuxt.render(req, res, next)
  })

  if (isDev) {
    build(nuxt)
  }

  await app.listen(port, '0.0.0.0')

  // eslint-disable-next-line no-console
  console.log(`Server is running at http://localhost:${port}`)
}

if (require.main === module) {
  main()
}