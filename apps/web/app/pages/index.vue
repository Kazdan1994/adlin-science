<script setup lang="ts">
import { type Room, toUtcInstant } from '@adlin/shared'

const { criteria, status, rooms, error, search, setFilters, refresh } = useAvailability()
const { equipment, maxCapacity, roomCount } = useRooms()
const { booking, error: bookingError, isSubmitting, submit, reset } = useBooking()
const selectedRoom = ref<Room | null>(null)
const conflictRoom = ref<Room | null>(null)
const conflictBanner = useTemplateRef<{ focus: () => void }>('conflictBanner')
const confirmation = useTemplateRef<{ focus: () => void }>('confirmation')
const roomList = useTemplateRef<{ focus: () => void }>('roomList')
const filterPanel = useTemplateRef<{ clear: () => void }>('filterPanel')
const searchForm = useTemplateRef<{ focusDate: () => void }>('searchForm')
const filtersActive = computed(() => criteria.value.minCapacity !== undefined || criteria.value.equipment.length > 0)

watch(criteria, () => {
  conflictRoom.value = null
})

function openDialog(room: Room): void {
  reset()
  conflictRoom.value = null
  selectedRoom.value = room
}

async function bookAnother(): Promise<void> {
  reset()
  await nextTick()
  roomList.value?.focus()
}

async function clearFilters(): Promise<void> {
  filterPanel.value?.clear()
  await nextTick()
  roomList.value?.focus()
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
  <div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-5">
    <aside aria-label="Search" class="search-plate bg-plate p-5 text-plate-ink sm:p-7 lg:sticky lg:top-20 lg:col-span-4">
      <SearchForm ref="searchForm" :criteria="criteria" @search="search" />
      <FilterPanel
        ref="filterPanel"
        :filters="criteria"
        :equipment-options="equipment"
        :max-capacity="maxCapacity"
        class="mt-8"
        @update="setFilters"
      />
    </aside>
    <div class="grid grid-cols-1 gap-4 lg:col-span-8 lg:gap-5">
      <ErrorBanner v-if="conflictRoom" ref="conflictBanner" code="SLOT_TAKEN" :room-name="conflictRoom.name" />
      <BookingConfirmation v-if="booking" ref="confirmation" :booking="booking" @another="bookAnother" />
      <RoomList
        ref="roomList"
        :status="status"
        :rooms="rooms"
        :error="error"
        :filtered="filtersActive"
        :time-slot="criteria"
        :min-capacity="criteria.minCapacity"
        :max-capacity="maxCapacity"
        :room-count="roomCount"
        @book="openDialog"
        @retry="refresh"
        @clear="clearFilters"
        @change-time="searchForm?.focusDate()"
      />
    </div>
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
