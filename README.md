# SQS Localhost

- Install and Launch https://github.com/softwaremill/elasticmq
- Inspired by https://github.com/99xt/dynamodb-localhost

## Usage

```
npm install sqs-localhost
```

```
const SQSLocal = require('sqs-localhost')

const sqs = new SQSLocal()
await sqs.launch()
sqs.stop()
```

TypeScript

```
import SQSLocal from 'sqs-localhost'
```

### Advanced

```
const SQSLocal = require('sqs-localhost')

const sqs = new SQSLocal({
    verbose: true,
    installPath: '.sqs',
    configFile: './path/to/custom.conf'
})

await sqs.install()

const process = sqs.launch()

console.log('pid', process.pid)

process.kill('SIGKILL')

```

## Development

```
npm install
npm run build
```

```
npm run watch
```

```
npm run test -- --watch
```
