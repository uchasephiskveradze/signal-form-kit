# Signal Form Showcase

A schema-driven form engine for **Angular 21** built on [Signal Forms](https://angular.dev/guide/forms/signals). Pass a JSON schema or a typed TypeScript config — get a fully validated form with typed outputs and zero boilerplate.

## Why this exists

Reactive Forms are powerful but verbose. Every enterprise app repeats the same patterns: define controls, wire validators, bind templates, handle errors. This library generates the entire form from metadata so you focus on the schema, not the plumbing.

## Features

- **JSON or TypeScript schemas** — same shape, two input modes
- **Typed outputs** — `defineFormSchema<T>()` ties field keys to your model interface
- **Signal Forms native** — fine-grained reactivity, `hidden()` for conditional fields that don't block validation
- **Built-in validators** — required, email, min/max, minLength/maxLength, pattern
- **Conditional fields** — `hideWhen` (JSON-serializable) or `hideIf` (TypeScript callback)
- **Live value stream** — `(valueChange)` for debugging and side effects

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Usage

### TypeScript schema (type-safe)

```typescript
import { defineFormSchema, JsonFormComponent } from './lib';

interface User {
  fullName: string;
  email: string;
  age: number;
}

const schema = defineFormSchema<User>({
  title: 'Sign Up',
  submitLabel: 'Create Account',
  fields: [
    {
      key: 'fullName',
      label: 'Full Name',
      type: 'text',
      validation: { required: true, minLength: 3 },
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      validation: { required: true, email: true },
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number',
      defaultValue: 18,
      validation: { required: true, min: 18 },
    },
  ],
});

@Component({
  imports: [JsonFormComponent],
  template: `<sf-json-form [schema]="schema" (formSubmit)="onSubmit($event)" />`,
})
export class SignUpComponent {
  schema = schema;

  onSubmit(value: User) {
    console.log(value); // fully typed
  }
}
```

### JSON schema (runtime)

```typescript
import { createFormSchemaFromJson, JsonFormComponent } from './lib';

const schema = createFormSchemaFromJson<User>(
  await fetch('/schemas/user.json').then((r) => r.json()),
);
```

Example JSON with conditional field:

```json
{
  "fields": [
    { "key": "accountType", "label": "Type", "type": "select", "defaultValue": "personal", "options": [...] },
    {
      "key": "taxId",
      "label": "Tax ID",
      "type": "text",
      "validation": { "required": true },
      "hideWhen": { "field": "accountType", "notEquals": "corporate" }
    }
  ]
}
```

## Project structure

```
src/lib/                      # Reusable form engine
  types/form-schema.ts        # Schema types + defineFormSchema()
  utils/schema-utils.ts       # Model builder, visibility, validators
  components/json-form.component.*

src/app/
  schemas/                    # Example typed schemas
  showcase/                   # Interactive demo

public/schemas/               # Example JSON schemas
```

## API

| Export | Description |
|--------|-------------|
| `JsonFormComponent` | `<sf-json-form>` — renders a form from schema |
| `defineFormSchema<T>()` | Type-safe schema builder |
| `createFormSchemaFromJson<T>()` | Parse JSON string or object |
| `buildInitialModel()` | Build default model from schema |
| `shouldHideField()` | Evaluate conditional visibility |

### Component inputs / outputs

| Name | Type | Description |
|------|------|-------------|
| `[schema]` | `FormSchema<T>` | Required. Field definitions and metadata |
| `[submittingLabel]` | `string` | Button label while submitting |
| `(formSubmit)` | `T` | Emits typed value after valid submit |
| `(valueChange)` | `T` | Emits on every model change |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |

## Tech stack

- Angular 21 (standalone components, signals)
- Signal Forms (`@angular/forms/signals`)
- Vitest + jsdom
- SCSS

## License

MIT
