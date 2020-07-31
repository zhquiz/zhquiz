import {
  getModelForClass,
  index,
  prop,
  setGlobalOptions,
  Severity,
} from '@typegoose/typegoose'
import S from 'jsonschema-definer'
import { Schema } from 'mongoose'
import { nanoid } from 'nanoid'

import {
  sDateTime,
  sId,
  sQuizDirection,
  sQuizStat,
  sQuizType,
  sSrsLevel,
} from '@/util/schema'

import { ensureSchema } from './local'
import { getNextReview, repeatReview, srsMap } from './quiz'

setGlobalOptions({ options: { allowMixed: Severity.ALLOW } })

export class DbUser {
  @prop({ default: () => nanoid() }) _id?: string
  @prop({ required: true, unique: true }) email!: string
  @prop() name!: string
  @prop({ default: 1 }) levelMin?: number
  @prop({ default: 60 }) level?: number
  @prop() settings?: Record<string, any>

  static async signIn(email: string, name: string) {
    let user = await DbUserModel.findOne({ email })
    if (!user) {
      user = await DbUserModel.create({ email, name })
    }

    if (!user.name) {
      DbUserModel.updateOne(
        { email },
        {
          $set: { name },
        }
      )
    }

    return user
  }

  static async purgeOne(userId: string) {
    await DbExtraModel.purgeMany(userId)
    await DbQuizModel.deleteMany({ userId })
    await DbUserModel.deleteOne({ userId })
  }
}

export const DbUserModel = getModelForClass(DbUser, {
  schemaOptions: { collection: 'user', timestamps: true },
})

export const sDbQuizExport = S.shape({
  _id: sId.optional(),
  type: sQuizType.optional(),
  entry: S.string().optional(),
  direction: sQuizDirection.optional(),
  front: S.string().optional(),
  back: S.string().optional(),
  mnemonic: S.string().optional(),
  tag: S.list(S.string()).optional(),
  nextReview: sDateTime.optional(),
  srsLevel: sSrsLevel.optional(),
  stat: sQuizStat.optional(),
})

type IDbQuiz = typeof sDbQuizExport.type

@index({ userId: 1, type: 1, entry: 1, direction: 1 }, { unique: true })
export class DbQuiz implements IDbQuiz {
  @prop({ default: () => nanoid() }) _id?: string
  @prop({ required: true, index: true, ref: 'DbUser' }) userId!: string
  @prop({ required: true, validate: (s) => !!ensureSchema(sQuizType, s) })
  type!: typeof sQuizType.type

  @prop({ required: true }) entry!: string
  @prop({ required: true, validate: (s) => !!ensureSchema(sQuizDirection, s) })
  direction!: typeof sQuizDirection.type

  @prop() front?: string
  @prop() back?: string
  @prop() mnemonic?: string
  @prop({ index: true, type: Schema.Types.Mixed }) tag?: string[]
  @prop({ index: true }) nextReview?: Date
  @prop({ index: true }) srsLevel?: number
  @prop({ validate: (s) => !!ensureSchema(sQuizStat, s) })
  stat?: typeof sQuizStat.type

  markRight() {
    return this._updateSrsLevel(+1)()
  }

  markWrong() {
    return this._updateSrsLevel(-1)()
  }

  markRepeat() {
    return this._updateSrsLevel(0)()
  }

  private _updateSrsLevel(dSrsLevel: number) {
    return () => {
      this.stat = this.stat || {
        streak: {
          right: 0,
          wrong: 0,
          maxRight: 0,
          maxWrong: 0,
        },
      }

      if (dSrsLevel > 0) {
        this.stat.streak.right++
        this.stat.streak.wrong = 0
        this.stat.lastRight = new Date()

        if (this.stat.streak.right > this.stat.streak.maxRight) {
          this.stat.streak.maxRight = this.stat.streak.right
        }
      } else if (dSrsLevel < 0) {
        this.stat.streak.wrong++
        this.stat.streak.right = 0
        this.stat.lastWrong = new Date()

        if (this.stat.streak.wrong > this.stat.streak.maxWrong) {
          this.stat.streak.maxWrong = this.stat.streak.wrong
        }
      }

      this.srsLevel = this.srsLevel || 0

      this.srsLevel += dSrsLevel

      if (this.srsLevel >= srsMap.length) {
        this.srsLevel = srsMap.length - 1
      }

      if (this.srsLevel < 0) {
        this.srsLevel = 0
      }

      if (dSrsLevel > 0) {
        this.nextReview = getNextReview(this.srsLevel)
      } else {
        this.nextReview = repeatReview()
      }
    }
  }
}

export const DbQuizModel = getModelForClass(DbQuiz, {
  schemaOptions: { collection: 'quiz', timestamps: true },
})

export const sDbExtraExport = S.shape({
  _id: sId.optional(),
  chinese: S.string().optional(),
  pinyin: S.string().optional(),
  english: S.string().optional(),
})

type IDbExtraExport = typeof sDbExtraExport.type

@index({ userId: 1, chinese: 1 }, { unique: true })
class DbExtra implements IDbExtraExport {
  @prop({ default: () => nanoid() }) _id?: string
  @prop({ required: true, index: true, ref: 'DbUser' }) userId!: string
  @prop({ required: true }) chinese!: string
  @prop({ required: true }) pinyin!: string
  @prop({ required: true }) english!: string

  static async purgeMany(userId: string, cond?: any) {
    cond = cond
      ? {
          $and: [cond, { userId }],
        }
      : { userId }

    const rs = await DbExtraModel.find(cond).select({
      chinese: 1,
    })

    if (rs.length > 0) {
      await DbQuizModel.deleteMany({
        entry: { $in: rs.map((el) => el.chinese!) },
        type: 'extra',
        userId,
      })

      await Promise.all(rs.map((el) => el.remove()))
    }
  }
}

export const DbExtraModel = getModelForClass(DbExtra, {
  schemaOptions: { collection: 'extra', timestamps: true },
})
