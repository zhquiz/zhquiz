import {
    Severity,
    getModelForClass,
    modelOptions,
    prop,
} from '@typegoose/typegoose'
import shortUUID from 'short-uuid'

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: 'QuizPreset', allowMixed: Severity.ALLOW },
})
class DbQuizPreset {
    @prop({ default: () => shortUUID.generate() }) _id!: string
    /** REFERENCES DbUser(_id) ONUPDATE restrict */
    @prop({ required: true, index: true }) userId!: string

    @prop({ required: true, index: true }) name!: string
    @prop({ required: true }) settings!: unknown
}

export const DbQuizPresetModel = getModelForClass(DbQuizPreset)
