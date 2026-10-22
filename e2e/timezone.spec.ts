import { defaultSlot, parisTimeOf } from '@adlin/shared'
import { expect, test } from '@playwright/test'

// Auckland is 11-12 hours from Paris, so any leak of the device time zone shows up in the pre-filled slot.
test.use({ timezoneId: 'Pacific/Auckland' })

test('shows Paris times whatever the device time zone is', async ({ page }) => {
  const before = new Date()
  await page.goto('/')
  const after = new Date()
  const slotBefore = defaultSlot(before)
  const slotAfter = defaultSlot(after)

  await expect(page.getByText('Every time is Paris time.')).toBeVisible()
  const clock = await page.getByRole('banner').locator('time').innerText()
  expect([parisTimeOf(before), parisTimeOf(after)]).toContain(clock)
  const start = await page.getByLabel('Start', { exact: true }).inputValue()
  expect([slotBefore.startTime, slotAfter.startTime]).toContain(start)
})
