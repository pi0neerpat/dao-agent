import path from 'path';
import os from 'os';
import winston from 'winston';

class Logger {
  static instance = null;

  constructor() {
    this.logger = winston.createLogger({
      format: winston.format.simple(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: path.join(os.homedir(), ".chatd", "service.log"),
          maxSize: 1000000, // 1 MB
          maxFiles: 1,
        })
      ]
    });
  }

  static getLogger() {
    if (this.instance === null) {
      this.instance = new this();
    }
    return this.instance;
  }
}

function logInfo(msg) {
  console.log(msg);
  Logger.getLogger().logger.info(msg);
}

function logErr(msg) {
  console.log(msg);
  Logger.getLogger().logger.error(msg);
}

export {
  logInfo,
  logErr
}