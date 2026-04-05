# Interaction State Machine

## Goal

Define a single behavior model for rail scrolling, card focus, pointer capture, and command palette control so the interface stays predictable.

## Core State Domains

### 1. Shell State

```text
shell = browsing | command
```

### 2. Rail State

```text
rail = free | suspended
```

### 3. Card State

```text
card = none | hovered(cardId) | focused(cardId)
```

### 4. Pointer Mode

```text
pointer = free | captured
```

## Canonical Combined States

### `Browsing.Free`

- Palette closed
- No focused card
- Pointer mode is `free`
- Wheel input maps to horizontal rail scroll

### `Browsing.Hovered`

- Palette closed
- Card hover affordance active
- Pointer still `free`
- Wheel input still maps to horizontal rail scroll

### `Browsing.Focused`

- Palette closed
- One card is focused
- Pointer mode becomes `captured`
- Focused card handles vertical scroll internally
- Rail is suspended

### `Command.Open`

- Palette open
- Global keyboard focus moves to command input
- Wheel and pointer card interactions are ignored
- Escape closes palette first before closing card focus

## Transition Table

| Current | Event | Next | Effect |
|---|---|---|---|
| `Browsing.Free` | `CARD_HOVER(cardId)` | `Browsing.Hovered` | set hovered card |
| `Browsing.Hovered` | `CARD_LEAVE` | `Browsing.Free` | clear hovered card |
| `Browsing.Free` | `CARD_CLICK(cardId)` | `Browsing.Focused` | focus card, expand width, capture pointer |
| `Browsing.Hovered` | `CARD_CLICK(cardId)` | `Browsing.Focused` | same as above |
| `Browsing.Focused` | `ESCAPE` | `Browsing.Free` | collapse card, release pointer |
| `Browsing.Focused` | `CARD_EXIT_BOUNDS` | `Browsing.Free` | collapse card, release pointer |
| `Browsing.Focused` | `CARD_CLOSE` | `Browsing.Free` | collapse card, release pointer |
| `Browsing.Free` | `OPEN_COMMAND` | `Command.Open` | open palette |
| `Browsing.Hovered` | `OPEN_COMMAND` | `Command.Open` | open palette, clear hover visuals |
| `Browsing.Focused` | `OPEN_COMMAND` | `Command.Open` | preserve focused card in background, suspend card interaction |
| `Command.Open` | `ESCAPE` | prior browsing state | close palette |
| `Command.Open` | `COMMAND_NAVIGATE(section)` | `Browsing.Free` | route change, close palette, clear focus |

## Event Rules

### Wheel / Trackpad

- If `shell = command`, ignore rail and card scrolling outside the palette.
- If `pointer = free`, map vertical wheel delta to horizontal rail movement.
- If `pointer = captured`, send wheel delta to the focused card scroll container.

### Pointer Down

- On unfocused card: activate focus.
- Inside focused card: keep pointer captured.
- Outside focused card: release focus unless interaction originated from palette.

### Keyboard

- `Cmd+K` or `Ctrl+K`
  Opens command palette from any browsing state.
- `Escape`
  Order of resolution:
  1. close palette if open
  2. close focused card if one exists
  3. no-op otherwise
- Arrow keys
  Reserved for future command navigation and card targeting.

## Scroll Ownership Rules

### Horizontal Rail Owns Scroll When

- no card is focused
- command palette is closed
- pointer mode is `free`

### Focused Card Owns Scroll When

- the card is focused
- pointer mode is `captured`
- the command palette is closed

### Command Palette Owns Focus When

- palette is open
- text input is active
- global shortcuts are routed through command handling

## UI Side Effects By State

### `Browsing.Free`

- standard cursor
- rail edge fade visible
- no focus border

### `Browsing.Hovered`

- interactive cursor
- hovered card gets slight emphasis
- no vertical scroll affordance yet

### `Browsing.Focused`

- focus border color shift
- expanded card width
- edge fade inside card to imply vertical bounds
- exit hint visible
- cursor indicates captured/scroll-y mode

### `Command.Open`

- overlay visible
- blinking block cursor active
- shell visually dimmed but still readable

## Store Shape

```ts
type InteractionState = {
  shellMode: "browsing" | "command";
  pointerMode: "free" | "captured";
  hoveredCardId: string | null;
  focusedCardId: string | null;
  activeSectionSlug: string | null;
  themeMode: "light" | "dark";
  easterEggsUnlocked: number;
};
```

## Reducer Events

```ts
type InteractionEvent =
  | { type: "CARD_HOVER"; cardId: string }
  | { type: "CARD_LEAVE" }
  | { type: "CARD_CLICK"; cardId: string }
  | { type: "CARD_CLOSE" }
  | { type: "CARD_EXIT_BOUNDS" }
  | { type: "OPEN_COMMAND" }
  | { type: "CLOSE_COMMAND" }
  | { type: "COMMAND_NAVIGATE"; sectionSlug: string }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "UNLOCK_EASTER_EGG" };
```

## MVP Constraints

- Only one focused card at a time.
- Focused card state must survive minor pointer movement inside the card.
- Command palette always takes precedence over card interactions.
- Route changes clear hover and focus state.
- No frontend sorting; card order always follows DB `order_index`.

## Recommended Implementation Notes

- Keep rail scroll state local to the rail component.
- Keep focus and pointer mode in a shared client store.
- Use explicit refs for the rail container and the focused card scroll container.
- Do not infer pointer capture from CSS alone; store it in state.
