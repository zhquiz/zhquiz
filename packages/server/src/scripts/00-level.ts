import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'

import { DbEntryModel } from '../db'

export async function populate(
    /** @default './assets' */
    dir: string
) {
    process.chdir(dir)

    const s3 = sqlite3('./zhlevel.db', {
        readonly: true,
    })

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

            if (p.hLevel) {
                const _id = `_c-${entry}`
                ops.push({
                    updateOne: {
                        filter: { _id },
                        update: {
                            type: 'vocabulary',
                            userId: '_zhlevel',
                            _id,
                            entry,
                            frequency: 0,
                            level: 0,
                        },
                        upsert: true,
                    },
                })
            } else if (p.vLevel) {
                const _id = `_c-${entry}`
                ops.push({
                    updateOne: {
                        filter: { _id },
                        update: {
                            type: 'character',
                            userId: '_zhlevel',
                            _id,
                            entry,
                            frequency: 0,
                            level: 0,
                        },
                        upsert: true,
                    },
                })
            }

            return ops
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
