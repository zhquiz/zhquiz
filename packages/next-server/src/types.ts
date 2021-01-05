import S from 'jsonschema-definer'

export const sStatus = S.shape({
  new: S.boolean(),
  due: S.boolean(),
  leech: S.boolean(),
  graduated: S.boolean()
})

export type IStatus = typeof sStatus.type

export const sSuccess = S.shape({
  result: S.string()
})

export type ISuccess = typeof sSuccess.type

export const sError = S.shape({
  error: S.string()
})

export type IError = typeof sError.type
