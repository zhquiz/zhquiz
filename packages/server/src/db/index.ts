import {
    Severity,
    getModelForClass,
    modelOptions,
    mongoose,
    pre,
    prop,
} from '@typegoose/typegoose'
import S from 'jsonschema-definer'
import { Model, Query } from 'mongoose'
import shortUUID from 'short-uuid'

import { DbEntryModel } from './Entry'
import { DbLibraryModel } from './Library'
import { DbQuizModel } from './Quiz'
import { DbQuizPresetModel } from './QuizPreset'
import { DbRadicalModel } from './Radical'

function userDeleteCascade(...targets: Model<any>[]) {
    return async function (next: (err?: any) => void) {
        // @ts-ignore
        const cls = this as any

        try {
            if (cls instanceof Query) {
                const userIds = await DbUserModel.find(cls.getQuery() as any, {
                    _id: 1,
                }).then((rs) => rs.map((r) => r._id))

                await Promise.all(
                    targets.map((dst) =>
                        dst.deleteMany({
                            userId: {
                                $in: userIds,
                            },
                        })
                    )
                )
            } else {
                await Promise.all(
                    targets.map((dst) =>
                        dst.deleteMany({
                            userId: cls._id,
                        })
                    )
                )
            }
            next()
        } catch (e) {
            next(e)
        }
    }
}

@pre<DbUser>(
    /(remove|delete)/gi,
    userDeleteCascade(
        DbQuizModel,
        DbQuizPresetModel,
        DbEntryModel,
        DbLibraryModel
    )
)
@modelOptions({
    schemaOptions: { timestamps: true, collection: 'User' },
    options: { allowMixed: Severity.ALLOW },
})
class DbUser {
    @prop({ default: () => shortUUID.generate() }) _id!: string
    @prop({ required: true, index: true }) identifier!: string

    @prop({
        default: () => ({
            max: 10,
            min: 3,
        }),
    })
    sentenceLength!: {
        max: number
        min: number
    }

    @prop({
        default: () => ({
            max: 60,
            min: 1,
        }),
    })
    level!: {
        max: number
        min: number
        vocabShowing: string[]
    }

    @prop() quizSettings?: Record<string, any>
}

export const DbUserModel = getModelForClass(DbUser)

export {
    DbQuizModel,
    DbQuizPresetModel,
    DbEntryModel,
    DbLibraryModel,
    DbRadicalModel,
}

export async function mongoConnect(uri = process.env['MONGO_URI']) {
    return mongoose.connect(S.string().ensure(uri!), {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
}
