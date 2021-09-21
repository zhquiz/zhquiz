import {
    getModelForClass,
    index,
    modelOptions,
    prop,
} from '@typegoose/typegoose'
import shortUUID from 'short-uuid'

@index<DbQuiz>({ userId: 1, entry: 1, type: 1, direction: 1 }, { unique: true })
@modelOptions({
    schemaOptions: { timestamps: true, collection: 'Quiz' },
})
class DbQuiz {
    @prop({ default: () => shortUUID.generate() }) _id!: string
    /** REFERENCES DbUser(_id) ONUPDATE restrict */
    @prop({ required: true, index: true }) userId!: string

    @prop({ required: true }) entry!: string
    @prop({ required: true }) type!: string
    @prop({ required: true }) direction!: string

    @prop({ default: '' }) hint!: string
    @prop({ default: '' }) mnemonic!: string

    @prop({ index: true }) srsLevel?: number
    @prop({ index: true }) nextReview?: Date
    @prop({ index: true }) lastRight?: Date
    @prop({ index: true }) lastWrong?: Date
    @prop({ index: true }) maxRight?: number
    @prop({ index: true }) maxWrong?: number
    @prop({ index: true }) rightStreak?: number
    @prop({ index: true }) wrongStreak?: number
}

export const DbQuizModel = getModelForClass(DbQuiz)
