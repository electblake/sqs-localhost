import * as os from 'os'
import * as fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import * as https from 'https'
import * as path from 'path'
import { SQSLocalOptions } from './types'
const debug = require('debug')('sqs-local')

export default class SQSLocal {
  private installPath: string = path.join(os.tmpdir(), 'sqs-local')
  public version: string = '0.14.6'
  private jarname: string = `elasticmq-server-${this.version}.jar`
  private downloadUrl: string = 'https://s3-eu-west-1.amazonaws.com/softwaremill-public/' + this.jarname
  public verbose: boolean = false
  private detached: boolean = false
  public process: ChildProcess
  public configFile: string

  constructor(options?: SQSLocalOptions) {
    if (options) {
      this.loadOptions(options)
    }
  }

  async start(options?: SQSLocalOptions) {
    return this.launch(options)
  }

  async launch(options?: SQSLocalOptions) {
    this.loadOptions(options)
    await this.install()

    const args = ['-jar', this.jarname]

    if (this.configFile) {
      args.push('-Dconfig.file=' + this.configFile)
    }
    if (this.process) {
      return this.process
    }

    const child = spawn('java', args, {
      cwd: this.installPath,
      env: process.env,
      stdio: ['pipe', 'pipe', process.stderr],
    })

    this.process = child

    if (!child.pid) {
      throw new Error('Unable to launch SQSLocal process')
    }

    const verbose = this.verbose
    const detached = this.detached
    const installPath = this.installPath

    return new Promise((resolve, reject) => {
      child
        .on('error', function(err) {
          if (verbose) debug('local SQS start error', err)
          reject(new Error('Local SQS failed to start. '))
        })
        .on('close', function(code) {
          if (code !== null && code !== 0) {
            if (verbose) debug('Local SQS failed to close with code', code)
          }
        })
      if (!detached) {
        process.on('exit', function() {
          child.kill()
        })
      }

      if (verbose) {
        debug(`SQSLocal(${child.pid}) started via java ${args.join(' ')} from CWD ${installPath}`)
      }

      resolve(child)
    })
  }

  stop() {
    if (this.process) {
      this.process.kill('SIGKILL')
      this.process = null
    }
    return true
  }

  stopChild(child) {
    if (child.pid) {
      debug('stopped the Child')
      child.kill()
    }
    return true
  }

  async relaunch(options?: SQSLocalOptions) {
    this.loadOptions(options)
    this.stop()
    return this.launch()
  }

  loadOptions(options: SQSLocalOptions) {
    if (options) {
      if (options.installPath) {
        this.installPath = options.installPath
      }
      if (options.downloadUrl) {
        this.downloadUrl = options.downloadUrl
      }
      if (options.verbose) {
        this.verbose = options.verbose
      }
      if (options.detached) {
        this.detached = options.detached
      }
      if (options.configFile) {
        this.configFile = options.configFile
      }
    }
  }

  remove() {
    fs.unlinkSync(this.installedJarPath)
  }

  get installedJarPath() {
    return path.join(this.installPath, this.jarname)
  }

  async install(options?: SQSLocalOptions) {
    this.loadOptions(options)
    debug('Checking for SQS-Local in ', this.installPath)
    const downloadUrl = this.downloadUrl
    const verbose = this.verbose
    try {
      if (fs.existsSync(this.installedJarPath)) {
        debug('Already installed in', this.installPath)
        return true
      }
    } catch (e) {}

    debug('SQS Local not installed. Installing into', this.installPath)

    if (!fs.existsSync(this.installPath)) fs.mkdirSync(this.installPath)

    const dest = fs.createWriteStream(this.installedJarPath)

    dest.on('finish', () => dest.close())

    if (fs.existsSync(this.downloadUrl)) {
      debug('Installing from local file:', this.downloadUrl)
      const downloadUrl = this.downloadUrl
      return new Promise((resolve, reject) => {
        const res = fs
          .createReadStream(downloadUrl)
          .on('end', function() {
            resolve(true)
          })
          .on('error', function(err) {
            reject(err)
          })
        res.pipe(dest)
      })
    } else {
      debug('Downloading..', downloadUrl)
      return new Promise((resolve, reject) => {
        https
          .get(downloadUrl, function(res) {
            if (200 != res.statusCode) {
              reject(new Error(`Error getting ${res.headers['location']}: ${res.statusCode}`))
            }
            res.pipe(dest)
            res
              .on('data', function() {
                if (verbose) {
                  debug('downloading..')
                }
              })
              .on('end', function() {
                debug('downloaded.')
                resolve(true)
              })
              .on('error', function(err) {
                debug('error', err)
                reject(err)
              })
          })
          .on('error', function(e) {
            reject(e)
          })
      })
    }
  }
}
