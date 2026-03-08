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
  }

  get(name: string): string | undefined {
    return this.#values[name];
  }

  json<T>(name: string): T {
    const value = this.get(name);
    if (value == null) {
      throw new Error(`Attribute not found: ${name}`);
    }

    return JSON.parse(value) as T;
  }

  searchValues(query: string, options: { caseSensitive?: boolean } = {}): string[] {
    const expected = options.caseSensitive ? query : query.toLowerCase();

    return Object.entries(this.#values)
      .filter(([, value]) => {
        if (options.caseSensitive) {
          return value.includes(query);
        }

        return value.toLowerCase().includes(expected);
      })
      .map(([key]) => key);
  }

  toObject(): Readonly<Record<string, string>> {
    return this.#values;
  }
}

