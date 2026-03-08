interface TextRegexOptions {
  cleanMatch?: boolean;
  caseSensitive?: boolean;
  replaceEntities?: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePattern(pattern: RegExp | string, options: TextRegexOptions = {}): RegExp {
  if (typeof pattern === "string") {
    const flags = `${options.caseSensitive === false ? "gi" : "g"}`;
    return new RegExp(pattern, flags);
  }

  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}

export class TextHandlers extends Array<string> {
  constructor(values: Iterable<string | TextHandler> | number = []) {
    if (typeof values === "number") {
      super(values);
      return;
    }

    super();
    Object.setPrototypeOf(this, new.target.prototype);
    this.push(...Array.from(values, (value) => String(value)));
  }

  override slice(start?: number, end?: number): TextHandlers {
    return new TextHandlers(super.slice(start, end));
  }

  get(defaultValue?: string): string | undefined {
    return this[0] ?? defaultValue;
  }

  extract(): TextHandlers {
    return new TextHandlers(this);
  }

  getAll(): TextHandlers {
    return this.extract();
  }

  get_all(): TextHandlers {
    return this.getAll();
  }

  re(pattern: RegExp | string, options: TextRegexOptions = {}): TextHandlers {
    return new TextHandlers(this.flatMap((value) => Array.from(new TextHandler(value).re(pattern, options))));
  }

  reFirst(pattern: RegExp | string, defaultValue: string | null = null, options: TextRegexOptions = {}): string | null {
    return this.re(pattern, options)[0] ?? defaultValue;
  }

  re_first(pattern: RegExp | string, defaultValue: string | null = null, options: TextRegexOptions = {}): string | null {
    return this.reFirst(pattern, defaultValue, options);
  }
}

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

  strip(chars?: string): TextHandler {
    if (chars == null) {
      return new TextHandler(this.#value.trim());
    }

    const pattern = new RegExp(`^[${escapeRegExp(chars)}]+|[${escapeRegExp(chars)}]+$`, "g");
    return new TextHandler(this.#value.replace(pattern, ""));
  }

  upper(): TextHandler {
    return new TextHandler(this.#value.toUpperCase());
  }

  lower(): TextHandler {
    return new TextHandler(this.#value.toLowerCase());
  }

  replace(searchValue: RegExp | string, replaceValue: string): TextHandler {
    return new TextHandler(this.#value.replace(searchValue, replaceValue));
  }

  sort(reverse = false): TextHandler {
    const sorted = [...this.#value].sort();
    if (reverse) {
      sorted.reverse();
    }

    return new TextHandler(sorted.join(""));
  }

  clean(): TextHandler {
    return new TextHandler(this.#value.replace(/[\t\r\n]/g, " ").replace(/\s+/g, " ").trim());
  }

  get(defaultValue?: string): string {
    return this.#value ?? defaultValue ?? "";
  }

  getAll(): string {
    return this.#value;
  }

  get_all(): string {
    return this.getAll();
  }

  extract(): string {
    return this.getAll();
  }

  extract_first(defaultValue?: string): string {
    return this.get(defaultValue);
  }

  json<T>(): T {
    return JSON.parse(this.#value) as T;
  }

  regex(pattern: RegExp): RegExpMatchArray | null {
    return this.#value.match(pattern);
  }

  re(pattern: RegExp | string, options: TextRegexOptions = {}): TextHandlers {
    const source = compilePattern(pattern, options);
    const input = options.cleanMatch ? this.clean().toString() : this.#value;
    const matches = Array.from(input.matchAll(source)).flatMap((match) => {
      if (match.length > 2) {
        return match.slice(1);
      }

      if (match.length === 2) {
        return [match[1]];
      }

      return [match[0]];
    });

    return new TextHandlers(matches);
  }

  reFirst(pattern: RegExp | string, options: TextRegexOptions = {}): string | null {
    return this.re(pattern, options)[0] ?? null;
  }

  re_first(pattern: RegExp | string, options: TextRegexOptions = {}): string | null {
    return this.reFirst(pattern, options);
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

  search_values(query: string, options: { partial?: boolean; caseSensitive?: boolean } = {}): Array<Record<string, string>> {
    return this.searchValues(query, options);
  }

  get jsonString(): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(this.#values));
  }

  get json_string(): Uint8Array {
    return this.jsonString;
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
