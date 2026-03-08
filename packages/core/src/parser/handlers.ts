export class TextHandler {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  toString(): string {
    return this.#value;
  }

  valueOf(): string {
    return this.#value;
  }

  json<T>(): T {
    return JSON.parse(this.#value) as T;
  }

  regex(pattern: RegExp): RegExpMatchArray | null {
    return this.#value.match(pattern);
  }

  re(pattern: RegExp | string): string[] {
    const source = typeof pattern === "string" ? new RegExp(pattern, "g") : new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);

    return Array.from(this.#value.matchAll(source)).map((match) => match[1] ?? match[0]);
  }

  reFirst(pattern: RegExp | string): string | null {
    return this.re(pattern)[0] ?? null;
  }

  contains(needle: string, options: { caseSensitive?: boolean } = {}): boolean {
    if (options.caseSensitive) {
      return this.#value.includes(needle);
    }

    return this.#value.toLowerCase().includes(needle.toLowerCase());
  }
}

export class AttributesHandler {
  readonly #values: Readonly<Record<string, string>>;

  constructor(values: Record<string, string>) {
    this.#values = Object.freeze({ ...values });

    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (typeof property === "string" && !(property in target)) {
          const value = target.#values[property];
          return value == null ? undefined : new TextHandler(value);
        }

        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
      has: (target, property) => {
        if (typeof property === "string" && property in target.#values) {
          return true;
        }

        return Reflect.has(target, property);
      },
      ownKeys: (target) => Reflect.ownKeys(target.#values),
      getOwnPropertyDescriptor: (target, property) => {
        if (typeof property === "string" && property in target.#values) {
          return {
            configurable: true,
            enumerable: true,
            writable: false,
            value: new TextHandler(target.#values[property]),
          };
        }

        return Reflect.getOwnPropertyDescriptor(target, property);
      },
      set: () => {
        throw new TypeError("AttributesHandler is read-only");
      },
      deleteProperty: () => {
        throw new TypeError("AttributesHandler is read-only");
      },
    });
  }

  get(name: string): string | undefined {
    return this.#values[name];
  }

  has(name: string): boolean {
    return name in this.#values;
  }

  keys(): string[] {
    return Object.keys(this.#values);
  }

  values(): string[] {
    return Object.values(this.#values);
  }

  items(): Array<[string, string]> {
    return Object.entries(this.#values);
  }

  entries(): Array<[string, string]> {
    return this.items();
  }

  json<T>(name: string): T {
    const value = this.get(name);
    if (value == null) {
      throw new Error(`Attribute not found: ${name}`);
    }

    return JSON.parse(value) as T;
  }

  searchValues(query: string, options: { partial?: boolean; caseSensitive?: boolean } = {}): Array<Record<string, string>> {
    const expected = options.caseSensitive ? query : query.toLowerCase();

    return Object.entries(this.#values)
      .filter(([, value]) => {
        if (options.caseSensitive) {
          return options.partial ? value.includes(query) : value === query;
        }

        const normalized = value.toLowerCase();
        return options.partial ? normalized.includes(expected) : normalized === expected;
      })
      .map(([key, value]) => ({ [key]: value }));
  }

  get jsonString(): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(this.#values));
  }

  toObject(): Readonly<Record<string, string>> {
    return this.#values;
  }

  toString(): string {
    return JSON.stringify(this.#values);
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.items()[Symbol.iterator]();
  }
}
