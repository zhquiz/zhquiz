import { getModelForClass, index, pre, prop } from '@typegoose/typegoose'
import makePinyin from 'chinese-to-pinyin'
import S from 'jsonschema-definer'
import jieba from 'nodejieba'
import shortUUID from 'short-uuid'

@pre<DbEntry>('validate', async function (next) {
    const entry = S.string().ensure(this.entry[0]!)

    let segments: any[] = []

    if (!this.translation || !this.translation.length) {
        segments = await this.makeTranslation()
    }

    if (!this.level && this.type === 'sentence') {
        this.level = await this.makeLevel(segments)
    }

    if (!this.reading || !this.reading.length) {
        this.reading = [
            makePinyin(entry, {
                toneToNumber: true,
                keepRest: true,
            }),
        ]
    }

    if (!this.reading.includes('')) {
        this.reading = [
            ...this.reading,
            '',
            ...this.reading.map((r) => r.replace(/\d/g, '')),
        ]
    }

    this.simplified = entry

    next()
})
@index({ userId: 1, type: 1, simplified: 1 }, { unique: true })
@index({ translation: 'text', description: 'text' })
class DbEntry {
    @prop({ default: () => shortUUID.generate() }) _id!: string
    /** REFERENCES DbUser(_id) ONUPDATE restrict; or _<STRING> */
    @prop({ required: true, index: true }) userId!: string

    @prop({ required: true, index: true }) type!: string
    @prop({ index: true }) level?: number

    @prop({ index: true }) lookupDate?: Date
    @prop() lookupCount?: number
    @prop({ index: true }) simplified!: string

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

    makeReading(): string {
        return makePinyin(this.simplified, {
            toneToNumber: true,
            keepRest: true,
        })
    }

    async makeTranslation(): Promise<
        {
            entry: string[]
            reading: string[]
            translation: string[]
            level?: number
        }[]
    > {
        const segments = await DbEntryModel.find(
            {
                entry: {
                    $in: [
                        ...new Set(jieba.cutForSearch(this.simplified)),
                    ].filter((v) => /\p{sc=Han}/u.test(v)),
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

        this.translation = [
            [...entriesMap]
                .map(
                    ([k, v]) =>
                        `- ${v.entry.join(' ')} [${
                            v.reading.length
                                ? v.reading.join(' / ')
                                : makePinyin(k, {
                                      toneToNumber: true,
                                      keepRest: true,
                                  })
                        }] ${v.translation.join(' / ')}`
                )
                .join('\n'),
        ]

        return segments
    }

    async makeLevel(
        segments: {
            entry: string[]
            level?: number
        }[] = []
    ) {
        const raw = [...new Set(jieba.cutForSearch(this.simplified))].filter(
            (v) => /\p{sc=Han}/u.test(v)
        )

        if (!segments.length) {
            segments = await DbEntryModel.find(
                {
                    entry: { $in: raw },
                    type: 'vocabulary',
                    level: { $exists: true },
                },
                { entry: 1, level: 1 }
            )
        }

        const entriesMap = new Map<string, number>()
        segments.map((et) => {
            if (et.level) {
                entriesMap.set(S.string().ensure(et.entry[0]!), et.level)
            }
        })

        this.level =
            ([...entriesMap.values()].reduce((prev, c) => prev + c, 0) *
                raw.length) /
            entriesMap.size

        return this.level
    }
}

export const DbEntryModel = getModelForClass(DbEntry, {
    schemaOptions: { timestamps: true },
    options: { customName: 'Entry' },
})
