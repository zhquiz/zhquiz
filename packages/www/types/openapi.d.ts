import {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios'; 

declare namespace Paths {
  namespace CharacterGetByEntry {
    namespace Parameters {
      export type Entry = string;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
    }
    namespace Responses {
      export interface $200 {
        entry: string;
        reading: string[];
        english: string[];
      }
    }
  }
  namespace CharacterListLevel {
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
          level: number;
        }[];
      }
    }
  }
  namespace CharacterQuery {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: string[];
      }
    }
  }
  namespace CharacterRadical {
    namespace Parameters {
      export type Entry = string;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
    }
    namespace Responses {
      export interface $200 {
        sub: string[];
        sup: string[];
        var: string[];
      }
    }
  }
  namespace CharacterRandom {
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
  namespace CharacterSentence {
    namespace Parameters {
      export type Entry = string;
      export type Limit = number;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
          english: string;
        }[];
      }
    }
  }
  namespace CharacterVocabulary {
    namespace Parameters {
      export type Entry = string;
      export type Limit = number;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
        }[];
      }
    }
  }
  namespace EntryRandom {
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
  namespace ExtraCreate {
    export interface RequestBody {
      entry: string[];
      reading: string[];
      english: string[];
      type: "character" | "vocabulary" | "sentence";
      description: string;
      tag: string[];
    }
    namespace Responses {
      export interface $201 {
        id: string;
      }
    }
  }
  namespace ExtraDelete {
    namespace Parameters {
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace ExtraGetById {
    namespace Parameters {
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
    }
    namespace Responses {
      export interface $200 {
        entry: string[];
        reading: string[];
        english: string[];
        type: string;
        description: string;
        tag: string[];
      }
    }
  }
  namespace ExtraQuery {
    namespace Parameters {
      export type Limit = number;
      export type Page = number;
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
      page?: Parameters.Page;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string[];
          reading: string[];
          english: string[];
          type: "character" | "vocabulary" | "sentence";
          tag: string[];
        }[];
        count: number;
      }
    }
  }
  namespace ExtraUpdate {
    namespace Parameters {
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
    }
    export interface RequestBody {
      entry: string[];
      reading: string[];
      english: string[];
      type: "character" | "vocabulary" | "sentence";
      description: string;
      tag: string[];
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace QuizCreate {
    namespace Parameters {
      export type Entry = string;
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      type: Parameters.Type;
    }
    namespace Responses {
      export interface $201 {
        ids: string[];
      }
    }
  }
  namespace QuizDelete {
    namespace Parameters {
      export type Entry = string;
      export type Id = string;
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      id?: Parameters.Id;
      entry?: Parameters.Entry;
      type: Parameters.Type;
    }
  }
  namespace QuizGetOne {
    namespace Parameters {
      export type Direction = string;
      export type Entry = string;
      export type Id = string;
      export type Select = string;
      export type Type = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
      entry: Parameters.Entry;
      type: Parameters.Type;
      direction: Parameters.Direction;
      select: Parameters.Select;
    }
    namespace Responses {
      export interface $200 {
        result: {
        }[];
      }
    }
  }
  namespace QuizGetSrsLevel {
    namespace Parameters {
      export type Entry = string;
      export type Id = string;
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      id?: Parameters.Id;
      entry?: Parameters.Entry;
      type: Parameters.Type;
    }
    namespace Responses {
      export interface $200 {
        result: {
          id: string;
          entry: string;
          srsLevel: number;
        }[];
      }
    }
  }
  namespace QuizInit {
    namespace Parameters {
      export type Direction = string;
      export type IncludeUndue = boolean;
      export type Q = string;
      export type Stage = string;
      export type Type = string;
    }
    export interface QueryParameters {
      q?: Parameters.Q;
      type: Parameters.Type;
      stage: Parameters.Stage;
      direction: Parameters.Direction;
      includeUndue: Parameters.IncludeUndue;
    }
    namespace Responses {
      export interface $200 {
        quiz: {
          nextReview?: string; // date-time
          srsLevel?: number;
          wrongStreak?: number;
          id: string;
        }[];
        upcoming: {
          nextReview?: string; // date-time
          id: string;
        }[];
      }
    }
  }
  namespace QuizListLeech {
    namespace Parameters {
      export type Limit = number;
      export type Page = number;
      export type Q = string;
      export type Sort = string;
      export type SortDirection = "asc" | "desc";
    }
    export interface QueryParameters {
      q?: Parameters.Q;
      page: Parameters.Page;
      limit: Parameters.Limit;
      sort: Parameters.Sort;
      sortDirection: Parameters.SortDirection;
    }
    namespace Responses {
      export interface $200 {
        result: {
        }[];
        count: number;
      }
    }
  }
  namespace QuizUpdateSrsLevel {
    namespace Parameters {
      export type DLevel = 0 | 1 | -1;
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
      dLevel: Parameters.DLevel;
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace Reading {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: string;
      }
    }
  }
  namespace SentenceGetByEntry {
    namespace Parameters {
      export type Entry = string;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
    }
    namespace Responses {
      export interface $200 {
        entry: string;
        english: string[];
      }
    }
  }
  namespace SentenceQuery {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: string[];
      }
    }
  }
  namespace SentenceRandom {
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
  namespace Settings {
    namespace Responses {
      export interface $200 {
        csrf: string;
      }
    }
  }
  namespace Speak {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
  }
  namespace Tokenize {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: string[];
      }
    }
  }
  namespace UserGetSettings {
    namespace Parameters {
      export type Select = string;
    }
    export interface QueryParameters {
      select: Parameters.Select;
    }
    namespace Responses {
      export interface $200 {
        level?: number;
        levelMin?: number;
        quizSettings: {
          [name: string]: any;
        };
        levelBrowser?: string[];
      }
    }
  }
  namespace UserUpdateSettings {
    export interface RequestBody {
      level?: number;
      levelMin?: number;
      quizSettings: {
        [name: string]: any;
      };
      levelBrowser?: string[];
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace VocabQuery {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: string[];
      }
    }
  }
  namespace VocabularyGetByEntry {
    namespace Parameters {
      export type Entry = string;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
    }
    namespace Responses {
      export interface $200 {
        entry: string;
        alt: string[];
        reading: string[];
        english: string[];
      }
    }
  }
  namespace VocabularyListLevel {
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
          level: number;
        }[];
      }
    }
  }
  namespace VocabularySentence {
    namespace Parameters {
      export type Entry = string;
      export type Limit = number;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
          english: string;
        }[];
      }
    }
  }
}

export interface OperationMethods {
  /**
   * settings
   */
  'settings'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.Settings.Responses.$200>
  /**
   * characterRadical
   */
  'characterRadical'(
    parameters?: Parameters<Paths.CharacterRadical.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterRadical.Responses.$200>
  /**
   * characterVocabulary
   */
  'characterVocabulary'(
    parameters?: Parameters<Paths.CharacterVocabulary.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterVocabulary.Responses.$200>
  /**
   * characterSentence
   */
  'characterSentence'(
    parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterSentence.Responses.$200>
  /**
   * characterGetByEntry
   */
  'characterGetByEntry'(
    parameters?: Parameters<Paths.CharacterGetByEntry.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterGetByEntry.Responses.$200>
  /**
   * characterQuery
   */
  'characterQuery'(
    parameters?: Parameters<Paths.CharacterQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterQuery.Responses.$200>
  /**
   * characterRandom
   */
  'characterRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterRandom.Responses.$200>
  /**
   * characterListLevel
   */
  'characterListLevel'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterListLevel.Responses.$200>
  /**
   * extraGetById
   */
  'extraGetById'(
    parameters?: Parameters<Paths.ExtraGetById.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ExtraGetById.Responses.$200>
  /**
   * extraCreate
   */
  'extraCreate'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.ExtraCreate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ExtraCreate.Responses.$201>
  /**
   * extraUpdate
   */
  'extraUpdate'(
    parameters?: Parameters<Paths.ExtraUpdate.QueryParameters> | null,
    data?: Paths.ExtraUpdate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ExtraUpdate.Responses.$201>
  /**
   * extraDelete
   */
  'extraDelete'(
    parameters?: Parameters<Paths.ExtraDelete.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ExtraDelete.Responses.$201>
  /**
   * extraQuery
   */
  'extraQuery'(
    parameters?: Parameters<Paths.ExtraQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ExtraQuery.Responses.$200>
  /**
   * quizGetOne
   */
  'quizGetOne'(
    parameters?: Parameters<Paths.QuizGetOne.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizGetOne.Responses.$200>
  /**
   * quizCreate
   */
  'quizCreate'(
    parameters?: Parameters<Paths.QuizCreate.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizCreate.Responses.$201>
  /**
   * quizDelete
   */
  'quizDelete'(
    parameters?: Parameters<Paths.QuizDelete.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * quizListLeech
   */
  'quizListLeech'(
    parameters?: Parameters<Paths.QuizListLeech.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizListLeech.Responses.$200>
  /**
   * quizInit
   */
  'quizInit'(
    parameters?: Parameters<Paths.QuizInit.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizInit.Responses.$200>
  /**
   * quizUpdateSrsLevel
   */
  'quizUpdateSrsLevel'(
    parameters?: Parameters<Paths.QuizUpdateSrsLevel.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizUpdateSrsLevel.Responses.$201>
  /**
   * quizGetSrsLevel
   */
  'quizGetSrsLevel'(
    parameters?: Parameters<Paths.QuizGetSrsLevel.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizGetSrsLevel.Responses.$200>
  /**
   * sentenceGetByEntry
   */
  'sentenceGetByEntry'(
    parameters?: Parameters<Paths.SentenceGetByEntry.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceGetByEntry.Responses.$200>
  /**
   * sentenceQuery
   */
  'sentenceQuery'(
    parameters?: Parameters<Paths.SentenceQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceQuery.Responses.$200>
  /**
   * sentenceRandom
   */
  'sentenceRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceRandom.Responses.$200>
  /**
   * userGetSettings
   */
  'userGetSettings'(
    parameters?: Parameters<Paths.UserGetSettings.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UserGetSettings.Responses.$200>
  /**
   * userUpdateSettings
   */
  'userUpdateSettings'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.UserUpdateSettings.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UserUpdateSettings.Responses.$201>
  /**
   * userSignOut
   */
  'userSignOut'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * userDelete
   */
  'userDelete'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * tokenize
   */
  'tokenize'(
    parameters?: Parameters<Paths.Tokenize.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.Tokenize.Responses.$200>
  /**
   * reading
   */
  'reading'(
    parameters?: Parameters<Paths.Reading.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.Reading.Responses.$200>
  /**
   * speak
   */
  'speak'(
    parameters?: Parameters<Paths.Speak.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * vocabularySentence
   */
  'vocabularySentence'(
    parameters?: Parameters<Paths.VocabularySentence.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularySentence.Responses.$200>
  /**
   * vocabularyGetByEntry
   */
  'vocabularyGetByEntry'(
    parameters?: Parameters<Paths.VocabularyGetByEntry.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularyGetByEntry.Responses.$200>
  /**
   * vocabQuery
   */
  'vocabQuery'(
    parameters?: Parameters<Paths.VocabQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabQuery.Responses.$200>
  /**
   * entryRandom
   */
  'entryRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryRandom.Responses.$200>
  /**
   * vocabularyListLevel
   */
  'vocabularyListLevel'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularyListLevel.Responses.$200>
}

export interface PathsDictionary {
  ['/api/settings']: {
    /**
     * settings
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.Settings.Responses.$200>
  }
  ['/api/character/radical']: {
    /**
     * characterRadical
     */
    'get'(
      parameters?: Parameters<Paths.CharacterRadical.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterRadical.Responses.$200>
  }
  ['/api/character/vocabulary']: {
    /**
     * characterVocabulary
     */
    'get'(
      parameters?: Parameters<Paths.CharacterVocabulary.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterVocabulary.Responses.$200>
  }
  ['/api/character/sentence']: {
    /**
     * characterSentence
     */
    'get'(
      parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterSentence.Responses.$200>
  }
  ['/api/character/entry']: {
    /**
     * characterGetByEntry
     */
    'get'(
      parameters?: Parameters<Paths.CharacterGetByEntry.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterGetByEntry.Responses.$200>
  }
  ['/api/character/q']: {
    /**
     * characterQuery
     */
    'get'(
      parameters?: Parameters<Paths.CharacterQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterQuery.Responses.$200>
  }
  ['/api/character/random']: {
    /**
     * characterRandom
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterRandom.Responses.$200>
  }
  ['/api/character/level']: {
    /**
     * characterListLevel
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterListLevel.Responses.$200>
  }
  ['/api/extra/id']: {
    /**
     * extraGetById
     */
    'get'(
      parameters?: Parameters<Paths.ExtraGetById.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ExtraGetById.Responses.$200>
  }
  ['/api/extra/']: {
    /**
     * extraCreate
     */
    'put'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.ExtraCreate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ExtraCreate.Responses.$201>
    /**
     * extraUpdate
     */
    'patch'(
      parameters?: Parameters<Paths.ExtraUpdate.QueryParameters> | null,
      data?: Paths.ExtraUpdate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ExtraUpdate.Responses.$201>
    /**
     * extraDelete
     */
    'delete'(
      parameters?: Parameters<Paths.ExtraDelete.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ExtraDelete.Responses.$201>
  }
  ['/api/extra/q']: {
    /**
     * extraQuery
     */
    'get'(
      parameters?: Parameters<Paths.ExtraQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ExtraQuery.Responses.$200>
  }
  ['/api/quiz/']: {
    /**
     * quizGetOne
     */
    'get'(
      parameters?: Parameters<Paths.QuizGetOne.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizGetOne.Responses.$200>
    /**
     * quizCreate
     */
    'put'(
      parameters?: Parameters<Paths.QuizCreate.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizCreate.Responses.$201>
    /**
     * quizDelete
     */
    'delete'(
      parameters?: Parameters<Paths.QuizDelete.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/api/quiz/leech']: {
    /**
     * quizListLeech
     */
    'get'(
      parameters?: Parameters<Paths.QuizListLeech.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizListLeech.Responses.$200>
  }
  ['/api/quiz/init']: {
    /**
     * quizInit
     */
    'get'(
      parameters?: Parameters<Paths.QuizInit.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizInit.Responses.$200>
  }
  ['/api/quiz/updateSrsLevel']: {
    /**
     * quizUpdateSrsLevel
     */
    'patch'(
      parameters?: Parameters<Paths.QuizUpdateSrsLevel.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizUpdateSrsLevel.Responses.$201>
  }
  ['/api/quiz/srsLevel']: {
    /**
     * quizGetSrsLevel
     */
    'get'(
      parameters?: Parameters<Paths.QuizGetSrsLevel.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizGetSrsLevel.Responses.$200>
  }
  ['/api/sentence/entry']: {
    /**
     * sentenceGetByEntry
     */
    'get'(
      parameters?: Parameters<Paths.SentenceGetByEntry.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.SentenceGetByEntry.Responses.$200>
  }
  ['/api/sentence/q']: {
    /**
     * sentenceQuery
     */
    'get'(
      parameters?: Parameters<Paths.SentenceQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.SentenceQuery.Responses.$200>
  }
  ['/api/sentence/random']: {
    /**
     * sentenceRandom
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.SentenceRandom.Responses.$200>
  }
  ['/api/user/']: {
    /**
     * userGetSettings
     */
    'get'(
      parameters?: Parameters<Paths.UserGetSettings.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UserGetSettings.Responses.$200>
    /**
     * userUpdateSettings
     */
    'patch'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.UserUpdateSettings.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UserUpdateSettings.Responses.$201>
  }
  ['/api/user/signOut']: {
    /**
     * userSignOut
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/api/user/deleteUser']: {
    /**
     * userDelete
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/api/util/tokenize']: {
    /**
     * tokenize
     */
    'get'(
      parameters?: Parameters<Paths.Tokenize.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.Tokenize.Responses.$200>
  }
  ['/api/util/reading']: {
    /**
     * reading
     */
    'get'(
      parameters?: Parameters<Paths.Reading.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.Reading.Responses.$200>
  }
  ['/api/util/speak']: {
    /**
     * speak
     */
    'get'(
      parameters?: Parameters<Paths.Speak.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/api/vocabulary/sentence']: {
    /**
     * vocabularySentence
     */
    'get'(
      parameters?: Parameters<Paths.VocabularySentence.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularySentence.Responses.$200>
  }
  ['/api/vocabulary/entry']: {
    /**
     * vocabularyGetByEntry
     */
    'get'(
      parameters?: Parameters<Paths.VocabularyGetByEntry.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularyGetByEntry.Responses.$200>
  }
  ['/api/vocabulary/q']: {
    /**
     * vocabQuery
     */
    'get'(
      parameters?: Parameters<Paths.VocabQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabQuery.Responses.$200>
  }
  ['/api/vocabulary/random']: {
    /**
     * entryRandom
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryRandom.Responses.$200>
  }
  ['/api/vocabulary/level']: {
    /**
     * vocabularyListLevel
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularyListLevel.Responses.$200>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
