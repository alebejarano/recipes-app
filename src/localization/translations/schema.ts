import { en } from './en'

type WidenTranslationLeaves<T> = T extends string
    ? string
    : T extends readonly unknown[]
      ? T
      : {
            [K in keyof T]: WidenTranslationLeaves<T[K]>
        }

export type TranslationSchema = WidenTranslationLeaves<typeof en>
