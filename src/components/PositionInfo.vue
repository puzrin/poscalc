<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { usePositionsStore } from '@/stores/positions';
import { useClipboard } from '@vueuse/core'
import { useTextareaAutosize } from '@vueuse/core'
import { useNotification } from "@kyvg/vue3-notification";

import ButtonSquare from '@/components/ButtonSquare.vue'

import IconDelete from '@heroicons/vue/24/outline/XMarkIcon'
import IconAdd from '@heroicons/vue/24/outline/PlusIcon'
import IconCopy from '@heroicons/vue/24/outline/ClipboardIcon'

const props = defineProps<{ positionId: number }>()

const pStore = usePositionsStore()
const position = pStore.byId(props.positionId)

const { notify } = useNotification()

const clipboardSrc = ref('')
const { copy: cbCopy, isSupported: isCbSupported } = useClipboard({ source: clipboardSrc })

function name2pair(name: string) {
  if (name.includes(':')) name = name.split(':')[0]
  return `${name.toUpperCase()}/USDT`
}

function toClipboard() {
  let result =
`${name2pair(position.name)}

Amount: ${info.value.base}
Leverage: ${Math.trunc(info.value.leverage)}x cross

Entry: ${info.value.market}
SL: ${info.value.stop}
`
  if (isPosNum(position.take)) {
    result += `TP: ${info.value.take}\n`
  }

  clipboardSrc.value = result
  cbCopy()
  notify({ type: 'success', text: 'Copied to clipboard' })
}

const { textarea: notes } = useTextareaAutosize({ watch: () => position.notes })

function addTab() {
  const newId = pStore.create()
  // Prefill risk & base
  const newItem = pStore.byId(newId)
  newItem.risk = position.risk
  newItem.base = position.base
  // Wait for render & activate (in next tick)
  nextTick(() => { pStore.activeId = newId })
}

function isNum(value: string) { return /^[+-]?\d+([.]\d*)?$/.test(value) }
function isPosNum(value: string) { return isNum(value) && parseFloat(value) > 0 }

function isPercentage(value: string) {
  return value && value.endsWith('%') && isNum(value.slice(0, -1))
}

function round(val: number, precision = 4) {
  if (val > Math.pow(10, precision - 1)) return parseFloat(val.toFixed(0))
  return parseFloat(val.toPrecision(precision))
}

const errMarket = computed(() => {
  if (!isPosNum(position.market)) return 'Market price should be a positive number'
  return ''
})

const errStop = computed(() => {
  if (!isPosNum(position.stop)) return 'Stop price should be a positive number'
  if (isPosNum(position.market) && parseFloat(position.stop) === parseFloat(position.market)) {
    return 'Stop price should differ from market'
  }
  return ''
})

const errTake = computed(() => {
  if (!position.take) return ''
  if (!isPosNum(position.take)) return 'Take price should be a positive number, if filled'
  if (isPosNum(position.market) && parseFloat(position.take) === parseFloat(position.market)) {
    return 'Take price should differ from market'
  }
  if (isPosNum(position.market) && isPosNum(position.stop) && isPosNum(position.take)) {
    const market = parseFloat(position.market)
    const stop = parseFloat(position.stop)
    const take = parseFloat(position.take)
    if ((stop > market && take > market) || (stop < market && take < market)) {
      return 'Stop and take should be on different sides of market price'
    }
  }
  return ''
})

const errRisk = computed(() => {
  if (!isPosNum(position.risk)) return 'Risk amount should be a positive number'
  return ''
})

const errBase = computed(() => {
  if (!position.base) return ''
  if (!isPosNum(position.base)) return 'Position base size should be a positive number, if filled'
  return ''
})

const errAll = computed(() => {
  if (errMarket.value) return errMarket.value
  if (errStop.value) return errStop.value
  if (errTake.value) return errTake.value
  if (errRisk.value) return errRisk.value
  if (errBase.value) return errBase.value
  return ''
})

const info = computed(() => {
  const market = parseFloat(position.market) || 0
  const stop = parseFloat(position.stop) || 0
  const take = parseFloat(position.take) || 0
  const risk = parseFloat(position.risk) || 0
  const base = parseFloat(position.base) || risk // fallback to risk amount if not set
  const rr = (take - market) / (market - stop)
  const orderCoins = risk / Math.abs(market - stop)
  const orderSize = orderCoins * market
  const leverage = orderSize / base

  return {
    market,
    stop,
    take,
    risk,
    base,
    rr,
    orderCoins,
    orderSize,
    leverage
  }
})

onMounted(() => {
  watch(() => position.stop, () => {
    if (isPercentage(position.stop) && isNum(position.market)) {
      const nMarket = parseFloat(position.market)
      const nStopPct = parseFloat(position.stop.slice(0, -1))
      const stop = nMarket * (1 + nStopPct / 100)
      position.stop = round(stop).toString()
    }
  })

  watch(() => position.take, () => {
    if (isPercentage(position.take) && isNum(position.market)) {
      const nMarket = parseFloat(position.market)
      const nTakePct = parseFloat(position.take.slice(0, -1))
      const take = nMarket * (1 + nTakePct / 100)
      position.take = round(take).toString()
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-3">
      <div class="w-full">
        <input
          v-model.trim="position.name"
          class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
          placeholder="Coin name"
        />
      </div>
      <ButtonSquare @click="pStore.removeById(position.id)" :disabled="pStore.items.length <= 1">
        <IconDelete class="w-6 h-6"/>
      </ButtonSquare>
      <ButtonSquare @click="addTab">
        <IconAdd class="w-6 h-6" />
      </ButtonSquare>
      <ButtonSquare v-if="isCbSupported" @click="toClipboard" :disabled="!!errAll">
        <IconCopy class="w-6 h-6" />
      </ButtonSquare>
    </div>

    <div>
      <div class="text-xs leading-5 text-gray-900">Market price</div>
      <input
        v-model.trim="position.market"
        class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
      />
      <div v-if="position.market && errMarket" class="text-xs leading-5 text-red-500">{{errMarket}}</div>
    </div>

    <div>
      <div class="text-xs leading-5 text-gray-900">Stop</div>
      <input
        v-model.trim="position.stop"
        class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
      />
      <div v-if="position.stop && errStop" class="text-xs leading-5 text-red-500">{{errStop}}</div>
    </div>

    <div>
      <div class="text-xs leading-5 text-gray-900">Take</div>
      <input
        v-model.trim="position.take"
        class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
      />
      <div v-if="position.take && errTake" class="text-xs leading-5 text-red-500">{{errTake}}</div>
    </div>

    <div>
      <div class="text-xs leading-5 text-gray-900">Risk amount</div>
      <input
        v-model.trim="position.risk"
        class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
      />
      <div v-if="position.risk && errRisk" class="text-xs leading-5 text-red-500">{{errRisk}}</div>
    </div>

    <div>
      <div class="text-xs leading-5 text-gray-900">Position base size</div>
      <input
        v-model.trim="position.base"
        class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
      />
      <div v-if="position.base && errBase" class="text-xs leading-5 text-red-500">{{errBase}}</div>
    </div>

    <div class="rounded-lg bg-amber-100 border border-amber-300 p-3 mt-3">
      <div v-if="errAll">{{errAll}}</div>
      <div v-else>
        <p>
          <span class="font-bold text-md">
            {{ info.stop < info.market ? 'long' : 'short '}} {{ round(info.orderSize).toLocaleString() }}
          </span>
          <span class="ml-1">
            ({{ info.base }} @ {{ parseFloat(info.leverage.toFixed(1)).toLocaleString() }}x / {{ round(info.orderCoins).toLocaleString() }} coins)
          </span>
        </p>
        <p v-if="isPosNum(position.take)" class="mt-2 text-sm text-gray-600">
            RR: <span class="font-bold">{{ round(info.rr, 3).toLocaleString() }}</span> ⟹
            win = {{ round(info.rr * info.risk).toLocaleString() }} / loss = {{ info.risk.toLocaleString() }}
        </p>
      </div>
    </div>

    <div>
      <div class="text-xs leading-5 text-gray-900">Notes</div>
      <textarea
        ref="notes"
        v-model.trim="position.notes"
        class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
      />
      <div v-if="position.market && errMarket" class="text-xs leading-5 text-red-500">{{errMarket}}</div>
    </div>

</div>
</template>