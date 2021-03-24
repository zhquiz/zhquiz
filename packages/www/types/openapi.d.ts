import {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios'; 

declare namespace Paths {
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
  namespace CharacterSentence {
    namespace Parameters {
      export type Entry = string;
      export type Limit = number;
      export type Page = number;
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
  namespace EntryCreate {
    export interface RequestBody {
      entry: string;
      alt: string[];
      reading: {
        type?: string;
        kana: string;
      }[];
      english: string[];
      audio?: string[];
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
  namespace EntryDelete {
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
  namespace EntryGetByEntry {
    namespace Parameters {
      export type Entry = string;
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      type: Parameters.Type;
    }
    namespace Responses {
      export interface $200 {
        entry: string;
        alt: string[];
        reading: {
          type?: string;
          kana: string;
        }[];
        english: string[];
        segments: string[];
      }
    }
  }
  namespace EntryGetById {
    namespace Parameters {
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
    }
    namespace Responses {
      export interface $200 {
        entry: string;
        alt: string[];
        reading: {
          type?: string;
          kana: string;
        }[];
        english: string[];
        audio: string[];
        type: string;
        description: string;
        tag: string[];
      }
    }
  }
  namespace EntryListLevel {
    namespace Parameters {
      export type Type = "character" | "vocabulary";
    }
    export interface QueryParameters {
      type: Parameters.Type;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
          level: number;
        }[];
      }
    }
  }
  namespace EntryQuery {
    namespace Parameters {
      export type All = boolean;
      export type Limit = number;
      export type Page = number;
      export type Q = string;
      export type Select = string;
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      q: Parameters.Q;
      page?: Parameters.Page;
      limit?: Parameters.Limit;
      all?: Parameters.All;
      type?: Parameters.Type;
      select: Parameters.Select;
    }
    namespace Responses {
      export interface $200 {
        result: {
          id: string;
          entry: string;
          alt: string[];
          reading: {
            type?: string;
            kana: string;
          }[];
          english: string[];
          type: string;
          description: string;
          source?: string;
          tag: string[];
        }[];
        count: number;
      }
    }
  }
  namespace EntryRandom {
    namespace Parameters {
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      type: Parameters.Type;
    }
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
  namespace EntryUpdate {
    namespace Parameters {
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
    }
    export interface RequestBody {
      entry: string;
      alt: string[];
      reading: {
        type?: string;
        kana: string;
      }[];
      english: string[];
      audio?: string[];
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
  namespace LibraryCreate {
    export interface RequestBody {
      title: string;
      entries: string[];
      type: string;
      description: string;
      tag: string[];
    }
    namespace Responses {
      export interface $201 {
        id: string;
      }
    }
  }
  namespace LibraryDelete {
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
  namespace LibraryGetOne {
    namespace Parameters {
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
    }
    namespace Responses {
      export interface $200 {
        title: string;
        entries: string[];
        type: string;
        description: string;
        tag: string[];
      }
    }
  }
  namespace LibraryQuery {
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
          id: string;
          title: string;
          entries: string[];
          type: string;
          description: string;
          tag: string[];
        }[];
        count: number;
      }
    }
  }
  namespace LibraryUpdate {
    namespace Parameters {
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
    }
    export interface RequestBody {
      title: string;
      entries: string[];
      type: string;
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
    export interface RequestBody {
      entry: (string | {
        entry: string;
        alt?: string[];
        reading?: string[];
        english?: string[];
      })[];
      type: string;
      description?: string;
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace QuizDeleteByEntries {
    export interface RequestBody {
      entry: string[];
      type: string;
      direction?: string[];
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace QuizDoLevel {
    namespace Parameters {
      export type D = number;
      export type Id = string;
    }
    export interface QueryParameters {
      id: Parameters.Id;
      d: Parameters.D;
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace QuizGetByEntries {
    export interface RequestBody {
      entry: string[];
      type: string;
      direction?: string[];
    }
    namespace Responses {
      export interface $200 {
        result: {
          id: string;
          entry: string;
          type: string;
          direction: string;
        }[];
      }
    }
  }
  namespace QuizGetInit {
    export interface RequestBody {
      q: string;
      type: string[];
      direction: string[];
      stage: string[];
      include: ("undue")[];
    }
    namespace Responses {
      export interface $200 {
        quiz: {
          id: string;
          nextReview?: string; // date-time
          stage: string;
          entry: string;
          type: string;
          direction: string;
        }[];
        upcoming: {
          nextReview?: string; // date-time
        }[];
      }
    }
  }
  namespace QuizGetSrsLevelByEntries {
    export interface RequestBody {
      entry: string[];
      type: string;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
          srsLevel: number;
        }[];
      }
    }
  }
  namespace UserSettings {
    namespace Parameters {
      export type Select = string;
    }
    export interface QueryParameters {
      select: Parameters.Select;
    }
    namespace Responses {
      export interface $200 {
        levelDisplayVocab?: string[];
      }
    }
  }
  namespace UserUpdate {
    export interface RequestBody {
      levelDisplayVocab?: string[];
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace UtilReading {
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
  namespace UtilSpeak {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
  }
  namespace UtilTokenize {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: {
          [name: string]: any;
          surface_form: string;
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
  ): OperationResponse<any>
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
   * entryGetById
   */
  'entryGetById'(
    parameters?: Parameters<Paths.EntryGetById.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryGetById.Responses.$200>
  /**
   * entryCreate
   */
  'entryCreate'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.EntryCreate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryCreate.Responses.$201>
  /**
   * entryUpdate
   */
  'entryUpdate'(
    parameters?: Parameters<Paths.EntryUpdate.QueryParameters> | null,
    data?: Paths.EntryUpdate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryUpdate.Responses.$201>
  /**
   * entryDelete
   */
  'entryDelete'(
    parameters?: Parameters<Paths.EntryDelete.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryDelete.Responses.$201>
  /**
   * entryGetByEntry
   */
  'entryGetByEntry'(
    parameters?: Parameters<Paths.EntryGetByEntry.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryGetByEntry.Responses.$200>
  /**
   * entryQuery
   */
  'entryQuery'(
    parameters?: Parameters<Paths.EntryQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryQuery.Responses.$200>
  /**
   * entryRandom
   */
  'entryRandom'(
    parameters?: Parameters<Paths.EntryRandom.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryRandom.Responses.$200>
  /**
   * entryListLevel
   */
  'entryListLevel'(
    parameters?: Parameters<Paths.EntryListLevel.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.EntryListLevel.Responses.$200>
  /**
   * libraryGetOne
   */
  'libraryGetOne'(
    parameters?: Parameters<Paths.LibraryGetOne.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.LibraryGetOne.Responses.$200>
  /**
   * libraryCreate
   */
  'libraryCreate'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.LibraryCreate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.LibraryCreate.Responses.$201>
  /**
   * libraryUpdate
   */
  'libraryUpdate'(
    parameters?: Parameters<Paths.LibraryUpdate.QueryParameters> | null,
    data?: Paths.LibraryUpdate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.LibraryUpdate.Responses.$201>
  /**
   * libraryDelete
   */
  'libraryDelete'(
    parameters?: Parameters<Paths.LibraryDelete.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.LibraryDelete.Responses.$201>
  /**
   * libraryQuery
   */
  'libraryQuery'(
    parameters?: Parameters<Paths.LibraryQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.LibraryQuery.Responses.$200>
  /**
   * quizCreate
   */
  'quizCreate'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizCreate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizCreate.Responses.$201>
  /**
   * quizDoLevel
   */
  'quizDoLevel'(
    parameters?: Parameters<Paths.QuizDoLevel.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizDoLevel.Responses.$201>
  /**
   * quizDeleteByEntries
   */
  'quizDeleteByEntries'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizDeleteByEntries.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizDeleteByEntries.Responses.$201>
  /**
   * quizGetInit
   */
  'quizGetInit'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizGetInit.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizGetInit.Responses.$200>
  /**
   * quizGetByEntries
   */
  'quizGetByEntries'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizGetByEntries.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizGetByEntries.Responses.$200>
  /**
   * quizGetSrsLevelByEntries
   */
  'quizGetSrsLevelByEntries'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizGetSrsLevelByEntries.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizGetSrsLevelByEntries.Responses.$200>
  /**
   * userSettings
   */
  'userSettings'(
    parameters?: Parameters<Paths.UserSettings.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UserSettings.Responses.$200>
  /**
   * userUpdate
   */
  'userUpdate'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.UserUpdate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UserUpdate.Responses.$201>
  /**
   * utilTokenize
   */
  'utilTokenize'(
    parameters?: Parameters<Paths.UtilTokenize.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UtilTokenize.Responses.$200>
  /**
   * utilReading
   */
  'utilReading'(
    parameters?: Parameters<Paths.UtilReading.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UtilReading.Responses.$200>
  /**
   * utilSpeak
   */
  'utilSpeak'(
    parameters?: Parameters<Paths.UtilSpeak.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * characterSentence
   */
  'characterSentence'(
    parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterSentence.Responses.$200>
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
    ): OperationResponse<any>
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
  ['/api/entry/id']: {
    /**
     * entryGetById
     */
    'get'(
      parameters?: Parameters<Paths.EntryGetById.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryGetById.Responses.$200>
  }
  ['/api/entry/']: {
    /**
     * entryCreate
     */
    'put'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.EntryCreate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryCreate.Responses.$201>
    /**
     * entryUpdate
     */
    'patch'(
      parameters?: Parameters<Paths.EntryUpdate.QueryParameters> | null,
      data?: Paths.EntryUpdate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryUpdate.Responses.$201>
    /**
     * entryDelete
     */
    'delete'(
      parameters?: Parameters<Paths.EntryDelete.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryDelete.Responses.$201>
  }
  ['/api/entry/entry']: {
    /**
     * entryGetByEntry
     */
    'get'(
      parameters?: Parameters<Paths.EntryGetByEntry.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryGetByEntry.Responses.$200>
  }
  ['/api/entry/q']: {
    /**
     * entryQuery
     */
    'get'(
      parameters?: Parameters<Paths.EntryQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryQuery.Responses.$200>
  }
  ['/api/entry/random']: {
    /**
     * entryRandom
     */
    'get'(
      parameters?: Parameters<Paths.EntryRandom.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryRandom.Responses.$200>
  }
  ['/api/entry/level']: {
    /**
     * entryListLevel
     */
    'get'(
      parameters?: Parameters<Paths.EntryListLevel.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.EntryListLevel.Responses.$200>
  }
  ['/api/library/id']: {
    /**
     * libraryGetOne
     */
    'get'(
      parameters?: Parameters<Paths.LibraryGetOne.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.LibraryGetOne.Responses.$200>
  }
  ['/api/library/']: {
    /**
     * libraryCreate
     */
    'put'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.LibraryCreate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.LibraryCreate.Responses.$201>
    /**
     * libraryUpdate
     */
    'patch'(
      parameters?: Parameters<Paths.LibraryUpdate.QueryParameters> | null,
      data?: Paths.LibraryUpdate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.LibraryUpdate.Responses.$201>
    /**
     * libraryDelete
     */
    'delete'(
      parameters?: Parameters<Paths.LibraryDelete.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.LibraryDelete.Responses.$201>
  }
  ['/api/library/q']: {
    /**
     * libraryQuery
     */
    'get'(
      parameters?: Parameters<Paths.LibraryQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.LibraryQuery.Responses.$200>
  }
  ['/api/quiz/']: {
    /**
     * quizCreate
     */
    'put'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizCreate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizCreate.Responses.$201>
  }
  ['/api/quiz/doLevel']: {
    /**
     * quizDoLevel
     */
    'patch'(
      parameters?: Parameters<Paths.QuizDoLevel.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizDoLevel.Responses.$201>
  }
  ['/api/quiz/delete/entries']: {
    /**
     * quizDeleteByEntries
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizDeleteByEntries.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizDeleteByEntries.Responses.$201>
  }
  ['/api/quiz/get/init']: {
    /**
     * quizGetInit
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizGetInit.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizGetInit.Responses.$200>
  }
  ['/api/quiz/get/entries']: {
    /**
     * quizGetByEntries
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizGetByEntries.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizGetByEntries.Responses.$200>
  }
  ['/api/quiz/get/srsLevelByEntries']: {
    /**
     * quizGetSrsLevelByEntries
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizGetSrsLevelByEntries.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizGetSrsLevelByEntries.Responses.$200>
  }
  ['/api/user/']: {
    /**
     * userSettings
     */
    'get'(
      parameters?: Parameters<Paths.UserSettings.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UserSettings.Responses.$200>
    /**
     * userUpdate
     */
    'patch'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.UserUpdate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UserUpdate.Responses.$201>
  }
  ['/api/util/tokenize']: {
    /**
     * utilTokenize
     */
    'get'(
      parameters?: Parameters<Paths.UtilTokenize.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UtilTokenize.Responses.$200>
  }
  ['/api/util/reading']: {
    /**
     * utilReading
     */
    'get'(
      parameters?: Parameters<Paths.UtilReading.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UtilReading.Responses.$200>
  }
  ['/api/util/speak']: {
    /**
     * utilSpeak
     */
    'get'(
      parameters?: Parameters<Paths.UtilSpeak.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/api/vocabulary/sentence']: {
    /**
     * characterSentence
     */
    'get'(
      parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterSentence.Responses.$200>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
