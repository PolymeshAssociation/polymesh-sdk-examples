[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

# Polymath Typescript Template Repo

This is a template repository for typescript projects. It includes some initial typescript config and tooling to make our lives easier

**NOTE**: This repo uses `yarn` instead of `npm` for dependencies

Things included in the repo:

- Typescript (duh)
- Absolute imports (allows you to `import { foo } from ~/bar;` instead of `import { foo } from ../../../../bar;`. The default character is `~` but it can be changed in `tsconfig.json`)
- Eslint to enforce code style rules (extending standard JS with enforced semicolons and typescript-eslint)
- Prettier to format code on save
- Semantic release for automatic versioning
- Commitizen
- Husky to enforce conventional commits and format the code using prettier before committing
- Github actions for CI (runs linter, tests, build and semantic-release)

## Scripts

- `yarn build:ts` compiles typescript files into javascript and type declarations. Outputs to `dist/` directory
- `yarn build:docs` builds a documentation page from tsdoc comments in the code. Outputs to `docs/` directory
- `yarn test` runs tests and outputs the coverage report
- `yarn commit` runs the commit formatting tool (should replace normal commits)
- `yarn semantic-release` runs semantic release to calculate version numbers based on the nature of changes since the last version (used in CI pipelines)
- `yarn lint` runs the linter on all .ts(x) and .js(x) files and outputs all errors
- `yarn format` runs prettier on all .ts(x) and .js(x) files and formats them according to the project standards

## Notes

- All tools are configured via their respective config files instead of adding the config in `package.json`. There is also some vscode project config in `.vscode/settings.json`
  - eslint: `.eslintrc`
  - lint-staged: `.lintstagedrc`
  - prettier: `.prettierrc`
  - commitlint: `commitlint.config.js`
  - husky: `husky.config.js`
  - jest: `jest.config.js`
  - semantic-release: `release.config.js`
  - typedoc: `typedoc.json`
  - github actions: `.github/main.yml`
- The CI config assumes a `master` branch for stable releases and a `beta` branch for beta releases. Every time something gets pushed to either of those branches (or any time a pull request is opened to any branch), github actions will run. Semantic-release config makes it so that actual releases are only made on pushes to `master` or `beta`
- The CI config also adds an extra couple of steps to flatten the file structure that actually gets published. This means that your published package will have the buit files at the root level instead of inside a `dist` folder. Those steps are:
  - copy `package.json` into the `dist` folder after building
  - `cd` into the `dist` folder
  - install deps into the `dist` folder
  - run `semantic-release` from there
- In order for automated NPM releases to actually work, you need to add an NPM auth token as a secret in your repo. To do that, go to your repo's `settings -> secrets -> add a new secret` input `NPM_TOKEN` as the secret name and the token you generated on your NPM account in the text area
- If you don't need automated NPM releases, you might want to uninstall `semantic-release` and tweak the github actions yaml file to skip the release step
