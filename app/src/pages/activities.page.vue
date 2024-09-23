<template>
  <q-page>
    <q-list class="q-py-md">
      <q-expansion-item v-for="activity in activities" :key="activity.id" class="q-my-md" hide-expand-icon>
        <template v-slot:header>
          <q-item-section side>
          <q-icon v-if="activity.tags.includes('Sik')" name="music_note" />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-negative': isRunning(activity), 'text-bold': isRunning(activity) }">
            {{ activity.title }}
            <q-badge v-if="isRunning(activity)" color="negative" rounded class="q-ml-sm" />
          </q-item-label>
          <q-item-label v-if="isRunning(activity)" caption class="text-negative">
            <span v-if="time" class="q-mr-md" style="white-space: nowrap;"><q-icon name="alarm" /> since {{
              time.format('MM:ss') }}</span>
          </q-item-label>
          <q-item-label v-else caption>
            <span class="q-mr-md" style="white-space: nowrap;"><q-icon name="summarize" /> {{
              activity.occurrences.length }}</span>
            <span v-if="activity.scans.length > 0" class="q-mr-md" style="white-space: nowrap;"><q-icon name="schedule" /> {{
              dayjs(activity.scans[activity.scans.length - 1].date).fromNow() }}
            </span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn v-if="isRunning(activity)" flat round dense icon="stop" color="primary" @click.stop="onClickStop(activity)"></q-btn>
          <q-btn v-else flat round dense icon="play_arrow" color="primary" @click.stop="onClickStart(activity)"></q-btn>
        </q-item-section>
        </template>

        <q-list>
          <q-item>
            <q-item-section side>
              <q-icon name="" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                <q-icon name="fingerprint" /> {{ activity.id }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn @click="onClickScanNFC(activity)">Scan NFC</q-btn>
              <q-btn class="q-mt-md" @click="onClickScanQR(activity)">Scan QR</q-btn>
            </q-item-section>
          </q-item>
          <!-- <q-item v-for="occurrence in activity.occurrences" :key="occurrence.start" :inset-level="1">
            <q-item-section>
              {{ dayjs(occurrence.start).fromNow() }} ({{ occurrence.end ? dayjs.duration(dayjs(occurrence.end).diff(occurrence.start)).humanize() : 'started' }})
            </q-item-section>
          </q-item> -->
        </q-list>

        <q-separator inset />
      </q-expansion-item>
    </q-list>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'ActivitiesPage' });

import { ref, computed, inject, onBeforeMount, onUnmounted } from 'vue';
import { useStore } from 'src/stores/store';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(duration);
dayjs.extend(relativeTime);

const $store = useStore();
const $notify = inject('notify');
const $router = useRouter();

const timer = ref(null);
const time = ref(null);

const activities = computed(() => {
  return $store.activities || [];
});

const runningActivity = computed(() => {
  return activities.value.find(activity => isRunning(activity));
});

const onClickStart = async (activity) => {
  await $store.scan(activity.id, 'app');
  $notify(`${activity.title} started!`, { actions: [{ label: 'Undo', color: 'white', handler: () => { $store.unscan(activity.id); } }] });

  updateTime();
  timer.value = setInterval(updateTime, 1000);
};

const onClickStop = async (activity) => {
  await $store.scan(activity.id, 'app');
  $notify(`${activity.title} stopped!`, { actions: [{ label: 'Undo', color: 'white', handler: () => { $store.unscan(activity.id); } }] });

  clearInterval(timer.value);
};

const isRunning = (activity) => {
  return activity.occurrences.length > 0 && !activity.occurrences[activity.occurrences.length - 1].end;
};

const onClickScanNFC = (activity) => {
  $router.push({ path: `/scan/${activity.id}`, query: { type: 'nfc' } });
};

const onClickScanQR = (activity) => {
  $router.push({ path: `/scan/${activity.id}`, query: { type: 'qr' } });
};

const updateTime = () => {
  time.value = dayjs.duration(dayjs().diff(runningActivity.value.occurrences[runningActivity.value.occurrences.length - 1].start));
};

onBeforeMount(() => {
  if (runningActivity.value) {
    updateTime();
    timer.value = setInterval(updateTime, 1000);
  }
});

onUnmounted(() => {
  clearInterval(timer.value);
});
</script>
