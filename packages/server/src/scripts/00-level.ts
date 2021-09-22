import path from 'path'

import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'
import makePinyin from 'chinese-to-pinyin'

import { DbEntryModel, mongoConnect } from '../db'
import { Frequency } from '../db/Entry'

export async function populate() {
    const s3 = sqlite3(path.join(__dirname, '../../assets/zhlevel.db'), {
        readonly: true,
    })
    const f = new Frequency()

    const session = await mongoose.startSession()

    const batchSize = 5000

    const lots = s3
        .prepare(
            /* sql */ `
        SELECT
            "entry",
            hLevel,
            vLevel
        FROM zhlevel
        `
        )
        .all()
        .flatMap((p) => {
            const ops: any[] = []
            const entry = p.entry.replace(/……/g, '...')
            const reading = [
                makePinyin(entry, {
                    toneToNumber: true,
                    keepRest: true,
                }),
            ]

            if (p.hLevel) {
                const _id = `_c-${entry}`
                ops.push({
                    type: 'character',
                    userId: '_zhlevel',
                    _id,
                    entry: [entry],
                    reading,
                    frequency: f.cFreq(entry),
                    level: p.hLevel,
                })
            } else if (p.vLevel) {
                const _id = `_v-${entry}`
                ops.push({
                    type: 'vocabulary',
                    userId: '_zhlevel',
                    _id,
                    entry: [entry],
                    reading,
                    frequency: f.vFreq(entry),
                    level: p.vLevel,
                })
            }

            return ops
        })

    for (let i = 0; i < lots.length; i += batchSize) {
        console.log(i)
        await DbEntryModel.insertMany(lots.slice(i, i + batchSize), {
            session,
            ordered: false,
        })
    }

    await session.endSession({})
    s3.close()
    f.close()
}

if (require.main === module) {
    mongoConnect('mongodb://127.0.0.1:27018/zhquiz').then(async (c) => {
        await populate()
        await c.disconnect()
    })
}
