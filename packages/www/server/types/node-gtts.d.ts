declare module 'node-gtts' {
  function Text2Speech(
    lang: string,
    debug?: boolean
  ): {
    tokenize(text: string): string[]
    createServer(port: number): void
    stream(text: string): ReadableStream
    save(filepath: string, text: string, cb: () => void): void
  }

  export = Text2Speech
}
