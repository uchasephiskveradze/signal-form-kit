# Contact Form Example

Minimal Angular app that consumes **`@signal-form-kit/core` from npm** (not the monorepo path alias).

## Install & run

From the **repository root** (after publishing or building the library locally):

```bash
# Option A — from npm (after @signal-form-kit/core is published)
cd examples/contact-form
npm install
npm start
```

```bash
# Option B — test unpublished local build
npm run build:lib:prod
cd examples/contact-form
npm install
npm install ../../dist/signal-form-kit
npm start
```

Open [http://localhost:4300](http://localhost:4300).

## What it proves

- Package installs and resolves from the npm registry
- `provideSignalFormKit()` + `JsonFormComponent` work outside the showcase
- Typed `defineFormSchema<T>()` + `(formSubmit)` emit the expected model

CI runs `npm run build` here on every push.
