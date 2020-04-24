import { DocumentType } from '@typegoose/typegoose'

import { DbUser, DbUserModel } from './schema'

class Db {
  user: DocumentType<DbUser> | null = null

  async signIn (email: string) {
    this.user = await DbUserModel.findOne({ email })
    if (!this.user) {
      this.user = await DbUserModel.create({ email })
    }

    return this.user
  }

  async signOut () {
    this.user = null
  }
}

const db = new Db()

export default db
