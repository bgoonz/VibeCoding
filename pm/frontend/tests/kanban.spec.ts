import { expect, test, type Locator, type Page } from "@playwright/test";

async function login(page: Page, password = "password") {
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function addCard(page: Page, title: string) {
  const column = page.getByTestId("column-col-backlog");
  await column.getByRole("button", { name: /add a card/i }).click();
  await column.getByPlaceholder("Card title").fill(title);
  await column.getByPlaceholder("Details").fill("Added via browser.");
  await column.getByRole("button", { name: /^add card$/i }).click();
  await expect(column.getByText(title)).toBeVisible();
}

async function dragCard(page: Page, card: Locator, destination: Locator, offsetY?: number) {
  const source = await card.boundingBox();
  const target = await destination.boundingBox();
  if (!source || !target) throw new Error("Drag coordinates are unavailable.");
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + (offsetY ?? target.height / 2), { steps: 12 });
  await page.mouse.up();
}

test("requires sign-in and clears the session on sign-out", async ({ page }) => {
  await login(page, "wrong");
  await expect(page.locator("main").getByRole("alert")).toHaveText("Incorrect username or password.");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
  await page.reload();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(0);
});

test("persists manual card and column changes", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await login(page);
  const initialTitle = "Browser card " + Date.now();
  const editedTitle = initialTitle + " edited";
  await addCard(page, initialTitle);
  await page.getByRole("button", { name: "Edit " + initialTitle }).click();
  await page.getByLabel("Card title", { exact: true }).fill(editedTitle);
  await page.getByRole("textbox", { name: "Details", exact: true }).fill("Edited notes");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const drag = page.getByLabel("Drag " + editedTitle);
  await expect(drag).toBeVisible();
  const backlog = page.getByTestId("column-col-backlog");
  const backlogCards = backlog.locator('[data-testid^="card-"]');
  await dragCard(page, drag, backlogCards.first());
  await expect(backlogCards.first()).toContainText(editedTitle);
  await page.reload();
  await expect(backlogCards.first()).toContainText(editedTitle);

  const review = page.getByTestId("column-col-review");
  await dragCard(page, drag, review, 150);
  await expect(review.getByText(editedTitle)).toBeVisible();

  const columnTitle = review.getByLabel("Column title");
  const previousTitle = await columnTitle.inputValue();
  await columnTitle.fill("Ready for review");
  await columnTitle.press("Enter");
  await expect(columnTitle).toHaveValue("Ready for review");
  await expect(columnTitle).toBeEnabled();
  await page.reload();
  await expect(review.getByText(editedTitle)).toBeVisible();
  await expect(review.getByText("Edited notes")).toBeVisible();
  await expect(columnTitle).toHaveValue("Ready for review");
  await columnTitle.fill(previousTitle);
  await columnTitle.press("Enter");
  await expect(columnTitle).toBeEnabled();
  await review.getByRole("button", { name: "Delete " + editedTitle }).click();
  await expect(review.getByText(editedTitle)).toHaveCount(0);
  await page.reload();
  await expect(review.getByLabel("Column title")).toHaveValue(previousTitle);
  await expect(review.getByText(editedTitle)).toHaveCount(0);
});

test("reloads the board after a stale save", async ({ page }) => {
  await login(page);
  const column = page.getByTestId("column-col-backlog");
  const input = column.getByLabel("Column title");
  const originalTitle = await input.inputValue();
  const snapshot = await (await page.request.get("/api/board")).json();
  snapshot.board.columns[0].title = "Newer title";
  const response = await page.request.put("/api/board", { data: snapshot });
  expect(response.ok()).toBeTruthy();
  const latest = await response.json();
  try {
    await input.fill("Stale title");
    await input.press("Enter");
    await expect(page.locator("main").getByRole("alert")).toContainText("The board changed");
    await expect(input).toHaveValue("Newer title");
  } finally {
    latest.board.columns[0].title = originalTitle;
    expect((await page.request.put("/api/board", { data: latest })).ok()).toBeTruthy();
  }
});

test("renders assistant updates, sends history, and keeps failed drafts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await login(page);
  const title = "Assistant card " + Date.now();
  let calls = 0;
  await page.route("**/api/chat", async (route) => {
    const payload = route.request().postDataJSON();
    calls += 1;
    if (calls === 1) {
      expect(payload.history).toEqual([]);
      const snapshot = await (await page.request.get("/api/board")).json();
      snapshot.board.cards["assistant-e2e"] = { id: "assistant-e2e", title, details: "" };
      snapshot.board.columns[0].cardIds.push("assistant-e2e");
      const saved = await page.request.put("/api/board", { data: snapshot });
      expect(saved.ok()).toBeTruthy();
      await route.fulfill({ json: { reply: "Added the card.", snapshot: await saved.json() } });
    } else {
      expect(payload.history).toEqual([
        { role: "user", content: "Add a card" },
        { role: "assistant", content: "Added the card." },
      ]);
      await route.fulfill({ status: 502, json: { detail: "Provider unavailable." } });
    }
  });
  const draft = page.getByRole("textbox", { name: "Message" });
  const send = page.getByRole("button", { name: "Send" });
  await draft.fill("Add a card");
  await send.click();
  await expect(page.getByRole("log")).toContainText("Added the card.");
  const card = page.getByTestId("card-assistant-e2e");
  await expect(card).toContainText(title);
  await draft.fill("Follow up");
  await send.click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Provider unavailable.");
  await expect(draft).toHaveValue("Follow up");
  await page.reload();
  await expect(card).toContainText(title);
  await card.getByRole("button", { name: "Delete " + title }).click();
  await expect(card).toHaveCount(0);
});
