
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project Context

This project is a **tennis match scoreboard** (placar de partidas de tênis). It tracks scores, sets, games, and points according to standard tennis rules.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## PrimeNG

This project uses PrimeNG v20 with the `@primeuix/themes` Aura preset and `primeicons`.

### Setup (already configured)
- `providePrimeNG` and `provideAnimationsAsync` are registered in `app.config.ts`
- Theme preset: **Aura** (from `@primeuix/themes/aura`)
- Dark mode is toggled by adding the `.dark` class to an ancestor element
- Primeicons CSS is imported globally in `styles.scss`

### Using Components
- Import PrimeNG components directly into the `imports` array of standalone components — no module needed
- Each component lives in its own entry point, e.g. `import { ButtonModule } from 'primeng/button'`
- Prefer importing the specific module (e.g. `ButtonModule`) over barrel imports

```typescript
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  imports: [ButtonModule, TableModule],
  template: `<p-button label="Save" />`
})
```

### Theming
- Use CSS variables exposed by PrimeNG (`--p-primary-color`, `--p-surface-100`, etc.) for custom styles
- Override the theme via `providePrimeNG({ theme: { preset: Aura, options: { ... } } })` in `app.config.ts`
- Do NOT import PrimeNG legacy CSS files (`primeng/resources/...`) — they are not used in v20+

### Icons
- Use primeicons via the `pi` CSS class: `<i class="pi pi-check"></i>` or the `icon` property on components
- Full icon list: https://primeng.org/icons

