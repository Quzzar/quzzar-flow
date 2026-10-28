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
  await expect(page.getByRole('tabpanel')).toContainText('required');
  await expect(page.getByRole('tabpanel')).toContainText('At least 1');
  await expect(page.getByText('Full JSON Schema', { exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.react-flow__attribution')).toHaveCount(0);
  await expect(page.getByText('Contract graph', { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText('Read-only', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Select a node or connection to inspect', { exact: true }),
  ).toHaveCount(0);
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
  await page.getByRole('tab', { name: 'Output', exact: true }).click();
  const schemaPanel = page.getByRole('tabpanel');
  await expect(schemaPanel).toContainText('customer');
  await expect(schemaPanel).toContainText('optional');
  await expect(schemaPanel).toContainText('Max. 80 characters');
  await schemaPanel.getByText('tags', { exact: true }).click();
  await expect(schemaPanel).toContainText('Each item');
  await expect(schemaPanel).toContainText('"alpha" | "beta"');
  await expect(schemaPanel).not.toContainText('$schema');
  await page
    .getByRole('button', { name: 'Mount React header', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'React header', exact: true }),
  ).toBeVisible();
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

test('closing any inspector clears selection and expands the canvas', async ({
  page,
}) => {
  await page.goto('/');
  const canvas = page.getByLabel('Read-only system contract graph', {
    exact: true,
  });
  const before = await canvas.boundingBox();
  await page
    .getByRole('button', { name: 'Close inspector', exact: true })
    .click();
  await expect(page.getByLabel('Node inspector')).toHaveCount(0);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(0);
  expect((await canvas.boundingBox())?.width).toBeGreaterThan(
    before?.width ?? 0,
  );
  await page.getByRole('button', { name: 'Valid graph', exact: true }).click();
  await expect(page.getByLabel('Validation inspector')).toBeVisible();
  await page
    .getByRole('button', { name: 'Close inspector', exact: true })
    .click();
  await expect(page.getByLabel('Validation inspector')).toHaveCount(0);
  await page
    .getByRole('button', {
      name: 'Inspect connection: priceCents',
      exact: true,
    })
    .click();
  await expect(page.getByLabel('Connection inspector')).toBeVisible();
  await page
    .getByRole('button', { name: 'Close inspector', exact: true })
    .click();
  await expect(page.getByLabel('Connection inspector')).toHaveCount(0);
  await expect(page.locator('.react-flow__edge.selected')).toHaveCount(0);
});

test('large examples expose 48 suppliers, ambiguous mappings, and an explicit resolution', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?example=stress-test');
  await expect(
    page.getByRole('button', { name: 'Valid graph', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(53);
  await expect(page.locator('.react-flow__edge')).toHaveCount(52);
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('node:signal01');
  await expect(page.getByLabel('Node inspector')).toContainText('Signal 01');
  await expect(
    page.locator('.react-flow__node[data-id="signal01"]'),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Examples' })
    .getByRole('link', { name: 'Stress: ambiguous', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Validation issues', exact: true })
    .click();
  await expect(page.getByLabel('Validation inspector')).toContainText(
    'ambiguous-input',
  );
  await expect(page.getByLabel('Validation inspector')).toContainText(
    'Choose signal01',
  );
  await page
    .getByRole('navigation', { name: 'Examples' })
    .getByRole('link', { name: 'Stress: resolved', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Valid graph', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(54);
  await expect(page.getByLabel('Node inspector')).toContainText('explicit');
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('connection:connection-1');
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'explicit',
  );
  expect(errors).toEqual([]);
});

test('group containers enclose measured members and preserve cross-group inspection', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?example=grouped-system');
  await expect(
    page.getByRole('button', { name: 'Valid graph', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.react-flow__node-domainGroup')).toHaveCount(3);
  await expect(page.locator('.react-flow__node-operation')).toHaveCount(6);
  for (const [group, children] of Object.entries({
    frontend: ['checkout-form', 'confirmation-screen'],
    backend: ['calculate', 'response'],
    database: ['catalog', 'orders'],
  })) {
    await expect
      .poll(async () => {
        const parent = await page
          .locator(`.react-flow__node[data-id="${group}"]`)
          .boundingBox();
        if (!parent) return false;
        for (const id of children) {
          const child = await page
            .locator(`.react-flow__node[data-id="${id}"]`)
            .boundingBox();
          if (
            !child ||
            child.x < parent.x ||
            child.y < parent.y ||
            child.x + child.width > parent.x + parent.width + 1 ||
            child.y + child.height > parent.y + parent.height + 1
          )
            return false;
        }
        return true;
      })
      .toBe(true);
  }
  await page
    .getByRole('button', {
      name: 'Inspect connection: Unit price',
      exact: true,
    })
    .click({ timeout: 5000 });
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'Product catalog → Calculate total',
  );
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'priceCents',
  );
  expect(errors).toEqual([]);
});

test('full-stack example has nested sections, scoped inputs, and section navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?example=full-stack-app');
  await expect(
    page.getByRole('button', { name: 'Valid graph', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.react-flow__node-operation')).toHaveCount(12);
  await expect(page.locator('.react-flow__node-domainGroup')).toHaveCount(6);
  const inspector = page.getByLabel('Node inspector');
  await expect(inspector).toContainText('membership');
  await expect(inspector).toContainText('explicit');
  await expect
    .poll(async () => {
      const parent = await page
        .locator('.react-flow__node[data-id="backend"]')
        .boundingBox();
      const child = await page
        .locator('.react-flow__node[data-id="data-access"]')
        .boundingBox();
      return Boolean(
        parent &&
        child &&
        child.x > parent.x &&
        child.y > parent.y &&
        child.x + child.width < parent.x + parent.width &&
        child.y + child.height < parent.y + parent.height,
      );
    })
    .toBe(true);
  await expect
    .poll(async () => {
      const canvas = await page
        .getByLabel('Read-only system contract graph', { exact: true })
        .boundingBox();
      const label = await page
        .getByRole('button', {
          name: 'Inspect connection: Board collection',
          exact: true,
        })
        .boundingBox();
      return Boolean(canvas && label && label.y >= canvas.y);
    })
    .toBe(true);
  await page.screenshot({ path: '.impeccable/review/full-stack-app.png' });
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('group:backend');
  await expect(inspector).toHaveCount(0);
  await expect
    .poll(
      async () =>
        (
          await page
            .locator('.react-flow__node[data-id="backend"]')
            .boundingBox()
        )?.width ?? 0,
    )
    .toBeGreaterThan(500);
  await page.screenshot({ path: '.impeccable/review/full-stack-backend.png' });
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('connection:connection-3');
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'memberships → Authorize task creation',
  );
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'explicit',
  );
  await page.screenshot({ path: '.impeccable/review/full-stack-flow.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('node:authorize');
  await expect(page.getByLabel('Node inspector')).toContainText('membership');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: '.impeccable/review/full-stack-mobile.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('database connections display arbitrary labels without interpreting them', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?example=database-design');
  await expect(
    page.getByRole('button', { name: 'Valid graph', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.react-flow__edge')).toHaveCount(6);
  await expect(
    page.getByRole('option', {
      name: 'users → projects · M:M · membership',
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('option', {
      name: 'users → projects · 1:M · owns',
      exact: true,
    }),
  ).toHaveCount(1);
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('connection:connection-5');
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'users → projects',
  );
  await expect
    .poll(async () => {
      const canvas = await page
        .getByLabel('Read-only system contract graph', { exact: true })
        .boundingBox();
      const label = await page
        .getByRole('button', {
          name: 'Inspect connection: M:M · membership',
          exact: true,
        })
        .boundingBox();
      return Boolean(canvas && label && label.y >= canvas.y);
    })
    .toBe(true);
  await page.screenshot({ path: '.impeccable/review/database-design.png' });
  await page.getByRole('button', { name: 'Valid graph', exact: true }).click();
  await expect(page.getByLabel('Validation inspector')).toContainText(
    '6 connections checked',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('connection:connection-6');
  await expect(page.getByLabel('Connection inspector')).toContainText(
    'users → profiles',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: '.impeccable/review/database-mobile.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
