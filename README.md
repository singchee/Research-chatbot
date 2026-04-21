# NH Research Assistant Chatbot

Clinical research assistant chatbot for Northern Health (Epping, VIC), built with Vite + React + TypeScript.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS (via `@tailwindcss/vite`)
- Anthropic Messages API streaming (`claude-sonnet-4-20250514`)
- `react-markdown` for assistant response rendering
- `xlsx` (SheetJS) for Step 4 spreadsheet artefact generation

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Environment

Create a `.env` file (or configure your deployment environment):

```bash
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

## App structure

```
src/
├── App.tsx
├── main.tsx
├── api/
│   └── anthropic.ts
├── components/
│   ├── ChatThread.tsx
│   ├── DocumentCard.tsx
│   ├── InputBar.tsx
│   ├── MessageBubble.tsx
│   ├── Step4ConfirmationModal.tsx
│   ├── StepBanner.tsx
│   ├── StepSidebar.tsx
│   └── SummaryPanel.tsx
├── constants/
│   └── systemPrompt.ts
├── hooks/
│   └── useResearchSession.ts
└── types/
    └── index.ts
```
