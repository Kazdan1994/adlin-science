import { defaultSlot } from '@adlin/shared'
import { expect, test } from '@playwright/test'

// Auckland is 11-12 hours from Paris, so any leak of the device time zone shows up in the pre-filled slot.
test.use({ timezoneId: 'Pacific/Auckland' })

test('shows Paris times whatever the device time zone is', async ({ page }) => {
  const slotBefore = defaultSlot(new Date())
  await page.goto('/')
  const slotAfter = defaultSlot(new Date())

  await expect(page.getByText('Times shown in Paris time (CET/CEST)')).toBeVisible()
  const start = await page.getByLabel('Start', { exact: true }).inputValue()
  expect([slotBefore.startTime, slotAfter.startTime]).toContain(start)
})
