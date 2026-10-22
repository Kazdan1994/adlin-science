export type RoomsStatus = 'loading' | 'ready' | 'error'

/** The room catalogue, loaded once, for building the filter controls. */
export function useRooms() {
  const api = useApi()
  const status = ref<RoomsStatus>('loading')
  const equipment = ref<string[]>([])
  const maxCapacity = ref(0)

  onMounted(async () => {
    try {
      const catalogue = await api.getRooms()
      equipment.value = catalogue.equipment
      maxCapacity.value = Math.max(0, ...catalogue.rooms.map((room) => room.capacity))
      status.value = 'ready'
    } catch {
      // The equipment filter stays empty; the search reports API problems on its own.
      status.value = 'error'
    }
  })

  return { status: shallowReadonly(status), equipment: shallowReadonly(equipment), maxCapacity: shallowReadonly(maxCapacity) }
}
