import S from 'jsonschema-definer'

export const sQuizType = S.string().enum('hanzi', 'vocab', 'sentence')
export const sQuizDirection = S.string().enum('ce', 'ec', 'te')
