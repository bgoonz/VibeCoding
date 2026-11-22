import { expect, test } from "@playwright/test";

test("loads five columns and dummy cards", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Project flow" })).toBeVisible();
  for (const name of ["Backlog", "Ready", "In Progress", "Review", "Done"]) {
    await expect(page.getByRole("textbox", { name: `Rename ${name}` })).toBeVisible();
  }
  await expect(page.getByText("Refresh onboarding email copy")).toBeVisible();
  await expect(page.getByText("Color tokens")).toBeVisible();
});

test("renames a column", async ({ page }) => {
  await page.goto("/");

  const input = page.getByTestId("column-title-backlog");
  await input.fill("Icebox");

  await expect(input).toHaveValue("Icebox");
});

test("adds and deletes a card", async ({ page }) => {
  await page.goto("/");

  const column = page.getByTestId("column-backlog");
  await column.getByRole("button", { name: "Add card" }).click();
  await column.getByLabel("Title").fill("Ship the launch note");
  await column.getByLabel("Details").fill("Write the short release note for Friday.");
  await column.getByRole("button", { name: "Add" }).click();

  await expect(column.getByText("Ship the launch note")).toBeVisible();
  await column.getByRole("button", { name: "Delete Ship the launch note", exact: true }).click();
  await expect(column.getByText("Ship the launch note")).toHaveCount(0);
});

test("drags a card into another column", async ({ page }) => {
  await page.goto("/");

  const card = page.getByTestId("card-onboarding");
  const review = page.getByTestId("column-review");
  const cardBox = await card.boundingBox();
  const columnBox = await review.boundingBox();
  if (!cardBox || !columnBox) throw new Error("Could not measure the drag targets");

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 24);
  await page.mouse.down();
  await page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + 160, { steps: 25 });
  await page.mouse.up();

  await expect(review.getByText("Refresh onboarding email copy")).toBeVisible();
  await expect(page.getByTestId("column-backlog").getByText("Refresh onboarding email copy")).toHaveCount(0);
});

test("discards changes on reload", async ({ page }) => {
  await page.goto("/");
  const backlog = page.getByTestId("column-backlog");
  const title = backlog.getByTestId("column-title-backlog");
  await title.fill("Icebox");
  await backlog.getByRole("button", { name: "Delete Refresh onboarding email copy" }).click();
  await expect(backlog.getByTestId("card-onboarding")).toHaveCount(0);
  await page.reload();
  await expect(title).toHaveValue("Backlog");
  await expect(backlog.getByTestId("card-onboarding")).toBeVisible();
});

test("validates and cancels a new card", async ({ page }) => {
  await page.goto("/");
  const backlog = page.getByTestId("column-backlog");
  await backlog.getByRole("button", { name: "Add card" }).click();
  await backlog.getByLabel("Title").fill("Draft");
  await expect(backlog.getByRole("button", { name: "Add", exact: true })).toBeDisabled();
  await backlog.getByRole("button", { name: "Cancel" }).click();
  await backlog.getByRole("button", { name: "Add card" }).click();
  await expect(backlog.getByLabel("Title")).toHaveValue("");
});

test("keeps the board reachable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Project flow" })).toBeInViewport();
  const done = page.getByTestId("column-title-done");
  await done.scrollIntoViewIfNeeded();
  await done.fill("Shipped");
  await expect(done).toHaveValue("Shipped");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
