import path from 'path'

import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'

import { DbEntryModel, mongoConnect } from '../db'
import { Frequency } from '../db/Entry'

export async function populate() {
    const s3 = sqlite3(path.join(__dirname, '../../assets/junda.db'), {
        readonly: true,
    })

    const f = new Frequency()
    const session = await mongoose.startSession()

    const batchSize = 10000

    const lots = s3
        .prepare(
            /* sql */ `
    SELECT "id", "character", "raw_freq" "frequency", "pinyin", "english"
    FROM hanzi
    `
        )
        .all()
        .map((p) => {
            const _id = `_c-${p.character}`
            const op = {
                updateOne: {
                    filter: { _id },
                    update: {
                        type: 'character',
                        userId: '_junda',
                        entry: [p.character],
                        reading: p.pinyin.split('/').filter((s: string) => s),
                        translation: p.english
                            .split('/')
                            .filter((s: string) => s),
                        frequency: f.cFreq(p.character),
                    },
                    upsert: true,
                },
            }

            return op
        })

    for (let i = 0; i < lots.length; i += batchSize) {
        console.log(i)
        await DbEntryModel.bulkWrite(lots.slice(i, i + batchSize), {
            session,
            ordered: false,
        })
    }

    await session.endSession({})
    s3.close()
}

if (require.main === module) {
    mongoConnect('mongodb://127.0.0.1:27018/zhquiz').then(async (c) => {
        await populate()
        await c.disconnect()
    })
}
