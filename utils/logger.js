/**
 * Logger utility for tracking scraper operations
 */

class Logger {
  constructor(namespace = 'Scraper') {
    this.namespace = namespace;
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
    };
  }

  _timestamp() {
    return new Date().toISOString();
  }

  _format(level, message, color) {
    const timestamp = this._timestamp();
    return `${color}[${timestamp}] [${this.namespace}] [${level}]${this.colors.reset} ${message}`;
  }

  info(message) {
    console.log(this._format('INFO', message, this.colors.blue));
  }

  success(message) {
    console.log(this._format('SUCCESS', message, this.colors.green));
  }

  warn(message) {
    console.log(this._format('WARN', message, this.colors.yellow));
  }

  error(message, error = null) {
    console.error(this._format('ERROR', message, this.colors.red));
    if (error) {
      console.error(`${this.colors.dim}${error.stack || error}${this.colors.reset}`);
    }
  }

  debug(message) {
    console.log(this._format('DEBUG', message, this.colors.cyan));
  }

  step(stepNumber, message) {
    console.log(this._format(`STEP ${stepNumber}`, message, this.colors.bright));
  }
}

module.exports = Logger;
