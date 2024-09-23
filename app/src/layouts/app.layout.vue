<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <loading-page v-if="$store.global.status == 'loading'" />
      <router-view v-else />
    </q-page-container>

    <q-footer class="bg-grey-2 text-primary">
      <q-separator />
      <q-tabs v-model="tab" align="justify">
        <q-route-tab name="activities" icon="category" to="/activities" />
        <q-route-tab name="settings" icon="settings" to="/settings" disable />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
defineOptions({ name: 'AppLayout' });

import { ref, onBeforeMount } from 'vue';
import { useStore } from 'stores/store';

import LoadingPage from 'src/pages/loading.page.vue';

const tab = ref('menu');
const $store = useStore();

onBeforeMount(async () => {
    await $store.fetch();
});
</script>
