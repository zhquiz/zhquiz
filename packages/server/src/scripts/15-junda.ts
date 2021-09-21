import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'

import { DbEntryModel } from '../db'

export async function populate(
    /** @default './assets' */
    dir: string
) {
    process.chdir(dir)

    const s3 = sqlite3('./junda.db', {
        readonly: true,
    })

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
                        type: 'vocab',
                        userId: '_junda',
                        _id: `_h-${p.character}`,
                        entry: [p.character],
                        reading: p.pinyin.split('/').filter((s: string) => s),
                        translation: p.english
                            .split('/')
                            .filter((s: string) => s),
                        frequency: p.frequency,
                        level: 0,
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
