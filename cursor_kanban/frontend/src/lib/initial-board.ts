import type { Board } from "./board";

export function createInitialBoard(): Board {
  return {
    columns: [
      {
        id: "backlog",
        title: "Backlog",
        cards: [
          {
            id: "onboarding",
            title: "Refresh onboarding email copy",
            details: "Rewrite the welcome sequence so new users know where to start.",
          },
          {
            id: "billing",
            title: "Audit billing edge cases",
            details: "List failed invoice states and how support should respond.",
          },
        ],
      },
      {
        id: "ready",
        title: "Ready",
        cards: [
          {
            id: "empty-states",
            title: "Design empty states",
            details: "Sketch the first-run board so a new project never looks broken.",
          },
          {
            id: "digest",
            title: "Spec notification digest",
            details: "Decide what ships in the Monday morning summary.",
          },
        ],
      },
      {
        id: "progress",
        title: "In Progress",
        cards: [
          {
            id: "drag-polish",
            title: "Kanban drag polish",
            details: "Tighten the drop target and the card shadow while moving.",
          },
          {
            id: "error-copy",
            title: "API error copy",
            details: "Replace generic failures with one clear next step.",
          },
        ],
      },
      {
        id: "review",
        title: "Review",
        cards: [
          {
            id: "a11y",
            title: "Accessibility pass",
            details: "Check keyboard order, contrast, and button names.",
          },
        ],
      },
      {
        id: "done",
        title: "Done",
        cards: [
          {
            id: "tokens",
            title: "Color tokens",
            details: "Lock the navy, blue, purple, and yellow palette.",
          },
          {
            id: "scaffold",
            title: "Project scaffold",
            details: "Stand up the app with dummy board data already in place.",
          },
        ],
      },
    ],
  };
}
