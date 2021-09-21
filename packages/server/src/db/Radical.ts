import {
    getModelForClass,
    index,
    modelOptions,
    prop,
} from '@typegoose/typegoose'

@index({ translation: 'text', description: 'text' })
@modelOptions({
    schemaOptions: { timestamps: true, collection: 'Radical' },
})
class DbRadical {
    @prop({ required: true }) _id!: string

    @prop({
        default: () => [],
        type: [String],
        index: true,
    })
    sub!: string[]

    @prop({
        default: () => [],
        type: [String],
        index: true,
    })
    sup!: string[]

    @prop({
        default: () => [],
        type: [String],
        index: true,
    })
    var!: string[]

    get entry() {
        return this._id
    }
}

export const DbRadicalModel = getModelForClass(DbRadical)
