<script setup lang="ts">
import { type Room, toUtcInstant } from '@adlin/shared'

const { criteria, status, rooms, error, search, setFilters, refresh } = useAvailability()
const { equipment, maxCapacity } = useRooms()
const { booking, error: bookingError, isSubmitting, submit, reset } = useBooking()
const selectedRoom = ref<Room | null>(null)
const conflictRoom = ref<Room | null>(null)
const conflictBanner = useTemplateRef<{ focus: () => void }>('conflictBanner')
const confirmation = useTemplateRef<{ focus: () => void }>('confirmation')
const filtersActive = computed(() => criteria.value.minCapacity !== undefined || criteria.value.equipment.length > 0)

// A conflict message only applies to the search it came from.
watch(criteria, () => {
  conflictRoom.value = null
})

function openDialog(room: Room): void {
  reset()
  conflictRoom.value = null
  selectedRoom.value = room
}

async function confirm(bookerName: string): Promise<void> {
  const room = selectedRoom.value
  if (!room) return
  const slot = {
    start: toUtcInstant(criteria.value.date, criteria.value.startTime),
    end: toUtcInstant(criteria.value.date, criteria.value.endTime),
  }
  await submit(room, slot, bookerName)
  if (booking.value) {
    selectedRoom.value = null
    await nextTick()
    confirmation.value?.focus()
    await refresh()
    return
  }
  if (bookingError.value?.code === 'SLOT_TAKEN') {
    selectedRoom.value = null
    conflictRoom.value = room
    await nextTick()
    conflictBanner.value?.focus()
    await refresh()
  }
}
</script>

<template>
  <div class="space-y-6">
    <ErrorBanner v-if="conflictRoom" ref="conflictBanner" code="SLOT_TAKEN" :room-name="conflictRoom.name" />
    <BookingConfirmation v-if="booking" ref="confirmation" :booking="booking" @another="reset" />
    <SearchForm :criteria="criteria" :busy="status === 'loading'" @search="search" />
    <FilterPanel :filters="criteria" :equipment-options="equipment" :max-capacity="maxCapacity" @update="setFilters" />
    <RoomList
      :status="status"
      :rooms="rooms"
      :error="error"
      :filtered="filtersActive"
      @book="openDialog"
      @retry="refresh"
    />
    <BookingDialog
      v-if="selectedRoom"
      :room="selectedRoom"
      :time-slot="criteria"
      :error="bookingError"
      :submitting="isSubmitting"
      @confirm="confirm"
      @close="selectedRoom = null"
    />
  </div>
</template>
