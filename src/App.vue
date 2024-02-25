<script setup lang="ts">
import { onMounted } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { usePositionsStore } from './stores/positions';
import PositionInfo from './components/PositionInfo.vue'

const repoUrl = __REPO_URL__

const pStore = usePositionsStore();

function selectTab(idx: number) {
  pStore.activeId = pStore.items[idx].id
}

onMounted(() => {
  if (pStore.items.length === 0) {
    pStore.create()
    pStore.activeId = pStore.items[0].id
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-300 flex w-full flex-col items-center">
    <div class="w-full max-w-md px-2 py-6 sm:px-0">
      <TabGroup :selectedIndex="pStore.activeIndex" @change="selectTab">
        <TabList class="flex flex-wrap gap-1 rounded-xl bg-blue-900/20 p-1 mb-5">
          <Tab
            v-for="item in pStore.items"
            :key="item.id"
            as="template"
            v-slot="{ selected }"
          >
            <button
              class="min-w-16 rounded-lg py-2.5 px-3 text-sm font-medium leading-5 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
              :class="[
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'bg-blue-900/15 text-blue-100 hover:bg-blue-900/30 hover:text-white',
              ]"
            >
              {{ item.name || '??' }}
            </button>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel
            v-for="item in pStore.items"
            :key="item.id"
            class="rounded-xl bg-white p-4 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
          >
            <PositionInfo :positionId="item.id" />
          </TabPanel>
        </TabPanels>
      </TabGroup>
      <div v-if="repoUrl" class="py-1 text-xs text-center text-gray-400">
        <a :href="repoUrl" target="_blank" class="underline">Github</a>
      </div>
    </div>
    <notifications
      position="top center"
      :duration="700"
      :speed="200"
      :max="2"
      :ignoreDuplicates="true"
    />
  </div>
</template>
