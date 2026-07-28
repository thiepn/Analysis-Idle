# Dependency report

Runtime: `preact@10.29.7`, `zod@4.4.3`. Preact supplies the debug renderer at materially lower scope than a component framework; Zod validates inert content/save structures.

Development: `@eslint/js@9.39.5`, `@preact/preset-vite@2.10.6`, `@testing-library/preact@3.2.4`, `@testing-library/user-event@14.6.1`, `@types/babel__core@7.20.5`, `@types/node@22.20.1`, `eslint@9.39.5`, `eslint-plugin-jsx-a11y@6.10.2`, `fake-indexeddb@6.2.5`, `jsdom@29.1.1`, `prettier@3.9.5`, `tsx@4.23.1`, `typescript@5.9.3`, `typescript-eslint@8.64.0`, `vite@7.3.6`, `vitest@3.2.7`. Vite/TypeScript/Vitest/Testing Library/ESLint/Prettier provide build, strict contracts, tests, accessibility linting, and stable formatting. `fake-indexeddb` is test-only. `@types/babel__core` satisfies the preset's type surface.

ESLint 10 was evaluated and rejected because `eslint-plugin-jsx-a11y@6.10.2` declares an incompatible peer range; exact ESLint 9.39.5 resolves the supported stack. No router, state manager, date library, animation kit, component kit, IndexedDB wrapper, large-number library, analytics SDK, Playwright, KaTeX, or PWA package was added because Phase 1 has no measured need. Installed audit: zero reported vulnerabilities.
