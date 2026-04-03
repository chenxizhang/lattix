import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logStream: fs.WriteStream | null = null;
  private originalLog: typeof console.log | null = null;
  private originalError: typeof console.error | null = null;
  private originalWarn: typeof console.warn | null = null;

  /**
   * Set up logging to a file. Redirects console.log, console.error, and console.warn
   * to write timestamped entries to the specified file.
   */
  setup(logFilePath: string): void {
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalWarn = console.warn;

    console.log = (...args: unknown[]) => {
      this.writeEntry('INFO', args);
    };

    console.error = (...args: unknown[]) => {
      this.writeEntry('ERROR', args);
    };

    console.warn = (...args: unknown[]) => {
      this.writeEntry('WARN', args);
    };
  }

  /**
   * Restore original console methods and close the log stream.
   */
  restore(): void {
    if (this.originalLog) {
      console.log = this.originalLog;
      this.originalLog = null;
    }
    if (this.originalError) {
      console.error = this.originalError;
      this.originalError = null;
    }
    if (this.originalWarn) {
      console.warn = this.originalWarn;
      this.originalWarn = null;
    }
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  private writeEntry(level: string, args: unknown[]): void {
    if (!this.logStream) return;
    const timestamp = new Date().toISOString();
    const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    this.logStream.write(`${timestamp} [${level}] ${message}\n`);
  }
}
