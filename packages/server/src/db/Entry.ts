import { getModelForClass, index, prop } from '@typegoose/typegoose'
import shortUUID from 'short-uuid'

@index({ translation: 'text', description: 'text' })
class DbEntry {
    @prop({ default: () => shortUUID.generate() }) _id!: string
    /** REFERENCES DbUser(_id) ONUPDATE restrict; or _<STRING> */
    @prop({ required: true, index: true }) userId!: string

    @prop({ required: true, index: true }) type!: string
    @prop({ index: true }) level?: number

    @prop({ index: true }) lookupDate?: Date
    @prop() lookupCount?: number

    @prop({
        required: true,
        type: [String],
        validate: (v: string[]) => !!v[0],
        index: true,
    })
    entry!: string[]

    @prop({
        default: () => [],
        type: [String],
        index: true,
    })
    reading!: string[]

    @prop({
        default: () => [],
        type: [String],
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
}

export const DbEntryModel = getModelForClass(DbEntry, {
    schemaOptions: { timestamps: true },
    options: { customName: 'Entry' },
})
