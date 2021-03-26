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
   * sentenceGetByEntry
   */
  'sentenceGetByEntry'(
    parameters?: Parameters<Paths.SentenceGetByEntry.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceGetByEntry.Responses.$200>
  /**
   * sentenceRandom
   */
  'sentenceRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceRandom.Responses.$200>
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
