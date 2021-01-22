declare module 'chinese-to-pinyin' {
  function pinyin(str: string, options?: pinyin.PinyinOptions): string

  namespace pinyin {
    interface PinyinOptions {
      /**
       * 获取中文首字母
       */
      firstCharacter?: boolean;
      /**
       * 略去声调
       */
      removeTone?: boolean;
      /**
       * 声调转数字
       */
      toneToNumber?: boolean;
      /**
       * 声调转数字,只输出音调
       */
      toneToNumberOnly?: boolean;
      /**
       * 保留未翻译的非中文字符
       */
      keepRest?: boolean;
    }
  }

  export = pinyin
}
