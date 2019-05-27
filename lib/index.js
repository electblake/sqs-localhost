"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
var fs = require("fs");
var child_process_1 = require("child_process");
var https = require("https");
var path = require("path");
var debug = require('debug')('sqs-local');
var SQSLocal = /** @class */ (function () {
    function SQSLocal(options) {
        this.installPath = path.join(os.tmpdir(), 'sqs-local');
        this.version = '0.14.6';
        this.jarname = "elasticmq-server-" + this.version + ".jar";
        this.downloadUrl = 'https://s3-eu-west-1.amazonaws.com/softwaremill-public/' + this.jarname;
        this.verbose = false;
        this.detached = false;
        if (options) {
            this.loadOptions(options);
        }
    }
    SQSLocal.prototype.start = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.launch(options)];
            });
        });
    };
    SQSLocal.prototype.launch = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var args, child, verbose, detached, installPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.loadOptions(options);
                        return [4 /*yield*/, this.install()];
                    case 1:
                        _a.sent();
                        args = ['-jar', this.jarname];
                        if (this.configFile) {
                            args.push('-Dconfig.file=' + this.configFile);
                        }
                        if (this.process) {
                            return [2 /*return*/, this.process];
                        }
                        child = child_process_1.spawn('java', args, {
                            cwd: this.installPath,
                            env: process.env,
                            stdio: ['pipe', 'pipe', process.stderr],
                        });
                        this.process = child;
                        if (!child.pid) {
                            throw new Error('Unable to launch SQSLocal process');
                        }
                        verbose = this.verbose;
                        detached = this.detached;
                        installPath = this.installPath;
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                child
                                    .on('error', function (err) {
                                    if (verbose)
                                        debug('local SQS start error', err);
                                    reject(new Error('Local SQS failed to start. '));
                                })
                                    .on('close', function (code) {
                                    if (code !== null && code !== 0) {
                                        if (verbose)
                                            debug('Local SQS failed to close with code', code);
                                    }
                                });
                                if (!detached) {
                                    process.on('exit', function () {
                                        child.kill();
                                    });
                                }
                                if (verbose) {
                                    debug("SQSLocal(" + child.pid + ") started via java " + args.join(' ') + " from CWD " + installPath);
                                }
                                resolve(child);
                            })];
                }
            });
        });
    };
    SQSLocal.prototype.stop = function () {
        if (this.process) {
            this.process.kill('SIGKILL');
            this.process = null;
        }
        return true;
    };
    SQSLocal.prototype.stopChild = function (child) {
        if (child.pid) {
            debug('stopped the Child');
            child.kill();
        }
        return true;
    };
    SQSLocal.prototype.relaunch = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.loadOptions(options);
                this.stop();
                return [2 /*return*/, this.launch()];
            });
        });
    };
    SQSLocal.prototype.loadOptions = function (options) {
        if (options) {
            if (options.installPath) {
                this.installPath = options.installPath;
            }
            if (options.downloadUrl) {
                this.downloadUrl = options.downloadUrl;
            }
            if (options.verbose) {
                this.verbose = options.verbose;
            }
            if (options.detached) {
                this.detached = options.detached;
            }
            if (options.configFile) {
                this.configFile = options.configFile;
            }
        }
    };
    SQSLocal.prototype.remove = function () {
        fs.unlinkSync(this.installedJarPath);
    };
    Object.defineProperty(SQSLocal.prototype, "installedJarPath", {
        get: function () {
            return path.join(this.installPath, this.jarname);
        },
        enumerable: true,
        configurable: true
    });
    SQSLocal.prototype.install = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var downloadUrl, verbose, dest, downloadUrl_1;
            return __generator(this, function (_a) {
                this.loadOptions(options);
                debug('Checking for SQS-Local in ', this.installPath);
                downloadUrl = this.downloadUrl;
                verbose = this.verbose;
                try {
                    if (fs.existsSync(this.installedJarPath)) {
                        debug('Already installed in', this.installPath);
                        return [2 /*return*/, true];
                    }
                }
                catch (e) { }
                debug('SQS Local not installed. Installing into', this.installPath);
                if (!fs.existsSync(this.installPath))
                    fs.mkdirSync(this.installPath);
                dest = fs.createWriteStream(this.installedJarPath);
                dest.on('finish', function () { return dest.close(); });
                if (fs.existsSync(this.downloadUrl)) {
                    debug('Installing from local file:', this.downloadUrl);
                    downloadUrl_1 = this.downloadUrl;
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var res = fs
                                .createReadStream(downloadUrl_1)
                                .on('end', function () {
                                resolve(true);
                            })
                                .on('error', function (err) {
                                reject(err);
                            });
                            res.pipe(dest);
                        })];
                }
                else {
                    debug('Downloading..', downloadUrl);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            https
                                .get(downloadUrl, function (res) {
                                if (200 != res.statusCode) {
                                    reject(new Error("Error getting " + res.headers['location'] + ": " + res.statusCode));
                                }
                                res.pipe(dest);
                                res
                                    .on('data', function () {
                                    if (verbose) {
                                        debug('downloading..');
                                    }
                                })
                                    .on('end', function () {
                                    debug('downloaded.');
                                    resolve(true);
                                })
                                    .on('error', function (err) {
                                    debug('error', err);
                                    reject(err);
                                });
                            })
                                .on('error', function (e) {
                                reject(e);
                            });
                        })];
                }
                return [2 /*return*/];
            });
        });
    };
    return SQSLocal;
}());
exports.default = SQSLocal;
//# sourceMappingURL=index.js.map