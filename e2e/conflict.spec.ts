import { addDays, parisTodayYmd } from '@adlin/shared'
import { expect, type Page, test } from '@playwright/test'

// Day after tomorrow, so these bookings never touch the slots the other specs use.
const day = addDays(parisTodayYmd(new Date()), 2)

async function searchSlot(page: Page, start: string, end: string): Promise<void> {
  await page.goto('/')
  await page.getByLabel('Date').fill(day)
  await page.getByLabel('Start', { exact: true }).selectOption(start)
  await page.getByLabel('End', { exact: true }).selectOption(end)
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByRole('button', { name: /^Book / })).toHaveCount(5)
}

async function bookRoom(page: Page, room: string, bookerName: string): Promise<void> {
  await page.getByRole('button', { name: `Book ${room}` }).click()
  await page.getByRole('dialog').getByLabel('Your name').fill(bookerName)
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm booking' }).click()
}

test('recovers when the room is booked by someone else while the dialog is open', async ({ browser }) => {
  const pageA = await (await browser.newContext()).newPage()
  const pageB = await (await browser.newContext()).newPage()
  await searchSlot(pageA, '14:00', '15:00')
  await searchSlot(pageB, '14:00', '15:00')

  await bookRoom(pageA, 'Salle #1', 'Alice Martin')
  await expect(pageA.getByRole('region', { name: 'Booking confirmed' })).toBeVisible()

  await bookRoom(pageB, 'Salle #1', 'Bob Durand')

  const alert = pageB.getByRole('alert')
  await expect(alert).toContainText('Someone just booked Salle #1 for this time. Pick another room below.')
  await expect(alert).toBeFocused()
  await expect(pageB.getByRole('dialog')).toHaveCount(0)
  await expect(pageB.getByRole('button', { name: 'Book Salle #1' })).toHaveCount(0)
  await expect(pageB.getByRole('button', { name: /^Book / })).toHaveCount(4)
  await expect(pageB.getByLabel('Date')).toHaveValue(day)
  await expect(pageB.getByLabel('Start', { exact: true })).toHaveValue('14:00')
  await expect(pageB.getByLabel('End', { exact: true })).toHaveValue('15:00')
})

test('a double-click on Confirm booking sends one request and shows one confirmation', async ({ page }) => {
  const bookingRequests: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/bookings')) bookingRequests.push(request.url())
  })
  await searchSlot(page, '16:00', '17:00')

  await page.getByRole('button', { name: 'Book Salle #2' }).click()
  await page.getByRole('dialog').getByLabel('Your name').fill('Alice Martin')
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm booking' }).dblclick()

  await expect(page.getByRole('region', { name: 'Booking confirmed' })).toHaveCount(1)
  expect(bookingRequests).toHaveLength(1)
})
