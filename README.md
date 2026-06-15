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

### Install in your Angular app

```bash
npm install @signal-form-kit/core
```

**Peer dependencies** (Angular 21 — must be installed in your app):

```bash
npm install @angular/core@^21 @angular/common@^21 @angular/forms@^21
```

Register providers once in `app.config.ts`:

```typescript
import { provideSignalFormKit } from '@signal-form-kit/core';

export const appConfig = {
  providers: [provideSignalFormKit()],
};
```

Package: [npmjs.com/package/@signal-form-kit/core](https://www.npmjs.com/package/@signal-form-kit/core)

### Run the showcase demo (this repo)

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The showcase has three tabs:

| Tab | What it demonstrates |
|-----|---------------------|
| **TypeScript Schema** | Full onboarding form from `onboarding.schema.ts` |
| **JSON Schema** | Form + editable JSON source panel — edit schema, Apply, upload, or reset sample |
| **Visual Builder** | Drag-and-drop schema editor with live preview |

## Usage

### TypeScript schema (type-safe)

```typescript
import { defineFormSchema, JsonFormComponent } from '@signal-form-kit/core';

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
import { createFormSchemaFromJson, JsonFormComponent } from '@signal-form-kit/core';

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
projects/signal-form-kit/             # Publishable library (@signal-form-kit/core)
  src/
    types/form-schema.ts              # Schema types, built-in + custom field types
    registry/field-type-registry.ts   # FieldTypeRegistry + custom renderers
    utils/schema-utils.ts             # Model build, applyWhen validation, visibility
    components/
      json-form.component.*           # Remount wrapper (formKey / reloadSchema)
      json-form-instance.component.*  # Per-mount form instance
      field-renderer.component.*      # Recursive groups / arrays / leaves / custom
      leaf-field.component.*          # Built-in control bindings
      form-builder.component.*        # Visual schema editor

src/app/                              # Thin showcase demo app
  schemas/onboarding.schema.ts
  showcase/                           # Demo + StarRatingFieldComponent (custom type)

public/schemas/onboarding.json

examples/contact-form/                # Dogfood app — consumes @signal-form-kit/core from npm
```

## Publishing the library

Org: [@signal-form-kit on npm](https://www.npmjs.com/org/signal-form-kit) · publish as **`uchasepho03`**

```bash
npm login                              # username: uchasepho03
npm run publish:lib:dry-run            # verify tarball without uploading
npm run publish:lib                    # test → production build → npm publish
```

After publish, the package will appear at [npmjs.com/package/@signal-form-kit/core](https://www.npmjs.com/package/@signal-form-kit/core).

`build:lib:prod` compiles with **partial** compilation mode (required for npm). Output: `dist/signal-form-kit/`.

Package name: `@signal-form-kit/core` with peer dependencies on `@angular/core`, `@angular/common`, and `@angular/forms`.

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
| `provideSignalFormKit()` | App providers — field type registry, etc. |
| `FieldTypeRegistry` | Register custom field types + renderer components |
| `reloadSchema()` | Public method on `<sf-json-form>` to remount the form |

### `JsonFormComponent` inputs / outputs

| Name | Type | Description |
|------|------|-------------|
| `[schema]` | `FormSchema<T>` | Required. Field definitions and metadata |
| `[formKey]` | `string \| number` | Bump to remount form (default `0`) |
| `[submittingLabel]` | `string` | Button label while submitting (default: `"Submitting..."`) |
| `(formSubmit)` | `T` | Emits typed value after valid submit |
| `(valueChange)` | `T` | Emits on every model change |
| `(validityChange)` | `FormValidity` | Emits `{ valid, invalid, missingLabels }` |

### Custom field types

```typescript
import { createDefaultFieldTypeRegistry, provideSignalFormKit } from '@signal-form-kit/core';

const registry = createDefaultFieldTypeRegistry().register({
  type: 'star-rating',
  label: 'Star Rating',
  defaultValue: 0,
  component: StarRatingFieldComponent, // must accept fieldDef, fieldPath, model, fieldId
});

providers: [provideSignalFormKit({ registry })];
```

Use `type: 'star-rating'` (or any registered name) in schema JSON/TS. Built-in types still render via `LeafFieldComponent`.

### Validation messages & conditional rules

```typescript
{
  key: 'fullName',
  validation: {
    required: true,
    messages: { required: 'Please enter your full name.' },
  },
},
{
  key: 'taxId',
  hideWhen: { field: 'accountType', notEquals: 'corporate' },
  validation: {
    required: true,
    messages: { required: 'Tax ID is required for corporate accounts.' },
  },
},
```

Fields with `hideWhen` / `hideIf` wrap validators in Signal Forms `applyWhen` so required rules only apply when visible.

### Field types

**Inputs:** `text`, `email`, `password`, `number`, `textarea`, `url`, `tel`, `search`, `color`, `date`, `datetime-local`, `time`, `month`, `week`, `range`, `file`, `hidden`

**Choices:** `select`, `multiselect`, `checkbox`, `switch`, `radio`

**Structure:** `group`, `array`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server |
| `npm run build` | Production build |
| `npm run build:lib` | Library build (production / partial compilation by default) |
| `npm run build:lib:prod` | Same as `build:lib` (explicit production config) |
| `npm run publish:lib` | Test, build, and publish `@signal-form-kit/core` to npm |
| `npm test` | Unit tests (Vitest, 38 specs) |
| `npm run e2e` | Playwright smoke tests (showcase flow) |
| `npm run example:contact-form:build` | Build dogfood example (`examples/contact-form`) |

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## Tech stack

- Angular 21 (standalone components, signals)
- Signal Forms (`@angular/forms/signals`)
- Vitest + jsdom
- Playwright (E2E)
- SCSS

## License

MIT
