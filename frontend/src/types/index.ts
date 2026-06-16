export interface BrailleChar {
  char: string
  dots: number[]  // 1-6 active dots
  unicode: string
}

export type LearnMode = 'charToBraille' | 'brailleToChar' | 'dictation'

export type CardCategory = 'letters' | 'numbers' | 'words'
export type CardLevel = 1 | 2 | 3 | 4 | 5

export interface PracticeCard {
  id: string
  content: string
  category: CardCategory
  level: CardLevel
  hint?: string
}

export interface CardExportOptions {
  categories: CardCategory[]
  levels: CardLevel[]
  cardsPerPage: number
  includeBraille: boolean
  includeHint: boolean
  cardSize: 'small' | 'medium' | 'large'
  shuffle: boolean
  count: number
}
