import crypto from 'crypto'

import {
  Collection,
  Entity,
  JsonType,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property
} from '@mikro-orm/core'
import { Ulid } from 'id128'

import { getNextReview, srsMap } from './quiz'
import { sQuizDirection, sQuizType } from './types'

@Entity({ tableName: 'user' })
export class DbUser {
  @PrimaryKey() id = Ulid.generate().toCanonical()

  @Property({ unique: true }) email!: string
  @Property() name!: string
  @Property() image!: string
  @Property() apiKey = DbUser.newApiKey()

  @Property() apiForvo?: string

  @OneToMany(() => DbQuiz, (ev) => ev.userId)
  quizzes = new Collection<DbQuiz>(this)

  @OneToMany(() => DbEntry, (ev) => ev.userId)
  entries = new Collection<DbEntry>(this)

  constructor(email: string, image?: string, name?: string) {
    this.email = email
    this.image = image || 'https://www.gravatar.com/avatar/0?d=mp'
    this.name = email.replace(/@.+$/, '') || 'Default'
  }

  static newApiKey() {
    return crypto.randomBytes(64).toString('base64').replace(/=+$/, '')
  }
}

@Entity({ tableName: 'tag' })
export class DbTag {
  @PrimaryKey() id!: number
  @Property({ index: true }) name!: string

  constructor(name: string) {
    this.name = name
  }
}

@Entity({ tableName: 'quiz' })
export class DbQuiz {
  @PrimaryKey() id = Ulid.generate().toCanonical()
  @Property() createdAt = new Date()
  @Property({ onUpdate: () => new Date() }) updatedAt?: Date

  @ManyToOne(() => DbUser, { mapToPk: true, onDelete: 'cascade' }) userId!: string
  @ManyToMany() tags = new Collection<DbTag>(this)

  // Entry references

  @Property({ index: true }) entry!: string
  @Property({ index: true }) type!: typeof sQuizType.type
  @Property({ index: true }) direction!: typeof sQuizDirection.type

  // Quiz annotations

  @Property() front?: string
  @Property() back?: string
  @Property() mnemonic?: string

  // Quiz stats

  @Property({ index: true }) srsLevel?: number
  @Property({ index: true }) nextReview?: Date
  @Property({ index: true }) lastRight?: Date
  @Property({ index: true }) lastWrong?: Date
  @Property({ index: true }) rightStreak?: number
  @Property({ index: true }) wrongStreak?: number
  @Property({ index: true }) maxRight?: number
  @Property({ index: true }) maxWrong?: number

  constructor(
    userId: string,
    {
      entry,
      type,
      direction
    }: {
      entry: string
      type: typeof sQuizType.type
      direction: typeof sQuizDirection.type
    }
  ) {
    this.userId = userId
    this.entry = entry
    this.type = type
    this.direction = direction
  }

  markRight = this._updateSrsLevel(+1)
  markWrong = this._updateSrsLevel(-1)
  markRepeat = this._updateSrsLevel(0)

  private _updateSrsLevel(dSrsLevel: number) {
    return () => {
      if (dSrsLevel > 0) {
        this.rightStreak = this.rightStreak || 0
        this.rightStreak++
        this.wrongStreak = 0
        this.lastRight = new Date()

        if (
          typeof this.maxRight === 'undefined' ||
          this.rightStreak > this.maxRight
        ) {
          this.maxRight = this.rightStreak
        }
      } else if (dSrsLevel < 0) {
        this.wrongStreak = this.wrongStreak || 0
        this.wrongStreak++
        this.rightStreak = 0
        this.lastWrong = new Date()

        if (
          typeof this.maxWrong === 'undefined' ||
          this.wrongStreak > this.maxWrong
        ) {
          this.maxWrong = this.wrongStreak
        }
      }

      this.srsLevel = this.srsLevel || 0
      this.srsLevel++

      if (this.srsLevel >= srsMap.length) {
        this.srsLevel = srsMap.length - 1
      }

      if (this.srsLevel < 0) {
        this.srsLevel = 0
      }

      if (dSrsLevel > 0) {
        this.nextReview = getNextReview(this.srsLevel)
      }
    }
  }
}

@Entity({ tableName: 'entry' })
export class DbEntry {
  @PrimaryKey() id = Ulid.generate().toCanonical()
  @Property() createdAt = new Date()
  @Property({ onUpdate: () => new Date() }) updatedAt?: Date

  @ManyToOne(() => DbUser, { mapToPk: true, onDelete: 'cascade' }) userId!: string
  @ManyToMany() tags = new Collection<DbTag>(this)

  @OneToMany(() => DbEntryValue, (ev) => ev.entry)
  entries = new Collection<DbEntryValue>(this)

  @Property({ type: JsonType }) reading!: string[]
  @Property({ type: JsonType }) translation!: string[]

  @Property() type!: typeof sQuizType.type

  static create(
    userId: string,
    {
      simplified,
      traditional = [],
      reading = [],
      translation = []
    }: {
      simplified: string
      traditional?: string[]
      reading?: string[]
      translation?: string[]
    }
  ) {
    const u = new DbEntry(userId, { reading, translation })

    const entries = [simplified, ...traditional].map(
      (t) => new DbEntryValue(u, t)
    )

    return [u, ...entries]
  }

  private constructor(
    userId: string,
    {
      reading = [],
      translation = []
    }: {
      reading?: string[]
      translation?: string[]
    }
  ) {
    this.userId = userId
    this.reading = reading
    this.translation = translation
  }
}

/**
 * @internal
 */
@Entity({ tableName: 'entry_value' })
export class DbEntryValue {
  @PrimaryKey() id!: number
  @Property({ index: true }) name!: string

  @ManyToOne({ onDelete: 'cascade' }) entry!: DbEntry

  constructor(entry: DbEntry, name: string) {
    this.entry = entry
    this.name = name
  }
}

@Entity({ tableName: 'deck' })
export class Deck {
  @PrimaryKey() id = Ulid.generate().toCanonical()
  @Property() createdAt = new Date()
  @Property({ onUpdate: () => new Date() }) updatedAt?: Date

  @ManyToOne(() => DbUser, { mapToPk: true, onDelete: 'cascade' }) userId!: string

  @Property() name!: string
  @Property() q!: string

  constructor(userId: string, name: string, q: string) {
    this.userId = userId
    this.name = name
    this.q = q
  }
}
