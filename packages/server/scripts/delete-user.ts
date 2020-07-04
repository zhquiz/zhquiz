import mongoose from 'mongoose'

import { DbCardModel, DbUserModel } from '../src/db/schema'

async function main() {
  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })

  const userIds = (
    await DbUserModel.find({ email: { $ne: 'patarapolw@gmail.com' } }).select({
      _id: 1,
    })
  ).map((el) => el._id)

  await DbCardModel.deleteMany({ userId: { $in: userIds } })

  await DbUserModel.deleteMany({ email: { $ne: 'patarapolw@gmail.com' } })

  mongoose.disconnect()
}

if (require.main === module) {
  main()
}
