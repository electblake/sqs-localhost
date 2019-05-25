# SQS Localhost

- https://github.com/softwaremill/elasticmq

## Usage

```
npm install sqs-localhost
```

```
const SQSLocal = require('sqs-localhost')

const sqs = new SQSLocal()
sqs.launch()
sqs.stop()
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
