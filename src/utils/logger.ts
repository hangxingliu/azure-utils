const noopFn = () => { };

export class Logger {
  readonly prefix: string;
  private readonly toStdout = (...args: any[]) => console.log(this.prefix, ...args);
  private readonly toStderr = (...args: any[]) => console.error(this.prefix, ...args);
  verbose: (...args: any[]) => void;
  log = this.toStdout;
  error = (...args: any[]) => console.error(this.prefix, ...args);
  fatal = (...args: any[]) => {
    console.error(this.prefix, ...args);
    process.exit(1);
  }
  constructor(prefix: string) {
    this.prefix = `${prefix}:`;
    this.verbose = noopFn;
  }
  setVerbose(verbose: boolean) {
    this.verbose = verbose ? this.log : noopFn;
  }
  setLogDest(dest: 'stdout' | 'stderr') {
    if (dest === 'stderr') this.log = this.toStderr;
    else this.log = this.toStdout
  }
}
