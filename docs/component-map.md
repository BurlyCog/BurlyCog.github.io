# Component Map

## Goal

Map the portfolio system into a React hierarchy that matches the current Next.js App Router structure while keeping data, layout, and interaction concerns separate.

## Route Tree

```text
app/
  layout.tsx
  page.tsx
  [section]/
    page.tsx
    loading.tsx
    error.tsx
  components/
    shell/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      CommandPalette.tsx
    section/
      SectionViewport.tsx
      HorizontalCardRail.tsx
      RailEdgeFade.tsx
    card/
      PortfolioCard.tsx
      CardMedia.tsx
      CardHeader.tsx
      CardTags.tsx
      CardBody.tsx
      CardAudio.tsx
      CardMetadata.tsx
      CardExitHint.tsx
    cursor/
      CursorLayer.tsx
    providers/
      InteractionProvider.tsx
      ThemeProvider.tsx
  lib/
    queries.ts
    supabase.ts
    commands.ts
    routes.ts
    card-state.ts
  types/
    data.ts
    interaction.ts
```

## Top-Level Hierarchy

```text
RootLayout
  AppShell
    Sidebar
    ShellMain
      Topbar
      SectionViewport
        HorizontalCardRail
          PortfolioCard*
    CommandPalette
    CursorLayer
```

## Server vs Client Split

### Server Components

- `app/layout.tsx`
  Owns the HTML shell and global providers.
- `app/page.tsx`
  Redirects to the first available section.
- `app/[section]/page.tsx`
  Fetches section record and ordered cards for the slug.
- `Sidebar`
  Can stay server-rendered if it only reads sections and current route state.

### Client Components

- `AppShell`
  Holds shell-level UI state wiring.
- `Topbar`
  Theme toggle, quick actions, command trigger.
- `HorizontalCardRail`
  Owns wheel-to-horizontal mapping and rail pointer behavior.
- `PortfolioCard`
  Owns expansion, focus styling, and activation.
- `CardAudio`
  Per-card playback.
- `CommandPalette`
  Cmd/Ctrl+K interaction and command execution.
- `CursorLayer`
  Context-aware cursor feedback.
- `InteractionProvider`
  Shared interaction state for rail, focus, palette, and cursor mode.

## Responsibilities By Component

### `AppShell`

- Receives section data and card data from route pages.
- Composes sidebar, topbar, viewport, palette, and cursor layers.
- Passes the active section slug into navigation surfaces.

### `Sidebar`

- Renders ordered sections from Supabase.
- Highlights current section.
- Uses lightweight hover-driven vertical scrolling.
- Displays easter egg progress state.

### `Topbar`

- Hosts theme toggle.
- Exposes future controls like search/filter indicators.
- Shows command cursor motif without owning command logic.

### `SectionViewport`

- Defines the viewport bounds for rail interactions.
- Handles empty/loading/error display for section content.
- Wraps the horizontal card rail and edge fades.

### `HorizontalCardRail`

- Renders cards in DB order.
- Converts mouse wheel to horizontal scroll while rail is free.
- Suspends horizontal wheel handling while a card is in captured mode.
- Exposes scroll position for edge fade affordances.

### `PortfolioCard`

- Default state: compact portrait card with thumbnail and minimal text.
- Active state: expands width, becomes scrollable vertically, and reveals full content.
- Emits focus enter/exit events into the interaction store.
- Owns click activation, hover emphasis, and exit hint visibility.

### `CardMedia`

- Renders lazy-loaded thumbnail.
- Maintains crop rules and object-fit behavior.
- Can later extend to image expansion/lightbox without bloating `PortfolioCard`.

### `CardAudio`

- Renders play/pause trigger only when `audio_url` exists.
- Keeps playback local to the card.
- Reports playback state for cursor and command integrations later.

### `CardMetadata`

- Houses links, timestamps, tags, and future references block.
- Keeps extended content out of the compact card shell.

### `CommandPalette`

- Global overlay opened by `Cmd+K` or `Ctrl+K`.
- Reads sections and command definitions.
- MVP commands:
  - go to section
  - close palette
  - toggle theme
- Future commands:
  - filter by tag
  - focus card
  - trigger easter eggs

### `CursorLayer`

- Reads current interaction mode.
- Changes cursor affordance for hover, rail scroll, captured card, and palette states.
- Must remain subtle and never block pointer events.

### `InteractionProvider`

- Central source of truth for:
  - active card id
  - pointer mode
  - command palette open state
  - theme mode
  - easter egg progress

## Data Flow

```text
Supabase
  -> route page server fetch
  -> AppShell props
  -> Sidebar / SectionViewport / CommandPalette
  -> PortfolioCard children
```

### Query Shapes

- `getSections()`
  Returns ordered sections for sidebar and command palette.
- `getSectionBySlug(slug)`
  Returns the active section metadata.
- `getCardsBySectionSlug(slug)`
  Returns ordered cards for the active rail.

## Suggested Type Split

### `types/data.ts`

- `Section`
- `Card`
- `CardTag`
- `CardLink`

### `types/interaction.ts`

- `PointerMode = "free" | "captured"`
- `CardVisualState = "idle" | "hovered" | "focused"`
- `PaletteState = "closed" | "open"`
- `CursorState = "default" | "interactive" | "scroll-x" | "scroll-y" | "command"`

## MVP Build Order

1. Stabilize data types and server queries.
2. Fix layout shell and render sidebar plus section viewport.
3. Render horizontal card rail from fetched section data.
4. Add focused-card expansion and internal vertical scroll.
5. Add command palette with section navigation.
6. Layer in custom cursor states and easter egg hooks.
