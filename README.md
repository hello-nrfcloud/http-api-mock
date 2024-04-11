# HTTP API Mock [![npm version](https://img.shields.io/npm/v/@bifravst/http-api-mock.svg)](https://www.npmjs.com/package/@bifravst/http-api-mock)

[![GitHub Actions](https://github.com/bifravst/http-api-mock/workflows/Test%20and%20Release/badge.svg)](https://github.com/bifravst/http-api-mock/actions)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![@commitlint/config-conventional](https://img.shields.io/badge/%40commitlint-config--conventional-brightgreen)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

Provides a mock HTTP API for testing third-party API integrations.

## Create a new mock HTTP API

Configure your AWS credentials, see [.envrc.example](./.envrc.example).

Create a new mock API:

```bash
npx @bifravst/http-api-mock

{
  "stackName": "http-api-mock-69c2c4b9",
  "responsesTableName": "http-api-mock-69c2c4b9-httpapimockresponses562FCFC7-C80OCULJKYFE",
  "apiURL": "https://liv73h149l.execute-api.eu-west-1.amazonaws.com/prod/",
  "requestsTableName": "http-api-mock-69c2c4b9-httpapimockrequests2216D487-608PM7EHETW4"
}
```

## Describe a mock HTTP API

```bash
npx @bifravst/http-api-mock describe <stackName>
```

## Delete a mock HTTP API

```bash
npx @bifravst/http-api-mock destroy <stackName>
```
