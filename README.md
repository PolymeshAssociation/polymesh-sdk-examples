## Description

Example project that demonstrate how to use [Polymesh SDK](https://github.com/PolymeshAssociation/polymesh-sdk) along with some of its use cases

## Setup

### Requirements

- node.js [maintained version] (https://github.com/nodejs/release#release-schedule)
- yarn version 1.x (your preferred one should still work with minor translations)

### Installing Dependencies

```bash
$ yarn
```

### Environment Variables

```bash
POLYMESH_NODE_URL=## websocket URL for a Polymesh node ##
MIDDLEWARE_LINK=## URL for an instance of the Polymesh GraphQL Middleware service ##
MIDDLEWARE_KEY=## API key for the Middleware GraphQL service ##
ACCOUNT_SEED=## mnemonics of a signer ##
BOB_DID=## DID of an identity to be used as target (a Portfolio Custodian, a Claim target etc.) for various use cases ##
```

## Running the app

```bash
$ yarn run-example <path-to-example-file>
```

NOTE: You may be required to pass a second argument such as a ticker or a secondary account in some of the examples.
