import { DbUserModel } from './schema'

export async function signIn (email: string) {
  let user = await DbUserModel.findOne({ email })
  if (!user) {
    user = await DbUserModel.create({ email } as any)
  }

  return user
}
