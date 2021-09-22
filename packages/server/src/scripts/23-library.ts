import fs from 'fs'
import path from 'path'

import { mongoose } from '@typegoose/typegoose'
import fg from 'fast-glob'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { DbLibraryModel } from '../db'

const sEntry = S.shape({
    entry: S.string(),
    alt: S.list(S.string()).optional(),
    reading: S.list(S.string()).optional(),
    english: S.list(S.string()).optional(),
})

export const sLibrary = S.shape({
    id: S.string(),
    createdAt: S.instanceOf(Date).optional(),
    updatedAt: S.instanceOf(Date).optional(),
    isShared: S.boolean().optional(),
    title: S.string(),
    entries: S.list(
        S.anyOf(
            S.string(),
            S.shape({
                entry: S.string(),
                alt: S.list(S.string()).optional(),
                reading: S.anyOf(S.string(), S.list(S.string())).optional(),
                translation: S.anyOf(S.string(), S.list(S.string())).optional(),
                english: S.anyOf(S.string(), S.list(S.string())).optional(),
            }).additionalProperties(true)
        )
    ).minItems(1),
    type: S.string().enum('character', 'vocabulary', 'sentence').optional(),
    description: S.string().optional(),
    tag: S.list(S.string()).optional(),
}).additionalProperties(true)

export async function populate() {
    const dir = path.join(__dirname, '../../library')
    const session = await mongoose.startSession()

    for (const filename of await fg(['**/*.yaml'], {
        cwd: dir,
    })) {
        const rs = S.list(sLibrary).ensure(
            yaml.load(fs.readFileSync(path.join(dir, filename), 'utf-8')) as any
        )

        DbLibraryModel.bulkWrite(
            rs.map((r) => {
                const op = {
                    updateOne: {
                        filter: { _id: r.id },
                        update: {
                            title: r.title,
                            entry: r.entries.map((el) => {
                                if (typeof el === 'string') {
                                    return sEntry.ensure({ entry: el })
                                }

                                el.english = el.english || el.translation

                                return sEntry.ensure({
                                    entry: el.entry,
                                    alt: el.alt,
                                    reading:
                                        typeof el.reading === 'string'
                                            ? [el.reading]
                                            : el.reading,
                                    english:
                                        typeof el.english === 'string'
                                            ? [el.english]
                                            : el.english,
                                })
                            }),
                            type: r.type || 'vocabulary',
                            description: r.description || '',
                            tag: r.tag || [],
                        },
                        upsert: true,
                    },
                }

                return op
            }),
            { session }
        )
    }

    await session.endSession({})
}
