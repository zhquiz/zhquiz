/**
 * Possible duration units in this parser
 */
export type DurationUnit = 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'mo' | 'y'

export interface IDurationOptions {
  /**
   * @default true
   */
  sign?: boolean;
  /**
   * Number of units plus subunits
   */
  granularity?: number;
  /**
   * Number of max units shown
   */
  maxUnit?: number;
  /**
   * Smallest unit shown
   *
   * @default 's'
   */
  smallest?: DurationUnit;
  /**
   * Custom naming for units
   */
  unit?: Partial<Record<DurationUnit, string>>;
}

export class Duration {
  /**
   * Sign in front of the output toString()
   */
  sign: '+' | '-' | '' = '+'

  /**
   * Milliseconds
   */
  ms: number
  /**
   * Seconds
   */
  s: number
  /**
   * Minutes
   */
  min: number
  /**
   * Hours
   */
  h: number
  /**
   * Days
   */
  d: number
  /**
   * Weeks
   */
  w: number
  /**
   * Months
   */
  mo: number
  /**
   * Years
   */
  y: number

  private _dates: [Date, Date] = [new Date(this.from), new Date(this.to)]

  /**
   * Parse milliseconds (i.e. epoch) to Duration, based on before present time
   */
  static of (msec: number) {
    const to = new Date()
    const output = new this(new Date(+to - msec), to)
    output.sign = ''

    return output
  }

  constructor (
    /**
     * Starting Date
     */
    public from: Date,
    /**
     * Ending date
     */
    public to: Date
  ) {
    if (from > to) {
      this.sign = '-'
      this._dates = this._dates.reverse() as [Date, Date]
    }

    this.ms = this._parse((d) => d.getMilliseconds(), {
      get: (d) => d.getSeconds(),
      set: (d, v) => d.setSeconds(v),
      inc: () => 1000
    })

    this.s = this._parse((d) => d.getSeconds(), {
      get: (d) => d.getMinutes(),
      set: (d, v) => d.setMinutes(v),
      inc: () => 60
    })

    this.min = this._parse((d) => d.getMinutes(), {
      get: (d) => d.getHours(),
      set: (d, v) => d.setHours(v),
      inc: () => 60
    })

    this.h = this._parse((d) => d.getHours(), {
      get: (d) => d.getDate(),
      set: (d, v) => d.setDate(v),
      inc: () => 24
    })

    this.d = this._parse((d) => d.getDate(), {
      get: (d) => d.getMonth(),
      set: (d, v) => d.setMonth(v),
      inc: (d) => {
        const y = d.getFullYear()
        let isLeapYear = true
        if (y % 4) {
          isLeapYear = false
        } else if (y % 100) {
          isLeapYear = true
        } else if (y % 400) {
          isLeapYear = false
        }

        return [
          31, // Jan
          isLeapYear ? 29 : 28, // Feb
          31, // Mar
          30, // Apr
          31, // May
          30, // Jun
          31, // Jul
          31, // Aug
          30, // Sep
          31, // Oct
          30, // Nov
          31 // Dec
        ][d.getMonth()]
      }
    })

    this.w = Math.floor(this.d / 7)
    this.d = this.d % 7

    this.mo = this._parse((d) => d.getMonth(), {
      get: (d) => d.getFullYear(),
      set: (d, v) => d.setFullYear(v),
      inc: () => 12
    })

    this.y = this._parse((d) => d.getFullYear())
  }

  /**
   * To JSON-serializable OrderedDict
   */
  toOrderedDict (): [DurationUnit, number][] {
    return [
      ['ms', this.ms],
      ['s', this.s],
      ['min', this.min],
      ['h', this.h],
      ['d', this.d],
      ['w', this.w],
      ['mo', this.mo],
      ['y', this.y]
    ]
  }

  /**
   * To String
   *
   * Works with `${duration}` also
   */
  toString ({
    sign = true,
    granularity,
    maxUnit,
    smallest = 's',
    unit = {}
  }: IDurationOptions = {}) {
    const odict = this.toOrderedDict()
    const smallestIndex = odict.map(([k]) => k).indexOf(smallest)
    const filteredDict = odict.filter(([, v], i) => v && i >= smallestIndex)

    const str = filteredDict
      .slice(granularity ? filteredDict.length - granularity : 0)
      .reverse()
      .slice(0, maxUnit)
      .map(([k, v]) => `${v.toLocaleString()}${unit[k] || k}`)
      .join(' ')

    if (sign) {
      return this.sign + str
    }

    return str
  }

  private _parse (
    current: (d: Date) => number,
    upper?: {
      get: (d: Date) => number;
      set: (d: Date, v: number) => void;
      inc: (d: Date) => number;
    }
  ) {
    let a = current(this._dates[1]) - current(this._dates[0])

    if (upper) {
      while (a < 0) {
        upper.set(this._dates[1], upper.get(this._dates[1]) - 1)
        this._dates[1] = new Date(this._dates[1])

        a += upper.inc(this._dates[1])
      }
    }

    return a
  }
}

/**
 * Date adding functions
 */
export function addDate (d: Date): Record<DurationUnit, (n: number) => Date> {
  return {
    /**
     * Milliseconds
     */
    ms: (n) => {
      d.setMilliseconds(d.getMilliseconds() + n)
      return new Date(d)
    },
    /**
     * Seconds
     */
    s: (n) => {
      d.setSeconds(d.getSeconds() + n)
      return new Date(d)
    },
    /**
     * Minutes
     */
    min: (n) => {
      d.setMinutes(d.getMinutes() + n)
      return new Date(d)
    },
    /**
     * Hours
     */
    h: (n) => {
      d.setHours(d.getHours() + n)
      return new Date(d)
    },
    /**
     * Date
     */
    d: (n) => {
      d.setDate(d.getDate() + n)
      return new Date(d)
    },
    /**
     * Weeks
     */
    w: (n) => {
      d.setDate(d.getDate() + n * 7)
      return new Date(d)
    },
    /**
     * Months
     */
    mo: (n) => {
      d.setMonth(d.getMonth() + n)
      return new Date(d)
    },
    /**
     * Years
     */
    y: (n) => {
      d.setFullYear(d.getFullYear() + n)
      return new Date(d)
    }
  }
}

export default Duration
