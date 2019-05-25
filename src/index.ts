import * as os from 'os'
import * as fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import * as https from 'https'
import * as path from 'path'

// const Q = require('q')
const debug = require('debug')('sqs-local')

interface SQSLocalConfig {
  installPath?: string
  downloadUrl?: string
  verbose?: boolean
  detached?: boolean
  configFile?: string
}

export class SQSLocal {
  private installPath: string = path.join(os.tmpdir(), 'sqs-local')
  public version: string = '0.14.6'
  private jarname: string = `elasticmq-server-${this.version}.jar`
  private downloadUrl: string = 'https://s3-eu-west-1.amazonaws.com/softwaremill-public/' + this.jarname
  public verbose: boolean = false
  private detached: boolean = false
  public process: ChildProcess
  public configFile: string

  constructor(config?: SQSLocalConfig) {
    if (config) {
      if (config.installPath) {
        this.installPath = config.installPath
      }
      if (config.downloadUrl) {
        this.downloadUrl = config.downloadUrl
      }
      if (config.verbose) {
        this.verbose = config.verbose
      }
      if (config.detached) {
        this.detached = config.detached
      }
      if (config.configFile) {
        this.configFile = config.configFile
      }
    }
  }

  async launch() {
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

  relaunch() {
    this.stop()
    this.launch()
    return true
  }

  configureInstaller(conf: SQSLocalConfig) {
    if (conf.installPath) {
      this.installPath = conf.installPath
    }
    if (conf.downloadUrl) {
      this.downloadUrl = conf.downloadUrl
    }
  }

  async install() {
    debug('Checking for SQS-Local in ', this.installPath)
    const downloadUrl = this.downloadUrl
    const verbose = this.verbose
    try {
      if (fs.existsSync(path.join(this.installPath, this.jarname))) {
        debug('Already installed in', this.installPath)
        return true
      }
    } catch (e) {}

    debug('SQS Local not installed. Installing into', this.installPath)

    if (!fs.existsSync(this.installPath)) fs.mkdirSync(this.installPath)

    if (fs.existsSync(this.downloadUrl)) {
      debug('Installing from local file:', this.downloadUrl)
      const downloadUrl = this.downloadUrl
      return new Promise((resolve, reject) => {
        fs.createReadStream(downloadUrl)
          .on('end', function() {
            resolve(true)
          })
          .on('error', function(err) {
            reject(err)
          })
      })
    } else {
      debug('Downloading..', downloadUrl)
      return new Promise((resolve, reject) => {
        https
          .get(downloadUrl, function(res) {
            if (200 != res.statusCode) {
              reject(new Error(`Error getting ${res.headers['location']}: ${res.statusCode}`))
            }
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

export default SQSLocal
