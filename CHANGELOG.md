# Changelog

All notable changes to `@signal-form-kit/core` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-06-10

### Changed

- Expand npm README with feature overview, badges, nested/conditional examples, and doc links
- Improve `package.json` keywords and description for discoverability

## [0.1.1] - 2026-06-09

### Changed

- Normalize `repository.url` to `git+https://` for npm metadata
- README: install from npm, peer dependency requirements, consumer example app

### Added

- GitHub Actions CI (unit tests, library build, dogfood example build, E2E)
- `examples/contact-form` — minimal Angular app consuming `@signal-form-kit/core` from npm

## [0.1.0] - 2026-06-09

### Added

- Initial publish of `@signal-form-kit/core`
- Schema-driven forms on Angular Signal Forms (`JsonFormComponent`, `FormBuilderComponent`)
- 24 built-in field types, nested groups, dynamic arrays
- Custom field registry (`FieldTypeRegistry`, `provideSignalFormKit`)
- Conditional visibility (`hideWhen`, `hideIf`) with `applyWhen` validation
- Form remount via `formKey` / `reloadSchema()`
- Unit, integration, and Playwright E2E tests in the showcase repo

[0.1.2]: https://github.com/uchasephiskveradze/signal-form-kit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/uchasephiskveradze/signal-form-kit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/uchasephiskveradze/signal-form-kit/releases/tag/v0.1.0
