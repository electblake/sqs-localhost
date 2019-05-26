import SQSLocal from '../src/index'

describe('launch', () => {
  it('can launch and stop', async () => {
    const local = new SQSLocal({ verbose: true, installPath: '.sqs' })
    const process = await local.launch()
    expect(process).toHaveProperty('pid')
    const stop = local.stop()
    expect(stop).toBe(true)
    local.remove()
    return true
  }, 100000)
})
