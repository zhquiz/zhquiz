import path from 'path'

import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'

import { DbRadicalModel, mongoConnect } from '../db'

export async function populate() {
    const s3 = sqlite3(path.join(__dirname, '../../assets/radical.db'), {
        readonly: true,
    })
    const reHan = /\p{sc=Han}/gu
    const getHan = (s = '') => {
        let m: RegExpExecArray | null = null
        reHan.lastIndex = 0

        const out: string[] = []
        while ((m = reHan.exec(s))) {
            out.push(m[0]!)
        }

        return out
    }

    const session = await mongoose.startSession()

    const batchSize = 10000

    const lots = s3
        .prepare(
            /* sql */ `
    SELECT "entry", "sub", "sup", "var"
    FROM radical
    `
        )
        .all()
        .map((p) => {
            const op = {
                _id: p.entry,
                sub: getHan(p.sub),
                sup: getHan(p.sup),
                var: getHan(p.var),
            }

            return op
        })

    for (let i = 0; i < lots.length; i += batchSize) {
        console.log(i)
        await DbRadicalModel.insertMany(lots.slice(i, i + batchSize), {
            session,
            ordered: false,
        }).catch(console.error)
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
