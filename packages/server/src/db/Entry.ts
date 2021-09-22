import path from 'path'

import {
    getModelForClass,
    index,
    modelOptions,
    pre,
    prop,
} from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'
import toPinyin from 'chinese-to-pinyin'
import S from 'jsonschema-definer'
import jieba from 'nodejieba'
import shortUUID from 'short-uuid'

@pre<DbEntry>('validate', async function (next) {
    const entry = S.string().ensure(this.entry[0]!)

    if (!this.translation || !this.translation.length) {
        this.translation = await DbEntryModel.makeTranslation(this.simplified)
    }

    if (!this.level && this.type === 'sentence') {
        this.level = new Level().makeLevel(this.simplified)
    }

    if (!this.reading || !this.reading.length) {
        this.reading = [toPinyin(entry)]
    }

    if (!this.reading.includes('')) {
        this.reading = [
            ...this.reading,
            '',
            ...this.reading.map((r) => r.replace(/\d/g, '')),
        ]
    }

    next()
})
@index({ userId: 1, type: 1, 'entry.0': 1 }, { unique: true })
@index({ translation: 'text', description: 'text' })
@modelOptions({
    schemaOptions: { timestamps: true, collection: 'Entry' },
})
class DbEntry {
    @prop({ default: () => shortUUID.generate() }) _id!: string
    /** REFERENCES DbUser(_id) ONUPDATE restrict; or _<STRING> */
    @prop({ required: true, index: true }) userId!: string

    @prop({ required: true, index: true }) type!: string
    @prop({ index: true }) level?: number
    @prop({ index: true }) frequency?: number

    @prop({ index: true }) lookupDate?: Date
    @prop() lookupCount?: number

    @prop({
        required: true,
        type: [String],
        index: true,
    })
    entry!: string[]

    @prop({
        type: [String],
        index: true,
    })
    reading!: string[]

    @prop({
        default: () => [],
        type: [String],
        index: true,
    })
    translation!: string[]

    @prop({
        default: '',
    })
    description!: string

    @prop({
        default: () => [],
        type: [String],
        index: true,
    })
    tag!: string[]

    get simplified() {
        return this.entry[0]!
    }

    get traditional() {
        return this.entry.slice(1)
    }

    get pinyin() {
        const end = this.reading.indexOf('')
        return end > 0
            ? this.reading.slice(0, this.reading.indexOf(''))
            : this.reading
    }

    get english() {
        return this.translation
    }

    static async makeTranslation(simplified: string): Promise<string[]> {
        const segments = await DbEntryModel.find(
            {
                entry: {
                    $in: [...new Set(jieba.cutForSearch(simplified))].filter(
                        (v) => /\p{sc=Han}/u.test(v)
                    ),
                },
                type: 'vocabulary',
            },
            { entry: 1, reading: 1, translation: 1, level: 1 }
        )

        const entriesMap = new Map<
            string,
            {
                entry: string[]
                reading: string[]
                translation: string[]
            }
        >()
        segments.map((et) => {
            const et0 = et.entry[0]!
            let it = entriesMap.get(et0)
            if (!it) {
                it = {
                    entry: et.entry,
                    reading: et.reading,
                    translation: et.translation,
                }
            } else {
                const alt = [
                    ...new Set([...it.entry.slice(1), ...et.entry.slice(1)]),
                ].sort()
                it.entry = [et0, ...alt]

                const rUpper: string[] = []
                const rLower: string[] = []

                ;[...new Set([...it.reading, ...et.reading])]
                    .sort()
                    .map((r) => {
                        if (r[0] && r[0].toLocaleLowerCase() === r[0]) {
                            rLower.push(r)
                        } else {
                            rUpper.push(r)
                        }
                    })

                it.reading = [...rLower, ...rUpper]

                it.translation = [
                    ...new Set([...it.translation, ...et.translation]),
                ].sort()
            }
            entriesMap.set(et0, it)
        })

        return [
            [...entriesMap]
                .map(
                    ([k, v]) =>
                        `- ${v.entry.join(' ')} [${
                            v.reading.length
                                ? v.reading.join(' / ')
                                : toPinyin(k)
                        }] ${v.translation.join(' / ')}`
                )
                .join('\n'),
        ]
    }
}

export const DbEntryModel = getModelForClass(DbEntry)

export class Frequency {
    db = sqlite3(path.join(__dirname, '../../assets/freq.db'), {
        readonly: true,
    })

    cStmt = this.db.prepare(/* sql */ `
    SELECT frequency AS f FROM "character" WHERE "entry" = ?;
    `)

    vStmt = this.db.prepare(/* sql */ `
    SELECT frequency AS f FROM "vocabulary" WHERE "entry" = ?;
    `)

    cFreq(c: string) {
        return (this.cStmt.get(c)?.f as number) || 0
    }

    _vFreq(v: string) {
        return (this.vStmt.get(v)?.f as number) || 0
    }

    vFreq(v: string) {
        const allLevels = [...new Set(jieba.cutForSearch(v))]
            .filter((v) => /\p{sc=Han}/u.test(v))
            .map((v) => this._vFreq(v) || 0)

        if (allLevels.length) {
            return allLevels.reduce((prev, c) => prev + c, 0) / allLevels.length
        }

        return 0
    }

    close() {
        this.db.close()
    }
}

export class Level {
    db = sqlite3(path.join(__dirname, '../../assets/zhlevel.db'), {
        readonly: true,
    })

    makeLevel(v: string) {
        const raw = [...new Set(jieba.cutForSearch(v))].filter((v) =>
            /\p{sc=Han}/u.test(v)
        )
        if (!raw.length) {
            return 0
        }

        const segments = this.db
            .prepare(
                /* sql */ `
        SELECT "entry", vLevel "level" FROM zhlevel WHERE vLevel IS NOT NULL AND
        "entry" IN (${Array(raw.length).fill('?').join(',')})
        `
            )
            .all(...raw)

        if (!segments.length) {
            return 100
        }

        const entriesMap = new Map<string, number>()
        segments.map((et) => {
            if (et.level) {
                entriesMap.set(S.string().ensure(et.entry[0]!), et.level)
            }
        })

        return (
            ([...entriesMap.values()].reduce((prev, c) => prev + c, 0) *
                raw.length) /
            entriesMap.size
        )
    }
}

export function makePinyin(entry: string) {
    return toPinyin(entry, {
        toneToNumber: true,
        keepRest: true,
    })
}
