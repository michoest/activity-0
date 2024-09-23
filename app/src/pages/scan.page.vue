<template>
  <q-page class="flex flex-center">
    <div class="column items-center">
      <div>
        <q-icon :name="typeIcons[scanType]" size="104px" class="q-pa-lg" color="primary" />
      </div>
      <div>
        <h4>{{ statusMessage }}</h4>
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'ActivitiesPage' });

import { ref, computed, inject, onMounted } from 'vue';
import { useStore } from 'src/stores/store';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);
dayjs.extend(relativeTime);

const $store = useStore();
const $notify = inject('notify');
const $route = useRoute();
const $router = useRouter();

const activityId = ref($route.params.id);
const scanType = ref($route.query.type || 'browser');

const typeIcons = {
  nfc: 'nfc',
  qr: 'qr_code',
  app: 'app',
  browser: 'tab'
};

const activity = computed(() => {
  return $store.activities.find(activity => activity.id == activityId.value);
});

const statusMessage = ref('');

onMounted(async () => {
  const startTime = Date.now();
  const minWaitTime = 2000;

  const isRunning = activity.value.occurrences.length > 0 && !activity.value.occurrences[activity.value.occurrences.length - 1].end;
  statusMessage.value = `${isRunning ? 'Stopping' : 'Starting'} ${activity.value.title}...`;

  await Promise.all([
    $store.scan(activityId.value, scanType.value),
    new Promise(resolve => setTimeout(resolve, minWaitTime))
  ]);

  const elapsedTime = Date.now() - startTime;
  if (elapsedTime < minWaitTime) {
    await new Promise(resolve => setTimeout(resolve, minWaitTime - elapsedTime));
  }

  $notify(`${activity.value.title} ${isRunning ? 'stopped' : 'started'}!`, { actions: [{ label: 'Undo', color: 'white', handler: () => { $store.unscan(activity.value.id); } }] });
  $router.push('/activities');
});
</script>
