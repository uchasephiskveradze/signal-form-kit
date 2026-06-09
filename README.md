# Signal Form Showcase

A schema-driven form engine for **Angular 21** built on [Signal Forms](https://angular.dev/guide/forms/signals). Pass a JSON schema or a typed TypeScript config — get a fully validated form with nested groups, dynamic arrays, 24 field types, a visual builder, and typed outputs with zero boilerplate.

## Why this exists

Reactive Forms are powerful but verbose. Every enterprise app repeats the same patterns: define controls, wire validators, bind templates, handle errors. This library generates the entire form from metadata so you focus on the schema, not the plumbing.

## Features

- **JSON or TypeScript schemas** — same shape, two input modes (`public/schemas/onboarding.json` mirrors the typed demo)
- **24 field types** — text, email, number, textarea, url, tel, date, time, select, multiselect, checkbox, switch, radio, range, file, hidden, and more
- **Nested groups** — `{ type: 'group', fields: [...] }` for object-shaped model sections (e.g. address)
- **Dynamic arrays** — `{ type: 'array', itemFields: [...], minItems, maxItems }` with add/remove UI
- **Visual form builder** — `<sf-form-builder>` palette, inspector, live preview, JSON export
- **Typed outputs** — `defineFormSchema<T>()` checks top-level field keys against your model interface
- **Signal Forms native** — `[formField]` bindings, `hidden()` for conditional fields
- **Built-in validators** — required, email, min/max, minLength/maxLength, pattern
- **Conditional fields** — `hideWhen` (JSON-serializable) or `hideIf` (TypeScript callback)
- **Live streams** — `(valueChange)` and `(validityChange)` for debugging and UI state

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The showcase has three tabs:

| Tab | What it demonstrates |
|-----|---------------------|
| **TypeScript Schema** | Full onboarding form from `onboarding.schema.ts` |
| **JSON File** | Same fields loaded at runtime from `public/schemas/onboarding.json` |
| **Visual Builder** | Drag-and-drop schema editor with live preview |

## Usage

### TypeScript schema (type-safe)

```typescript
import { defineFormSchema, JsonFormComponent } from './lib';

interface User {
  fullName: string;
  email: string;
  address: { street: string; city: string };
}

const schema = defineFormSchema<User>({
  title: 'Sign Up',
  submitLabel: 'Create Account',
  fields: [
    { key: 'fullName', label: 'Full Name', type: 'text', validation: { required: true } },
    { key: 'email', label: 'Email', type: 'email', validation: { required: true, email: true } },
    {
      key: 'address',
      label: 'Address',
      type: 'group',
      fields: [
        { key: 'street', label: 'Street', type: 'text', validation: { required: true } },
        { key: 'city', label: 'City', type: 'text', validation: { required: true } },
      ],
    },
  ],
});

@Component({
  imports: [JsonFormComponent],
  template: `
    <sf-json-form
      [schema]="schema"
      (formSubmit)="onSubmit($event)"
      (validityChange)="onValidChange($event)"
    />
  `,
})
export class SignUpComponent {
  schema = schema;

  onSubmit(value: User) {
    console.log(value); // fully typed, nested address included
  }

  onValidChange(status: { valid: boolean; invalid: boolean }) {
    // drive submit button, badges, etc.
  }
}
```

### JSON schema (runtime)

```typescript
import { createFormSchemaFromJson, JsonFormComponent } from './lib';

const schema = createFormSchemaFromJson<OnboardingForm>(
  await fetch('/schemas/onboarding.json').then((r) => r.json()),
);
```

Groups and arrays use the same JSON shape as TypeScript:

```json
{
  "key": "address",
  "type": "group",
  "fields": [{ "key": "street", "type": "text", "validation": { "required": true } }]
}
```

```json
{
  "key": "emergencyContacts",
  "type": "array",
  "minItems": 1,
  "itemFields": [{ "key": "name", "type": "text", "validation": { "required": true } }]
}
```

### Visual form builder

```html
<sf-form-builder
  [initialSchema]="mySchema"
  (schemaChange)="mySchema = $event"
/>
```

The builder provides a field-type palette, property inspector, reorder, and live `<sf-json-form>` preview. Export schema JSON to clipboard.

## Project structure

```
src/lib/                              # Reusable form engine
  types/form-schema.ts                # Schema types, 24 field types, FIELD_TYPE_CATALOG
  utils/schema-utils.ts               # Recursive model build, validators, visibility
  components/
    json-form.component.*             # Form root — schema in, typed events out
    field-renderer.component.*        # Recursive groups / arrays / leaves
    leaf-field.component.*            # Native control bindings ([formField])
    form-builder.component.*          # Visual schema editor

src/app/
  schemas/onboarding.schema.ts        # Full demo schema (groups + arrays)
  showcase/                           # Interactive demo app

public/schemas/onboarding.json        # JSON mirror of onboarding schema
```

## API

| Export | Description |
|--------|-------------|
| `JsonFormComponent` | `<sf-json-form>` — renders a form from schema |
| `FormBuilderComponent` | `<sf-form-builder>` — visual schema editor |
| `FieldRendererComponent` | Recursive field tree renderer (used internally) |
| `defineFormSchema<T>()` | Type-safe schema builder with key checking |
| `createFormSchemaFromJson<T>()` | Parse JSON string or object |
| `createDefaultField()` | Factory for builder / programmatic schemas |
| `FIELD_TYPE_CATALOG` | Metadata for all 24 supported field types |
| `buildInitialModel()` | Build default model from schema (groups + arrays) |
| `shouldHideField()` | Evaluate conditional visibility |

### `JsonFormComponent` inputs / outputs

| Name | Type | Description |
|------|------|-------------|
| `[schema]` | `FormSchema<T>` | Required. Field definitions and metadata |
| `[submittingLabel]` | `string` | Button label while submitting (default: `"Submitting..."`) |
| `(formSubmit)` | `T` | Emits typed value after valid submit |
| `(valueChange)` | `T` | Emits on every model change |
| `(validityChange)` | `FormValidity` | Emits `{ valid, invalid }` when form status changes |

### Field types

**Inputs:** `text`, `email`, `password`, `number`, `textarea`, `url`, `tel`, `search`, `color`, `date`, `datetime-local`, `time`, `month`, `week`, `range`, `file`, `hidden`

**Choices:** `select`, `multiselect`, `checkbox`, `switch`, `radio`

**Structure:** `group`, `array`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest, 26 specs) |

## Tech stack

- Angular 21 (standalone components, signals)
- Signal Forms (`@angular/forms/signals`)
- Vitest + jsdom
- SCSS

## License

MIT
