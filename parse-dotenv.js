const { spawnSync } = require("child_process")

const dotenv = require('dotenv')

dotenv.config()

for (const name of [
  'MONGO_URI',
  'SECRET',
  'FIREBASE_SDK',
  'VUE_APP_FIREBASE_CONFIG'
]) {
  spawnSync('qovery', [
    'project',
    'env',
    'add',
    name,
    process.env[name]
  ], {
    stdio: 'inherit'
  })
}
