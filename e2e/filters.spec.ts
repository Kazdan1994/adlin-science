import { addDays, parisTodayYmd } from '@adlin/shared'
import { expect, test } from '@playwright/test'

test('narrow the room list by capacity and equipment, then clear the filters', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Date').fill(addDays(parisTodayYmd(new Date()), 1))
  await page.getByLabel('Start', { exact: true }).selectOption('14:00')
  await page.getByLabel('End', { exact: true }).selectOption('15:00')
  await page.getByRole('button', { name: 'Search' }).click()
  const bookButtons = page.getByRole('button', { name: /^Book / })
  await expect(bookButtons).toHaveCount(5)

  await page.getByLabel('Minimum seats').fill('10')
  await page.getByLabel('Minimum seats').blur()
  await expect(bookButtons).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Book Salle #1' })).toHaveCount(0)

  await page.getByRole('group', { name: 'Equipment' }).getByLabel('TV').check()
  await expect(bookButtons).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Book Salle nulle' })).toBeVisible()

  await page.getByLabel('Minimum seats').fill('30')
  await page.getByLabel('Minimum seats').blur()
  await expect(page.getByText('No room matches these filters. Try fewer filters or another time.')).toBeVisible()

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(bookButtons).toHaveCount(5)
})
