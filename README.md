# Polymesh SDK Examples

Example scripts demonstrating how to use the [Polymesh SDK](https://github.com/PolymeshAssociation/polymesh-sdk) against a Polymesh node. These examples target **chain v8** and SDK **v30**.

Each file under `src/examples/` is a self-contained script you can run with `yarn run-example`. They connect via `src/common/client.ts`, sign transactions with `@polymeshassociation/local-signing-manager`, and cover common workflows: assets, portfolios, settlements, compliance, STOs, staking, and more.

## Requirements

- **Node.js** 18+
- **Yarn** 4 (see `packageManager` in `package.json`)
- A running **Polymesh node** (WebSocket endpoint)
- **Polymesh middleware v2** (GraphQL) — required by the SDK for most queries

For local development, the [Polymesh local node](https://developers.polymesh.network/docs/development/) and its bundled middleware are the easiest starting point.

## Setup

```bash
yarn
cp .env.sample .env
# Edit .env for your node, middleware, and identities
```

## Environment variables

Copy `.env.sample` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `POLYMESH_NODE_URL` | Yes | WebSocket URL of the Polymesh node (e.g. `ws://localhost:9944`) |
| `MIDDLEWARE_LINK` | Yes | URL of the Polymesh GraphQL middleware (e.g. `http://localhost:3000`) |
| `MIDDLEWARE_KEY` | No | API key for middleware v2 (usually empty locally) |
| `ACCOUNT_SEED` | Yes | Mnemonic of the primary signing account (e.g. `//Alice`) |
| `BOB_DID` | For some examples | DID of a secondary identity used as a target (custodian, claim target, agent invitee, etc.) |
| `BOB_SEED` | For `subsidy.ts` | Mnemonic of the subsidy beneficiary account (e.g. `//Bob`) |
| `DIVIDEND_CURRENCY` | For dividend/STO examples | Asset ID of the currency used for dividends and STO raising |

**Tip:** `BOB_DID` must exist on the chain you connect to. On a fresh local node, use a DID that is actually registered — it may differ from the default in `.env.sample`. The account behind `BOB_SEED` does not have to control `BOB_DID`; examples that need Bob to *sign* use `BOB_SEED`, while examples that only need a target identity use `BOB_DID`.

## Running examples

```bash
yarn run-example <path-to-example> [arguments]
```

Examples load variables from `.env` automatically (`dotenv/config`).

### Argument formats

Most asset-scoped examples take a **ticker or asset ID** as the first argument:

```bash
yarn run-example src/examples/assetBalance.ts MY_TICKER
yarn run-example src/examples/assetBalance.ts 2871e9af-9928-87f4-92fa-67b57ddf5068
```

Some examples use **key=value** arguments (see the header comment in each file):

```bash
yarn run-example src/examples/assets/issueTokens.ts asset=MY_TICKER amount=1000
yarn run-example src/examples/subsidy.ts account=5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
```

### Examples with dependencies

A few scripts assume prior setup or a specific run order:

| Run first | Then |
|-----------|------|
| `createToken.ts` | Asset-scoped examples (to create an asset you control) |
| `stos.ts` | `investInSto.ts` (needs a live offering) |

STO example with optional close step:

```bash
yarn run-example src/examples/stos.ts <ASSET_ID>
yarn run-example src/examples/stos.ts <ASSET_ID> --close   # also closes the offering at the end
yarn run-example src/examples/investInSto.ts <ASSET_ID>
```

Dividend distributions accept an optional currency as a second argument or via `DIVIDEND_CURRENCY`:

```bash
yarn run-example src/examples/dividendDistributions.ts <ASSET_ID> <CURRENCY_ASSET_ID>
```

## Example index

### Assets

| Example | Arguments | Description |
|---------|-----------|-------------|
| `assetBalance.ts` | asset | Query balance for an asset |
| `assetMetadata.ts` | asset | Register and manage asset metadata |
| `assetInviteAgent.ts` | asset | Invite an external agent |
| `createToken.ts` | ticker | Create a new fungible asset |
| `assets/issueTokens.ts` | `asset=`, `amount=` | Issue tokens |
| `assets/redeemTokens.ts` | `asset=`, `amount=` | Redeem tokens |
| `assets/getHolders.ts` | `asset=` | List asset holders |
| `transferRestrictions.ts` | asset | Set transfer restrictions |

### Portfolios & settlements

| Example | Arguments | Description |
|---------|-----------|-------------|
| `portfolios.ts` | asset (optional) | Create, rename, move funds, redeem, delete portfolios |
| `portfolioCustodians.ts` | — | Assign and manage portfolio custodians |
| `settlements.ts` | asset (optional) | Create a venue, add an instruction, affirm |
| `batchTransactions.ts` | — | Batch multiple transactions |

### Identity & permissions

| Example | Arguments | Description |
|---------|-----------|-------------|
| `manageSecondaryKeys.ts` | account (optional) | Invite and manage secondary signing keys |
| `externalAgents.ts` | asset | Manage external agent groups |
| `subsidy.ts` | `account=` | Approve, accept, and manage subsidies |
| `staking.ts` | — | Bond, nominate, unbond, set payee/controller |

### Compliance & claims

| Example | Arguments | Description |
|---------|-----------|-------------|
| `compliance.ts` | asset | Set compliance requirements and trusted issuers |
| `claims.ts` | asset | Add and revoke claims |
| `customClaims.ts` | `name=` | Create and use custom claim types |

### Corporate actions & STOs

| Example | Arguments | Description |
|---------|-----------|-------------|
| `checkpoints.ts` | asset | Create and inspect checkpoints |
| `dividendDistributions.ts` | asset, currency (optional) | Launch and manage dividend distributions |
| `securityTokenCaa.ts` | asset | Assign a corporate actions agent |
| `stos.ts` | asset, currency (optional), `--close` | Launch, modify, freeze, and close an STO |
| `investInSto.ts` | asset | Invest in a live offering |

## Local development notes

- **Use an asset you control.** Alice may not have permissions on pre-existing chain assets. Run `createToken.ts` first, or pass an asset ID you own.
- **Re-runs are mostly safe.** Many examples use timestamp suffixes or skip steps gracefully when state already exists (duplicate portfolio names, already bonded, pending subsidy, etc.).
- **`//Alice` and `//Bob` may share a DID** on a default local chain. `investInSto.ts` handles this by registering a new investor identity when needed.
- **Settlement timing.** Instructions with a far-future `endBlock` will not settle until that block. Examples that need immediate settlement omit `endBlock`.
- **CDD claims on v8.** `claims.ts` skips CDD-specific queries that are no longer supported on chain v8.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `doesn't have the required permissions` | The signing identity is not an agent/owner of the asset |
| `No asset exists with asset ID` | Wrong asset ID for this chain, or asset was never created |
| `No live offerings found` | Run `stos.ts` before `investInSto.ts` |
| `SameSenderReceiver` | Investor and asset owner are the same identity |
| `Instruction is already affirmed` | Harmless on re-run; the example skips duplicate affirmation |
| Middleware / connection errors | Check `POLYMESH_NODE_URL` and `MIDDLEWARE_LINK` are reachable |

## Project structure

```
src/
  common/
    client.ts      # Shared Polymesh connection helper
    assets.ts      # Asset lookup helpers
    utils.ts       # Parsing, logging, and type helpers
  examples/        # Runnable example scripts
```
