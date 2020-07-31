/* eslint-disable no-console */
import fs from 'fs'

import { Serialize } from 'any-serialize'
import yaml from 'js-yaml'
import { ObjectID } from 'mongodb'
import { nanoid } from 'nanoid'

import { DbExtraModel, DbQuizModel, DbUserModel } from '@/db/mongo'
import { mongoInit } from '@/util/mongo'
import { ensureSchema, sQuizStat } from '@/util/schema'

import { V1Extra, V1User } from './v1'

async function main() {
  const mongoose = await mongoInit()
  const v1 = mongoose.connection.useDb('test').db

  const oldUsers = (await DbUserModel.find().select('_id email')).reduce(
    (prev, { _id, email }) => {
      prev.set(email, _id)
      return prev
    },
    new Map<string, string>()
  )
  /**
   * From ObjectID to string
   */
  const userIdMap = new Map<string, string>()

  await DbUserModel.insertMany(
    (await v1.collection<V1User>('user').find().toArray())
      .map(({ _id: userIdObjectId, ...others }) => {
        const userId = oldUsers.get(others.email)
        if (userId) {
          userIdMap.set(userIdObjectId.toHexString(), userId)
          return null
        }

        const _id = nanoid()
        userIdMap.set(userIdObjectId.toHexString(), _id)

        return {
          ...others,
          _id,
        }
      })
      .filter((el) => el)
  )

  const userIdReverseMap = new Map(
    Array.from(userIdMap).map(([a, b]) => [b, a])
  )

  const qs = await DbQuizModel.find().select('userId entry type direction')

  const hsk = new Set(
    Object.values(
      yaml.safeLoad(fs.readFileSync('assets/hsk.yaml', 'utf8')) as Record<
        string,
        string[]
      >
    ).reduce((prev, c) => [...prev, ...c], [] as string[])
  )
  const ser = new Serialize()
  const toMigrateQsMap = new Map<string, any>()

  ;(
    await v1
      .collection('card')
      .aggregate([
        ...(qs.length
          ? [
              {
                $match: {
                  $nor: qs
                    .map(({ userId, entry, type, direction }) => ({
                      userId: userIdReverseMap.get(userId),
                      entry,
                      type,
                      direction,
                    }))
                    .filter(({ userId }) => userId),
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: 'quiz',
            localField: '_id',
            foreignField: 'cardId',
            as: 'q',
          },
        },
        {
          $project: {
            _id: 0,
            userIdObjectId: '$userId',
            type: 1,
            item: 1,
            direction: 1,
            front: 1,
            back: 1,
            mnemonic: 1,
            tag: 1,
            createdAt: 1,
            updatedAt: 1,
            nextReview: { $arrayElemAt: ['$q.nextReview', 0] },
            srsLevel: { $arrayElemAt: ['$q.srsLevel', 0] },
            stat: { $arrayElemAt: ['$q.stat', 0] },
          },
        },
      ])
      .toArray()
  ).map(
    ({
      userIdObjectId,
      front = '',
      back = '',
      mnemonic = '',
      tag = [],
      item: entry,
      type,
      direction,
      ...others
    }: {
      userIdObjectId: ObjectID
      /**
       * @default ''
       */
      front: string
      /**
       * @default ''
       */
      back: string
      /**
       * @default ''
       */
      mnemonic: string
      /**
       * @default []
       */
      tag: string[]
      item: string
      type: 'hanzi' | 'vocab' | 'sentence' | 'extra'
      direction: 'se' | 'te' | 'ec'
      srsLevel?: number
      stat?: typeof sQuizStat.type
    }) => {
      if (hsk.has(entry)) {
        tag.push('hsk')
      }

      if (others.stat) {
        others.stat.streak.maxRight = others.stat.streak.maxRight || 0
        others.stat.streak.maxWrong = others.stat.streak.maxWrong || 0
        ensureSchema(sQuizStat, others.stat)
      }

      const data = {
        ...others,
        entry,
        type,
        direction,
        userId: userIdMap.get(userIdObjectId.toHexString()),
        front: front || undefined,
        back: back || undefined,
        mnemonic: mnemonic || undefined,
        tag: tag.length ? tag : undefined,
      }

      const key = ser.hash({
        userId: data.userId,
        type: data.type,
        direction: data.direction,
        entry: data.entry,
      })
      const oldData = toMigrateQsMap.get(key)
      if (
        !oldData ||
        (oldData && data.srsLevel && data.srsLevel > (oldData.srsLevel || -1))
      ) {
        toMigrateQsMap.set(key, data)
      }
    }
  )

  if (toMigrateQsMap.size) {
    try {
      await DbQuizModel.insertMany(Array.from(toMigrateQsMap.values()), {
        ordered: false,
      })
    } catch (_) {}
  }

  const xs = await DbExtraModel.find().select('_id')
  const toMigrateXs = (
    await v1
      .collection<V1Extra>('extra')
      .find(
        xs.length
          ? {
              _id: {
                $nin: xs.map(({ _id }) => _id),
              },
            }
          : {}
      )
      .toArray()
  ).map(({ userId: userIdObjectId, chinese, pinyin, english, ...others }) => {
    return {
      ...others,
      chinese,
      pinyin,
      english,
      userId: userIdMap.get(userIdObjectId.toHexString()),
    }
  })

  if (toMigrateXs.length) {
    await DbExtraModel.insertMany(toMigrateXs)
  }

  await mongoose.disconnect()
}

if (require.main === module) {
  main()
}
