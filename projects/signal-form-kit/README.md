# @signal-form-kit/core

Schema-driven forms for **Angular 21** [Signal Forms](https://angular.dev/guide/forms/signals).

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

## Quick example

```typescript
import { Component } from '@angular/core';
import {
  defineFormSchema,
  JsonFormComponent,
  provideSignalFormKit,
} from '@signal-form-kit/core';

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

// app.config.ts
export const appConfig = {
  providers: [provideSignalFormKit()],
};
```

## Full documentation

See the [repository README](https://github.com/uchasephiskveradze/signal-form-kit#readme) for the complete API, custom field types, visual builder, and publishing guide.

## License

MIT
