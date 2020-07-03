import SparkMD5 from 'spark-md5'

export function getGravatarUrl(email: string = '0') {
  return `https://www.gravatar.com/avatar/${SparkMD5.hash(
    email.trim().toLocaleLowerCase()
  )}?d=mp?s=48`
}
