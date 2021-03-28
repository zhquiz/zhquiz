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
          alt: string[];
          reading: string[];
          english: string[];
        }[];
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
  namespace LibraryCreate {
    export interface RequestBody {
      entry: string[];
      title: string;
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
        entry: string[];
        title: string;
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
          id?: string;
          entry: string[];
          title: string;
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
      entry?: string[];
      title?: string;
      type?: string;
      description?: string;
      tag?: string[];
    }
    namespace Responses {
      export interface $201 {
        result: string;
      }
    }
  }
  namespace QuizCreate {
    export interface RequestBody {
      entry: string[];
      type: "character" | "vocabulary" | "sentence";
    }
    namespace Responses {
      export interface $201 {
        result: {
          ids: string[];
          entry: string;
        }[];
      }
    }
  }
  namespace QuizDeleteMany {
    export interface RequestBody {
      id?: string[];
      entry?: string[];
      type?: "character" | "vocabulary" | "sentence";
    }
  }
  namespace QuizGetMany {
    export interface RequestBody {
      id?: string[];
      entry?: string[];
      type?: string;
      direction?: string;
      select: string[];
    }
    namespace Responses {
      export interface $200 {
        result: {
          id?: string;
          entry?: string;
          type?: string;
          direction?: string;
        }[];
      }
    }
  }
  namespace QuizGetSrsLevel {
    export interface RequestBody {
      id?: string[];
      entry?: string[];
      type?: "character" | "vocabulary" | "sentence";
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
    export interface RequestBody {
      q?: string;
      type: string[];
      stage: string[];
      direction: string[];
      includeUndue: boolean;
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
      export type DLevel = number;
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
      export type Limit = number;
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
      limit?: Parameters.Limit;
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
        identifier?: string;
        level?: number;
        levelMin?: number;
        quizSettings?: {
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
      quizSettings?: {
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
  namespace VocabularyQuery {
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
  namespace VocabularyRandom {
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
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
   * quizGetMany
   */
  'quizGetMany'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizGetMany.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizGetMany.Responses.$200>
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
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizInit.RequestBody,
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
   * quizCreate
   */
  'quizCreate'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizCreate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizCreate.Responses.$201>
  /**
   * quizGetSrsLevel
   */
  'quizGetSrsLevel'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizGetSrsLevel.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.QuizGetSrsLevel.Responses.$200>
  /**
   * quizDeleteMany
   */
  'quizDeleteMany'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.QuizDeleteMany.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
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
   * vocabularyQuery
   */
  'vocabularyQuery'(
    parameters?: Parameters<Paths.VocabularyQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularyQuery.Responses.$200>
  /**
   * vocabularyRandom
   */
  'vocabularyRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularyRandom.Responses.$200>
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
  ['/api/library/']: {
    /**
     * libraryGetOne
     */
    'get'(
      parameters?: Parameters<Paths.LibraryGetOne.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.LibraryGetOne.Responses.$200>
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
  ['/api/quiz/getMany']: {
    /**
     * quizGetMany
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizGetMany.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizGetMany.Responses.$200>
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
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizInit.RequestBody,
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
  ['/api/quiz/getSrsLevel']: {
    /**
     * quizGetSrsLevel
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizGetSrsLevel.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.QuizGetSrsLevel.Responses.$200>
  }
  ['/api/quiz/deleteMany']: {
    /**
     * quizDeleteMany
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.QuizDeleteMany.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
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
     * vocabularyQuery
     */
    'get'(
      parameters?: Parameters<Paths.VocabularyQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularyQuery.Responses.$200>
  }
  ['/api/vocabulary/random']: {
    /**
     * vocabularyRandom
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularyRandom.Responses.$200>
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
