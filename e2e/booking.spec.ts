import { addDays, defaultSlot, parisTodayYmd, toUtcInstant } from '@adlin/shared'
import { expect, test } from '@playwright/test'

test('book a room, then the same search no longer lists it', async ({ page }) => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  page.on('pageerror', (error) => problems.push(error.message))

  const slotBefore = defaultSlot(new Date())
  await page.goto('/')
  const slotAfter = defaultSlot(new Date())

  // US1 scenario 7: the next 15-minute Paris slot is pre-filled and rooms are already listed.
  const start = await page.getByLabel('Start', { exact: true }).inputValue()
  expect([slotBefore.startTime, slotAfter.startTime]).toContain(start)
  await expect(page.getByRole('button', { name: /^Book / }).first()).toBeVisible()

  const tomorrow = addDays(parisTodayYmd(new Date()), 1)
  await page.getByLabel('Date').fill(tomorrow)
  await page.getByLabel('Start', { exact: true }).selectOption('10:00')
  await page.getByLabel('End', { exact: true }).selectOption('11:00')
  await expect(page.getByRole('heading', { name: /10:00–11:00/ })).toBeVisible()

  await page.getByRole('button', { name: 'Book Salle #2' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Your name').fill('Alice Martin')
  await dialog.getByRole('button', { name: 'Confirm booking' }).click()

  const confirmation = page.getByRole('region', { name: 'Booking confirmed' })
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(toUtcInstant(tomorrow, '10:00')))
  await expect(confirmation).toContainText('Salle #2')
  await expect(confirmation).toContainText(day)
  await expect(confirmation).toContainText('10:00–11:00')
  await expect(confirmation).toContainText('Alice Martin')
  await expect(confirmation).toContainText("Bookings are final and can't be changed or cancelled.")

  await confirmation.getByRole('button', { name: 'Book another room' }).click()

  await expect(page.getByRole('button', { name: 'Book Salle #1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Book Salle #2' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Book / })).toHaveCount(4)

  // Console errors include Content-Security-Policy violations, which would break the booted app.
  expect(problems).toEqual([])
})
