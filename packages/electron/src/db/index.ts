import { DbUser } from './user'

export class Database {
  static async init() {
    await DbUser.init()
  }
}
