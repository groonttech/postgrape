import { Duration } from 'luxon';
import * as util from 'util';

export class DurationWithTZ {
  public readonly duration: Duration;
  public readonly offset: Duration;
  public readonly isNegative: boolean = false;

  constructor(ISOTimeWithTZ: string) {
    const sign = ISOTimeWithTZ.charAt(8);
    const [durationPart, offsetPart] = ISOTimeWithTZ.split(sign);
    this.duration = Duration.fromISOTime(durationPart);
    this.offset = Duration.fromISOTime(offsetPart);
    if (sign === '-') {
      this.offset = Duration.fromObject({ second: 0 }).minus(this.offset);
      this.isNegative = true;
    }
  }

  public toUTC(): Duration {
    return this.duration.minus(this.offset);
  }

  public toString(): string {
    const offset = this.isNegative ? Duration.fromObject({ second: 0 }).minus(this.offset) : this.offset;
    return `${this.duration.toISOTime()}${this.isNegative ? '-' : '+'}${offset.toFormat('hh:mm')}`;
  }

  public [util.inspect.custom](depth: any, opts: any): string {
    return this.toString();
  }

  toJSON() {
    return this.toString();
  }
}
