import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, textToBraille, brailleToText, dotsToUnicode } from '../utils/braille'
import type { LearnMode, PracticeCard, CardCategory, CardLevel, CardExportOptions } from '../types'

const WORD_POOL: Record<CardLevel, string[]> = {
  1: ['cat', 'dog', 'sun', 'cup', 'hat', 'pen', 'box', 'red', 'big', 'hot', 'run', 'sit', 'top', 'fun', 'man', 'mom', 'dad', 'kid', 'bed', 'bus'],
  2: ['apple', 'happy', 'water', 'music', 'green', 'light', 'cloud', 'bread', 'chair', 'dance', 'earth', 'fairy', 'grape', 'house', 'juice', 'knife', 'lemon', 'money', 'night', 'ocean'],
  3: ['bridge', 'castle', 'dragon', 'flower', 'garden', 'island', 'jungle', 'kitten', 'laptop', 'market', 'nature', 'orange', 'planet', 'rabbit', 'silver', 'summer', 'tiger', 'winter', 'yellow', 'zebra'],
  4: ['amazing', 'balance', 'captain', 'diamond', 'elephant', 'freedom', 'general', 'history', 'imagine', 'journey', 'kingdom', 'library', 'mystery', 'natural', 'perfect', 'quality', 'rainbow', 'science', 'teacher', 'universe'],
  5: ['adventure', 'beautiful', 'challenge', 'dangerous', 'education', 'fantastic', 'government', 'happiness', 'important', 'knowledge', 'leadership', 'magnificent', 'newspaper', 'opportunity', 'photograph', 'restaurant', 'successful', 'technology', 'understand', 'vocabulary'],
}

export const useBrailleStore = defineStore('braille', () => {
  const inputText = ref('')
  const brailleOutput = ref<number[][]>([])
  const learnMode = ref<LearnMode>('charToBraille')
  const quizChar = ref('')
  const selectedDots = ref<number[]>([])
  const score = ref({ correct: 0, total: 0 })
  const history = ref<{ input: string; correct: boolean }[]>([])

  const practiceCards = ref<PracticeCard[]>([])
  const cardOptions = ref<CardExportOptions>({
    categories: ['letters', 'numbers', 'words'],
    levels: [1, 2, 3],
    cardsPerPage: 6,
    includeBraille: true,
    includeHint: true,
    cardSize: 'medium',
    shuffle: false,
    count: 20,
  })

  const brailleUnicode = computed(() =>
    brailleOutput.value.map(d => dotsToUnicode(d)).join('')
  )

  function translate() {
    brailleOutput.value = textToBraille(inputText.value)
  }

  function reverseTranslate() {
    // Simple: take selectedDots and find matching char
    return brailleToText(selectedDots.value)
  }

  function generateQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    selectedDots.value = []
  }

  function toggleDot(dot: number) {
    const idx = selectedDots.value.indexOf(dot)
    if (idx >= 0) selectedDots.value.splice(idx, 1)
    else selectedDots.value.push(dot)
  }

  function checkQuizAnswer() {
    const correct = JSON.stringify([...selectedDots.value].sort()) === JSON.stringify([...(BRAILLE_MAP[quizChar.value] || [])].sort())
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({ input: quizChar.value, correct })
    if (navigator.vibrate) navigator.vibrate(correct ? 100 : [100, 50, 100])
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function exportPDF(): string {
    const lines = inputText.value.toUpperCase().split('')
    let out = '盲文翻译输出\n\n'
    for (const ch of lines) {
      const dots = BRAILLE_MAP[ch] || []
      out += `${ch} → [${dots.join(',')}] ${dotsToUnicode(dots)}\n`
    }
    return out
  }

  function generateLetterCards(levels: CardLevel[], count: number): PracticeCard[] {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const cards: PracticeCard[] = []
    const levelsSet = new Set(levels)
    const level1Letters = 'AEIOU'
    const level2Letters = 'BCDFGHJKLMNPQRSTVWXYZ'

    for (let i = 0; i < count; i++) {
      let letter = ''
      let level: CardLevel = 1
      const rand = Math.random()

      if (levelsSet.has(1) && (levelsSet.size === 1 || rand < 0.33)) {
        letter = level1Letters[Math.floor(Math.random() * level1Letters.length)]
        level = 1
      } else if (levelsSet.has(2) && (levelsSet.size <= 2 || rand < 0.66)) {
        letter = level2Letters[Math.floor(Math.random() * level2Letters.length)]
        level = 2
      } else if (levelsSet.has(3)) {
        letter = alphabet[Math.floor(Math.random() * alphabet.length)]
        level = 3
      } else if (levelsSet.has(4)) {
        letter = alphabet[Math.floor(Math.random() * alphabet.length)]
        level = 4
      } else {
        letter = alphabet[Math.floor(Math.random() * alphabet.length)]
        level = 5
      }

      cards.push({
        id: `letter-${Date.now()}-${i}`,
        content: letter,
        category: 'letters',
        level,
        hint: `字母 ${letter}`,
      })
    }
    return cards
  }

  function generateNumberCards(levels: CardLevel[], count: number): PracticeCard[] {
    const cards: PracticeCard[] = []
    for (let i = 0; i < count; i++) {
      let num = ''
      let level: CardLevel = 1
      const rand = Math.random()

      if (levels.includes(1) && rand < 0.25) {
        num = String(Math.floor(Math.random() * 10))
        level = 1
      } else if (levels.includes(2) && rand < 0.5) {
        num = String(Math.floor(Math.random() * 90) + 10)
        level = 2
      } else if (levels.includes(3) && rand < 0.7) {
        num = String(Math.floor(Math.random() * 900) + 100)
        level = 3
      } else if (levels.includes(4) && rand < 0.85) {
        num = String(Math.floor(Math.random() * 9000) + 1000)
        level = 4
      } else if (levels.includes(5)) {
        num = String(Math.floor(Math.random() * 90000) + 10000)
        level = 5
      } else {
        const available = levels[0] || 1
        if (available === 1) num = String(Math.floor(Math.random() * 10))
        else if (available === 2) num = String(Math.floor(Math.random() * 90) + 10)
        else if (available === 3) num = String(Math.floor(Math.random() * 900) + 100)
        else if (available === 4) num = String(Math.floor(Math.random() * 9000) + 1000)
        else num = String(Math.floor(Math.random() * 90000) + 10000)
        level = available
      }

      cards.push({
        id: `number-${Date.now()}-${i}`,
        content: num,
        category: 'numbers',
        level,
        hint: `数字 ${num}`,
      })
    }
    return cards
  }

  function generateWordCards(levels: CardLevel[], count: number): PracticeCard[] {
    const cards: PracticeCard[] = []
    const availableLevels = levels.filter(l => WORD_POOL[l])

    for (let i = 0; i < count; i++) {
      const level = availableLevels[Math.floor(Math.random() * availableLevels.length)] || 1
      const pool = WORD_POOL[level]
      const word = pool[Math.floor(Math.random() * pool.length)]
      cards.push({
        id: `word-${Date.now()}-${i}`,
        content: word.toUpperCase(),
        category: 'words',
        level,
        hint: `词组（${level}级）`,
      })
    }
    return cards
  }

  function generatePracticeCards() {
    const opts = cardOptions.value
    const perCategory = Math.ceil(opts.count / Math.max(opts.categories.length, 1))
    let allCards: PracticeCard[] = []

    if (opts.categories.includes('letters')) {
      allCards = allCards.concat(generateLetterCards(opts.levels, perCategory))
    }
    if (opts.categories.includes('numbers')) {
      allCards = allCards.concat(generateNumberCards(opts.levels, perCategory))
    }
    if (opts.categories.includes('words')) {
      allCards = allCards.concat(generateWordCards(opts.levels, perCategory))
    }

    if (opts.shuffle) {
      allCards = allCards.sort(() => Math.random() - 0.5)
    }

    practiceCards.value = allCards.slice(0, opts.count)
    return practiceCards.value
  }

  function clearPracticeCards() {
    practiceCards.value = []
  }

  function exportCardsText(): string {
    let out = '盲文练习卡\n'
    out += `生成时间: ${new Date().toLocaleString()}\n`
    out += `卡片数量: ${practiceCards.value.length}\n\n`
    out += '='.repeat(60) + '\n\n'

    for (const card of practiceCards.value) {
      out += `【${card.category === 'letters' ? '字母' : card.category === 'numbers' ? '数字' : '词组'} · ${card.level}级】\n`
      out += `内容: ${card.content}\n`
      if (cardOptions.value.includeHint && card.hint) {
        out += `提示: ${card.hint}\n`
      }
      if (cardOptions.value.includeBraille) {
        const brailleArr = textToBraille(card.content)
        const brailleUnicodeStr = brailleArr.map(d => dotsToUnicode(d)).join('')
        out += `盲文: ${brailleUnicodeStr}\n`
      }
      out += '\n' + '-'.repeat(40) + '\n\n'
    }
    return out
  }

  function contentToBrailleArr(content: string): number[][] {
    return textToBraille(content)
  }

  function contentToBrailleUnicode(content: string): string {
    return textToBraille(content).map(d => dotsToUnicode(d)).join('')
  }

  return {
    inputText, brailleOutput, learnMode, quizChar, selectedDots, score, history,
    brailleUnicode, practiceCards, cardOptions,
    translate, reverseTranslate, generateQuiz, toggleDot,
    checkQuizAnswer, resetScore, exportPDF,
    generatePracticeCards, clearPracticeCards, exportCardsText,
    contentToBrailleArr, contentToBrailleUnicode,
  }
})
