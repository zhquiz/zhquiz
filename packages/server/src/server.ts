import S from 'jsonschema-definer'
import cors from 'fastify-cors'
import fStatic from 'fastify-static'
import fastify from 'fastify'
import mongodb from 'mongodb'
import path from 'path'

async function main() {
  const client = await mongodb.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const col = client.db('library').collection<{
    title: string
    entries: string[]
    createdAt: Date
  }>('library')

  const app = fastify({
    logger: {
      prettyPrint: process.env.NODE_ENV === 'development'
    }
  })
  const port = process.env.PORT || '6000'

  app.register(fStatic, {
    root: path.resolve('public')
  })

  app.register(cors)

  const sQuerystring = S.shape({
    q: S.string().optional(),
    page: S.integer().minimum(1),
    perPage: S.integer().minimum(5)
  })

  const sResponse = S.shape({
    result: S.list(
      S.shape({
        title: S.string(),
        entries: S.list(S.string())
      })
    ),
    count: S.integer().minimum(0)
  })

  app.get<{
    Querystring: typeof sQuerystring.type
  }>(
    '/api/library',
    {
      schema: {
        querystring: sQuerystring.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    },
    async (req): Promise<typeof sResponse.type> => {
      const { q, page, perPage } = req.query

      if (q) {
        const [result, count] = await Promise.all([
          col
            .find(
              { $text: { $search: q } },
              {
                projection: {
                  _id: 0,
                  title: 1,
                  entries: 1,
                  score: { $meta: 'textScore' }
                }
              }
            )
            .sort({ score: { $meta: 'textScore' } })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .toArray(),
          col.countDocuments({ $text: { $search: q } })
        ])

        return {
          result,
          count
        }
      }

      const [result, count] = await Promise.all([
        col
          .find()
          .sort({ createdAt: -1 })
          .skip((page - 1) * perPage)
          .limit(perPage)
          .project({
            _id: 0,
            title: 1,
            entries: 1
          })
          .toArray(),
        col.countDocuments()
      ])

      return {
        result,
        count
      }
    }
  )

  app.listen(
    port,
    process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
    (err) => {
      if (err) {
        throw err
      }

      console.info(`Go to http://localhost:${port}`)
    }
  )
}

if (require.main === module) {
  main()
}
