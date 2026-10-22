<script setup lang="ts">
defineProps<{ filtered: boolean }>()
</script>

<template>
  <div class="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
    <p class="font-medium">
      {{ filtered ? 'No room matches these filters. Try fewer filters or another time.' : 'No room is free for this time. Try another time.' }}
    </p>
  </div>
</template>
