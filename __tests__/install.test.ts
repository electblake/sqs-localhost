import SQSLocal from '../src/index'

describe('install', () => {
  it('can install into tmp dir', async () => {
    const local = new SQSLocal({ verbose: true })
    const res = await local.install()
    local.remove()
    expect(res).toBe(true)
  }, 10000)
})
