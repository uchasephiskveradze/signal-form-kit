# @signal-form-kit/core

[![npm version](https://img.shields.io/npm/v/@signal-form-kit/core)](https://www.npmjs.com/package/@signal-form-kit/core)
[![license](https://img.shields.io/npm/l/@signal-form-kit/core)](https://github.com/uchasephiskveradze/signal-form-kit/blob/master/LICENSE)

Schema-driven forms for **Angular 21** [Signal Forms](https://angular.dev/guide/forms/signals) — nested groups, dynamic arrays, 24 field types, conditional validation, custom field registry, and a visual builder.

> **Requirements:** Angular **21+**, standalone components, Signal Forms (`@angular/forms` ^21).  
> **Status:** Early release (0.1.x) — APIs may change. Feedback welcome via [issues](https://github.com/uchasephiskveradze/signal-form-kit/issues).

## Why use this

- **Schema in, form out** — JSON or TypeScript, no repetitive `FormGroup` boilerplate
- **Nested groups & arrays** — address blocks, repeatable contacts, `minItems` / `maxItems`
- **24 built-in field types** — text, email, select, checkbox, date, file, and more
- **Conditional fields** — `hideWhen` / `hideIf` with validators that only apply when visible
- **Custom field registry** — plug in your own renderers (e.g. star rating)
- **Visual builder** — `<sf-form-builder>` palette, inspector, live preview, JSON export

## Install

```bash
npm install @signal-form-kit/core
```

### Peer dependencies

Your app must already include Angular 21:

```bash
npm install @angular/core@^21 @angular/common@^21 @angular/forms@^21
```

| Peer | Version |
|------|---------|
| `@angular/core` | `^21.0.0` |
| `@angular/common` | `^21.0.0` |
| `@angular/forms` | `^21.0.0` |

## Quick start

**1. Register providers** in `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideSignalFormKit } from '@signal-form-kit/core';

export const appConfig: ApplicationConfig = {
  providers: [provideSignalFormKit()],
};
```

**2. Define a schema and render the form:**

```typescript
import { Component } from '@angular/core';
import { defineFormSchema, JsonFormComponent } from '@signal-form-kit/core';

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const schema = defineFormSchema<ContactForm>({
  title: 'Contact Us',
  submitLabel: 'Send',
  fields: [
    { key: 'name', label: 'Name', type: 'text', validation: { required: true } },
    { key: 'email', label: 'Email', type: 'email', validation: { required: true, email: true } },
    { key: 'message', label: 'Message', type: 'textarea', validation: { required: true } },
  ],
});

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [JsonFormComponent],
  template: `<sf-json-form [schema]="schema" (formSubmit)="onSubmit($event)" />`,
})
export class ContactComponent {
  schema = schema;

  onSubmit(value: ContactForm) {
    console.log(value);
  }
}
```

## Nested groups & conditional fields

```typescript
interface AccountForm {
  accountType: 'personal' | 'corporate';
  taxId: string;
  name: string;
}

const schema = defineFormSchema<AccountForm>({
  fields: [
    {
      key: 'accountType',
      label: 'Account Type',
      type: 'select',
      defaultValue: 'personal',
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Corporate', value: 'corporate' },
      ],
    },
    {
      key: 'taxId',
      label: 'Tax ID',
      type: 'text',
      hideWhen: { field: 'accountType', notEquals: 'corporate' },
      validation: { required: true },
    },
    { key: 'name', label: 'Name', type: 'text', validation: { required: true } },
  ],
});
```

```typescript
// Nested group
{
  key: 'address',
  type: 'group',
  fields: [
    { key: 'street', label: 'Street', type: 'text', validation: { required: true } },
    { key: 'city', label: 'City', type: 'text', validation: { required: true } },
  ],
}
```

## Links

- [Full documentation & showcase](https://github.com/uchasephiskveradze/signal-form-kit#readme)
- [Dogfood example app](https://github.com/uchasephiskveradze/signal-form-kit/tree/master/examples/contact-form)
- [Changelog](https://github.com/uchasephiskveradze/signal-form-kit/blob/master/CHANGELOG.md)
- [Report issues](https://github.com/uchasephiskveradze/signal-form-kit/issues)

## License

MIT
