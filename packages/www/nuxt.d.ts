declare module 'nuxt' {
  import e from 'express'

  export class Nuxt {
    render: e.RequestHandler
  }

  export function loadNuxt(mode: string): Promise<Nuxt>
  export function build(nuxt: Nuxt): void
}
