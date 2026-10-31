# Contributing to React Native Ajora

Thank you for helping improve Ajora. Contributions can include bug
reproductions, documentation, examples, tests, accessibility improvements, and
code.

By participating, you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Before opening an issue

- Search existing issues and pull requests.
- Try the latest release and the `dev` branch.
- Reduce the problem to the smallest reproducible app or test.
- Remove tokens, runtime URLs containing secrets, personal data, and customer
  messages from logs.

Use the repository issue forms for bugs and feature requests. Questions that
need design discussion can start as an issue with the `question` label.

## Development setup

Requirements:

- Node.js 18 or newer
- npm 10 or newer
- A working Expo toolchain for mobile verification

```bash
git clone https://github.com/habasefa/react-native-ajora.git
cd react-native-ajora
git switch dev
npm ci
```

Run the checks relevant to your change:

```bash
npm test
npm run build
npm run lint
```

`npm run build` compiles TypeScript into the ignored `lib/` directory and is
the main package-level type check. Tests use Vitest.

Validate documentation changes before opening a pull request:

```bash
npx --yes markdownlint-cli2@0.18.1 README.md CHANGELOG.md CONTRIBUTING.md \
  CODE_OF_CONDUCT.md SECURITY.md "docs/*.md" \
  .github/PULL_REQUEST_TEMPLATE.md
npx --yes prettier@3.6.2 --check README.md CHANGELOG.md CONTRIBUTING.md \
  CODE_OF_CONDUCT.md SECURITY.md "docs/*.md" ".github/**/*.yml" \
  .markdownlint-cli2.yaml
node scripts/check-docs-links.mjs
```

## Run the example

The current example lives in `example-app`:

```bash
cd example-app
npm install
EXPO_PUBLIC_RUNTIME_URL=http://localhost:3000/api/copilotkit npx expo start
```

Use a device-accessible runtime URL when testing on hardware. The example uses
single-endpoint transport.

## Repository layout

| Path                | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `packages/native`   | React Native providers, hooks, components, themes, and types |
| `packages/core`     | Agent runtime client, state, tools, and suggestions          |
| `packages/shared`   | Shared types and utilities                                   |
| `packages/markdown` | React Native markdown rendering                              |
| `example-app`       | Minimal Expo integration                                     |
| `docs`              | User guides and API reference                                |

Public APIs must be exported from `packages/native/index.ts` through supported
modules. Do not ask consumers to import package internals.

## Change guidelines

### Keep changes focused

One pull request should solve one problem. Avoid unrelated formatting,
dependency upgrades, or refactors that make review harder.

### Preserve compatibility

- Treat exported names, props, hook return values, and wire formats as public.
- Document intentional breaking changes.
- Keep peer dependencies accurate when adding an import.
- Add a changeset/release note if one is adopted by the repository.

### Test behavior

Add focused tests for:

- provider and hook state transitions;
- error and retry paths;
- duplicate tools or messages;
- thread switching and cancellation;
- tool status rendering;
- accessibility-critical copy or control behavior.

Prefer user-visible behavior and public contracts over implementation details.

### Document the public surface

If a change affects public behavior:

1. Update [docs/api-reference.md](docs/api-reference.md).
2. Update the relevant guide in `docs/`.
3. Update [README.md](README.md) if installation or the quick start changes.
4. Include a migration note when existing code must change.

Use fenced code blocks with language labels and keep examples runnable.

### Accessibility

New controls need:

- an accessible role;
- a useful accessibility label;
- disabled/busy state;
- keyboard and screen-reader-compatible behavior;
- adequate color contrast in light and dark themes.

Avoid motion-only or color-only status communication.

## Branch and commits

Branch from `dev` unless a maintainer asks otherwise:

```bash
git switch dev
git pull --ff-only
git switch -c fix/short-description
```

Use clear Conventional Commit-style messages:

```text
feat(chat): add explicit history retry
fix(hydration): discard stale thread pages
docs(tools): document HITL response lifecycle
```

Keep commits reviewable. Squash only when it improves the resulting history.

## Pull request checklist

Before requesting review:

- [ ] The change is focused and the PR description explains the problem.
- [ ] Tests were added or updated for behavior changes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Relevant lint checks pass.
- [ ] Public types and documentation are updated.
- [ ] The example or a test app was run for UI changes.
- [ ] Screenshots or a recording are included for visible changes.
- [ ] No credentials, customer data, or private URLs are present.

Use the pull request template and link the issue it resolves.

## Review expectations

Maintainers may request changes for correctness, maintainability, test
coverage, public API consistency, accessibility, or documentation. Review
comments are about the change, not the contributor.

Do not repeatedly force-push a branch under active review unless required.
Add follow-up commits so reviewers can see what changed.

## Security

Do not report vulnerabilities in a public issue or pull request. Follow
[SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the
repository's [MIT License](LICENSE).
