<template>
  <div class="min-h-screen p-4 flex flex-col gap-4 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-purple-400">盲文翻译与触觉学习器</h1>

    <div class="flex gap-2 flex-wrap">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="px-4 py-2 rounded text-sm"
        :class="activeTab === t.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Translate -->
    <div v-if="activeTab === 'translate'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">文本输入</h3>
        <textarea v-model="store.inputText" @input="store.translate()"
          class="w-full h-32 bg-gray-800 rounded p-3 text-white resize-none" placeholder="输入英文文本..." />
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">盲文输出</h3>
        <div class="text-4xl tracking-wider text-purple-300 h-16">{{ store.brailleUnicode }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <BrailleCell v-for="(dots, i) in store.brailleOutput" :key="i" :dots="dots" :size="40" />
        </div>
      </div>
    </div>

    <!-- Learn -->
    <div v-if="activeTab === 'learn'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold">猜盲文</h3>
        <div v-if="!store.quizChar">
          <button @click="store.generateQuiz()" class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <div class="text-7xl font-bold text-purple-400">{{ store.quizChar }}</div>
          <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all"
              :class="store.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
              <span class="text-xs">{{ d }}</span>
            </button>
          </div>
          <button @click="store.checkQuizAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">确认</button>
        </div>
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex justify-between mb-2">
          <h3 class="text-purple-300 font-bold">统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-xs hover:underline">重置</button>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
            <div class="text-xs text-gray-400">正确</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
            <div class="text-xs text-gray-400">错误</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-purple-400">{{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%</div>
            <div class="text-xs text-gray-400">正确率</div>
          </div>
        </div>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <div v-for="(h, i) in store.history.slice(0, 20)" :key="i"
            class="flex justify-between bg-gray-800 rounded p-2 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span>{{ h.input }}</span><span>{{ h.correct ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="activeTab === 'ref'" class="bg-gray-900 rounded-xl p-4">
      <h3 class="text-purple-300 font-bold mb-3">盲文速查表</h3>
      <div class="grid grid-cols-6 md:grid-cols-9 gap-3">
        <div v-for="(dots, char) in brailleMap" :key="char" class="flex flex-col items-center">
          <div class="text-xl font-bold text-purple-400">{{ char }}</div>
          <BrailleCell :dots="dots" :size="30" />
          <div class="text-xs text-gray-500">{{ dots.join(',') }}</div>
        </div>
      </div>
    </div>

    <!-- Practice Card Generator -->
    <div v-if="activeTab === 'cards'" class="flex flex-col gap-4">
      <div class="config-panel bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-4">练习卡生成器配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2">卡片分类</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="c in categories" :key="c.value" class="flex items-center gap-1 bg-gray-800 px-3 py-2 rounded cursor-pointer">
                <input type="checkbox" :value="c.value" v-model="store.cardOptions.categories" class="accent-purple-500">
                <span class="text-sm">{{ c.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">难度级别 (1最简单 ~ 5最难)</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="lvl in levels" :key="lvl" class="flex items-center gap-1 bg-gray-800 px-3 py-2 rounded cursor-pointer">
                <input type="checkbox" :value="lvl" v-model="store.cardOptions.levels" class="accent-purple-500">
                <span class="text-sm">{{ lvl }}级</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">卡片数量: {{ store.cardOptions.count }}</label>
            <input type="range" min="5" max="100" step="5" v-model.number="store.cardOptions.count" class="w-full accent-purple-500">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">卡片尺寸</label>
            <select v-model="store.cardOptions.cardSize" class="w-full bg-gray-800 rounded px-3 py-2 text-white">
              <option value="small">小号 (4列/行)</option>
              <option value="medium">中号 (3列/行)</option>
              <option value="large">大号 (2列/行)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">每页卡片数: {{ store.cardOptions.cardsPerPage }}</label>
            <input type="range" min="2" max="20" step="1" v-model.number="store.cardOptions.cardsPerPage" class="w-full accent-purple-500">
          </div>
          <div class="flex flex-col justify-end gap-2">
            <label class="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded cursor-pointer">
              <input type="checkbox" v-model="store.cardOptions.includeBraille" class="accent-purple-500">
              <span class="text-sm">显示盲文</span>
            </label>
            <label class="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded cursor-pointer">
              <input type="checkbox" v-model="store.cardOptions.includeHint" class="accent-purple-500">
              <span class="text-sm">显示提示标签</span>
            </label>
            <label class="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded cursor-pointer">
              <input type="checkbox" v-model="store.cardOptions.shuffle" class="accent-purple-500">
              <span class="text-sm">随机打乱顺序</span>
            </label>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button @click="store.generatePracticeCards()" class="bg-purple-600 px-6 py-2 rounded hover:bg-purple-500 text-white font-medium">
            生成练习卡
          </button>
          <button @click="store.clearPracticeCards()" class="bg-gray-700 px-6 py-2 rounded hover:bg-gray-600 text-gray-300">
            清空
          </button>
          <button v-if="store.practiceCards.length" @click="doPrint()" class="bg-blue-600 px-6 py-2 rounded hover:bg-blue-500 text-white font-medium">
            打印预览
          </button>
          <button v-if="store.practiceCards.length" @click="doExportCards()" class="bg-green-700 px-6 py-2 rounded hover:bg-green-600 text-white font-medium">
            导出文本
          </button>
        </div>
      </div>

      <div v-if="store.practiceCards.length" class="preview-container bg-gray-900 rounded-xl p-4">
        <div class="preview-header flex justify-between items-center mb-4">
          <h3 class="text-purple-300 font-bold">预览 - 共 {{ store.practiceCards.length }} 张卡片</h3>
          <div class="text-sm text-gray-400">
            字母: {{ countByCategory('letters') }} | 
            数字: {{ countByCategory('numbers') }} | 
            词组: {{ countByCategory('words') }}
          </div>
        </div>
        <div id="cards-preview"
          :class="[
            'grid gap-4',
            store.cardOptions.cardSize === 'small' ? 'grid-cols-2 md:grid-cols-4' :
            store.cardOptions.cardSize === 'medium' ? 'grid-cols-2 md:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2'
          ]">
          <div v-for="card in store.practiceCards" :key="card.id"
            class="card-item bg-white rounded-lg p-4 border-2 border-gray-200 flex flex-col items-center gap-2"
            :class="cardSizeClass">
            <div v-if="store.cardOptions.includeHint"
              class="text-xs px-2 py-1 rounded-full"
              :class="categoryColorClass(card.category)">
              {{ categoryLabel(card.category) }} · {{ card.level }}级
            </div>
            <div class="text-3xl md:text-4xl font-bold text-gray-800 print:text-gray-900 tracking-wide">
              {{ card.content }}
            </div>
            <div v-if="store.cardOptions.includeBraille" class="flex flex-wrap justify-center gap-1 mt-1">
              <BrailleCell v-for="(dots, i) in store.contentToBrailleArr(card.content)" :key="i"
                :dots="dots"
                :size="brailleCellSize" />
            </div>
            <div v-if="store.cardOptions.includeBraille" class="text-xl tracking-widest text-gray-600 print:text-gray-700 font-mono">
              {{ store.contentToBrailleUnicode(card.content) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <button v-if="activeTab !== 'cards'" @click="doExport" class="bg-green-700 px-4 py-2 rounded self-start hover:bg-green-600 text-sm">
      导出翻译文本
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBrailleStore } from './store/braille'
import { BRAILLE_MAP } from './utils/braille'
import BrailleCell from './components/BrailleCell.vue'
import type { CardCategory, CardLevel } from './types'

const store = useBrailleStore()
const brailleMap = BRAILLE_MAP
const tabs = [
  { id: 'translate', label: '翻译模式' },
  { id: 'learn', label: '训练模式' },
  { id: 'ref', label: '速查表' },
  { id: 'cards', label: '练习卡生成器' },
]
const activeTab = ref('translate')

const categories = [
  { value: 'letters' as CardCategory, label: '字母' },
  { value: 'numbers' as CardCategory, label: '数字' },
  { value: 'words' as CardCategory, label: '词组' },
]
const levels: CardLevel[] = [1, 2, 3, 4, 5]

const cardSizeClass = computed(() => {
  switch (store.cardOptions.cardSize) {
    case 'small': return 'min-h-[140px] print:min-h-[160px]'
    case 'large': return 'min-h-[260px] print:min-h-[300px]'
    default: return 'min-h-[200px] print:min-h-[220px]'
  }
})

const brailleCellSize = computed(() => {
  switch (store.cardOptions.cardSize) {
    case 'small': return 22
    case 'large': return 40
    default: return 30
  }
})

function categoryLabel(cat: CardCategory): string {
  return categories.find(c => c.value === cat)?.label || cat
}

function categoryColorClass(cat: CardCategory): string {
  switch (cat) {
    case 'letters': return 'bg-purple-100 text-purple-700 print:bg-purple-100 print:text-purple-800'
    case 'numbers': return 'bg-blue-100 text-blue-700 print:bg-blue-100 print:text-blue-800'
    case 'words': return 'bg-green-100 text-green-700 print:bg-green-100 print:text-green-800'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function countByCategory(cat: CardCategory): number {
  return store.practiceCards.filter(c => c.category === cat).length
}

function doExport() {
  const text = store.exportPDF()
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'braille-output.txt'
  a.click()
}

function doExportCards() {
  const text = store.exportCardsText()
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `practice-cards-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
}

function doPrint() {
  window.print()
}
</script>
