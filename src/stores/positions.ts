import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { type Position } from '../types'

export const usePositionsStore = defineStore('positions', () => {
  const activeId = ref(0)
  const items = ref([] as Position[]);

  const activeIndex = computed(() => {
    const idx = items.value.findIndex((p) => p.id === activeId.value)
    return idx >= 0 ? idx : 0
  })

  function create() {
    const newId = items.value.length > 0 ? Math.max(...items.value.map((p) => p.id)) + 1 : 1
    items.value.push({
      id: newId,
      name: '',
      market: '',
      stop: '',
      take: '',
      risk: '',
      base: '',
      notes: ''
    })
    return newId
  }

  function byId(id: number) {
    return items.value.find((p) => p.id === id) || items.value[0]
  }

  function removeById(id: number) {
    const idx = items.value.findIndex((p) => p.id === id)
    if (idx >= 0) {
      items.value.splice(idx, 1)
      const idxToActivate = Math.max(idx-1, 0)
      activeId.value = idxToActivate <= items.value.length ? items.value[idxToActivate].id : 0
    }
  }

  return { items, activeId, activeIndex, create, byId, removeById }
}, { persist: true })
