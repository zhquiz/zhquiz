import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

export const sEntry = S.shape({
    entry: S.list(S.string()).minItems(1),
    reading: S.list(S.string()).optional(),
    translation: S.list(S.string()).optional(),
})

export type IEntry = typeof sEntry.type

@modelOptions({
    schemaOptions: { timestamps: true, collection: 'Library' },
})
class DbLibrary {
    @prop({ default: () => shortUUID.generate() }) _id!: string
    /** REFERENCES DbUser(_id) ONUPDATE restrict; or _<STRING> */
    @prop({ index: true }) userId?: string

    @prop({ required: true, index: true }) type!: string
    @prop({ required: true, index: true }) title!: string

    @prop({
        required: true,
        validate: (v: IEntry[]) => S.list(sEntry).minItems(1).validate(v)[0],
        type: [String],
        index: true,
    })
    entry!: IEntry[]

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

export const DbLibraryModel = getModelForClass(DbLibrary)
