import { expect, test } from '@playwright/test';

test('inspect nodes, schemas, inferred connections, and validation without graph editing', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Valid graph' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await expect(page.locator('.react-flow__edge')).toHaveCount(3);
  await expect(page.getByLabel('Node inspector')).toContainText(
    '$["pricing"]["priceCents"]',
  );
  await page.getByRole('tab', { name: 'Input', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('quantity');
  await page.getByText('Full JSON Schema', { exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('"required"');
  await page
    .getByRole('button', {
      name: 'Inspect connection: priceCents',
      exact: true,
    })
    .click();
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'Product price → Calculate total',
  );
  await expect(page.getByLabel('Connection inspector')).toContainText(
    '$["pricing"]["priceCents"]',
  );
  await page.getByRole('button', { name: 'Valid graph' }).click();
  await expect(page.getByLabel('Validation inspector')).toContainText(
    '4 fields resolved',
  );
  const node = page.locator('.react-flow__node').first();
  await expect(node).toBeVisible();
  const before = await node.evaluate((element) => element.style.transform);
  const box = await node.boundingBox();
  if (!box) throw new Error('Expected a visible node.');
  await page.mouse.move(box.x + 30, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 110, box.y + 100, { steps: 8 });
  await page.mouse.up();
  expect(await node.evaluate((element) => element.style.transform)).toBe(
    before,
  );
  await node.focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await expect(page.locator('.react-flow__edge')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('narrow viewer keeps graph navigation and readable inspector without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Order checkout', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fit graph to view', exact: true })
    .click();
  await page.getByRole('tab', { name: 'Output', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('totalCents');
  await page.getByLabel('Inspect', { exact: true }).selectOption('node:order');
  await expect(page.getByLabel('Node inspector')).toContainText(
    'Order request',
  );
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('connection:connection-2');
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'Consumed from this connection',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('example gallery covers branching, images, and invalid contracts through the package API', async ({
  page,
}) => {
  await page.goto('/?example=document-review');
  await expect(page.getByRole('button', { name: 'Valid graph' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
  await page
    .getByRole('navigation', { name: 'Examples' })
    .getByRole('link', { name: 'Image delivery' })
    .click();
  await expect(page.getByRole('button', { name: 'Valid graph' })).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: 'Screenshot of the Quzzar System Designer checkout example',
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Inspect connection: asset', exact: true })
    .nth(1)
    .click();
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'Uploaded image → Delivery manifest',
  );
  await page
    .getByRole('navigation', { name: 'Examples' })
    .getByRole('link', { name: 'Invalid contract' })
    .click();
  await page.getByRole('button', { name: 'Validation issues' }).click();
  await expect(page.getByLabel('Validation inspector')).toContainText(
    'ambiguous-input',
  );
  await expect(page.getByLabel('Validation inspector')).toContainText(
    'missing-input',
  );
});

test('built package mounts by DOM ID and element, unmounts, and preserves host styles', async ({
  page,
}) => {
  await page.goto('/tests/embedding.html');
  await page.getByRole('button', { name: 'Mount by ID', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Embedded graph', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Unmount', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Embedded graph', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Mount by element', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Embedded graph', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Mount by ID', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Embedded graph', exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Missing target', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('No element exists');
  expect(
    await page
      .locator('body')
      .evaluate((body) => getComputedStyle(body).backgroundColor),
  ).toBe('rgb(255, 255, 255)');
});
