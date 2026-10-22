<script setup lang="ts">
import { type Room, toUtcInstant } from '@adlin/shared'

const { criteria, status, rooms, error, search, setFilters, refresh } = useAvailability()
const { equipment, maxCapacity } = useRooms()
const { booking, error: bookingError, submit, reset } = useBooking()
const selectedRoom = ref<Room | null>(null)
const filtersActive = computed(() => criteria.value.minCapacity !== undefined || criteria.value.equipment.length > 0)

function openDialog(room: Room): void {
  reset()
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
    await refresh()
  }
}
</script>

<template>
  <div class="space-y-6">
    <BookingConfirmation v-if="booking" :booking="booking" @another="reset" />
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
      @confirm="confirm"
      @close="selectedRoom = null"
    />
  </div>
</template>
