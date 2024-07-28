## Requirements

- Use the node version specified by the .nvmrc file
- Use the correct npm version by running `npm run install-npm`

## How to run the tests

- Use the following .env.test

```env
NODE_ENV=test
API_BASE_URL=http://localhost:8081/api/v1/
TEST_BEYOND_CREDENTIALS_PATH=./test/beyondCredentials.json
TEST_BEYOND_CREDENTIALS={...the credentials JSON goes here (explained below)...}
```

- Run Quoti API locally
- Run `qt login --org=beyond` and follow the steps
- Copy the contents of the credentials file to the TEST_BEYOND_CREDENTIALS
  environment variable
  - If you're using MacOS this should work: `cat ~/.config/quoti-cli/credentials.json | jq -c | pbcopy` (you may have to
    install `jq` but you should have it anyway)
- Run npm run test:e2e
