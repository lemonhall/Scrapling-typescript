import { parseHTML } from "linkedom";
import { parse as parseCssSelector } from "css-what";
import fontoxpath from "fontoxpath";

import { AttributesHandler, TextHandler, TextHandlers } from "./handlers.js";

const { evaluateXPathToNodes } = fontoxpath;

type SelectorRoot = Document | Element;

interface TextMatchOptions {
  partial?: boolean;
  firstMatch?: boolean;
  caseSensitive?: boolean;
}

interface RegexMatchOptions {
  firstMatch?: boolean;
  caseSensitive?: boolean;
}

interface GetAllTextOptions {
  separator?: string;
  strip?: boolean;
  ignoreTags?: string[];
  ignore_tags?: string[];
  validValues?: boolean;
  valid_values?: boolean;
}

type FindArg = string | Iterable<string> | RegExp | ((element: Selector) => boolean) | Record<string, string>;

class TextSelection {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  get(): TextHandler {
    return new TextHandler(this.#value);
  }

  toString(): string {
    return this.#value;
  }
}

class SelectorCollection<T> extends Array<T> {
  constructor(items: Iterable<T> | number = []) {
    if (typeof items === "number") {
      super(items);
      return;
    }

    super();
    Object.setPrototypeOf(this, new.target.prototype);
    this.push(...items);
  }

  get first(): T | undefined {
    return this[0];
  }

  get last(): T | undefined {
    return this.length > 0 ? this[this.length - 1] : undefined;
  }

  search(predicate: (item: T) => boolean): T | undefined {
    for (const item of this) {
      if (predicate(item)) {
        return item;
      }
    }

    return undefined;
  }

  get(defaultValue?: TextHandler): TextHandler | undefined {
    const first = this.first;
    if (first == null) {
      return defaultValue;
    }

    if (typeof first === "object" && first != null && "get" in first && typeof first.get === "function") {
      const value = first.get();
      return value instanceof TextHandler ? value : new TextHandler(String(value));
    }

    return new TextHandler(String(first));
  }

  getall(): TextHandlers {
    return new TextHandlers(this.map((item) => {
      if (typeof item === "object" && item != null && "get" in item && typeof item.get === "function") {
        return String(item.get());
      }

      return String(item);
    }));
  }

  getAll(): TextHandlers {
    return this.getall();
  }

  extract(): TextHandlers {
    return this.getall();
  }

  extract_first(defaultValue?: TextHandler): TextHandler | undefined {
    return this.get(defaultValue);
  }

  override filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: unknown): SelectorCollection<S>;
  override filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): SelectorCollection<T>;
  override filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): SelectorCollection<T> {
    return new SelectorCollection(Array.from(this).filter(predicate as (value: T, index: number, array: T[]) => unknown, thisArg));
  }
}

export interface SelectorOptions {
  url?: string;
  adaptive?: boolean;
  keepComments?: boolean;
  keep_comments?: boolean;
  keepCdata?: boolean;
  keep_cdata?: boolean;
}

function isElementNode(node: SelectorRoot): node is Element {
  return typeof (node as Element).tagName === "string";
}

function normalizeWhitespace(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function shouldKeepComments(options: SelectorOptions): boolean {
  return options.keepComments ?? options.keep_comments ?? false;
}

function shouldKeepCdata(options: SelectorOptions): boolean {
  return options.keepCdata ?? options.keep_cdata ?? false;
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === 8;
}

function isCdataComment(node: Comment): boolean {
  const content = node.textContent ?? "";
  return content.startsWith("[CDATA[") && content.endsWith("]]");
}

function pruneSerializedNodes(node: Node, options: SelectorOptions): void {
  for (const child of Array.from(node.childNodes)) {
    if (isCommentNode(child)) {
      const keepNode = isCdataComment(child) ? shouldKeepCdata(options) : shouldKeepComments(options);
      if (!keepNode) {
        child.remove();
        continue;
      }
    }

    pruneSerializedNodes(child, options);
  }
}

function collectAllTextSegments(node: Node, options: GetAllTextOptions = {}): string[] {
  if (node.nodeType === 3) {
    const raw = node.textContent ?? "";
    const value = options.strip ? raw.trim() : raw;

    if ((options.validValues ?? options.valid_values ?? true) && value.trim().length === 0) {
      return [];
    }

    return [value];
  }

  if (node.nodeType !== 1 && node.nodeType !== 9) {
    return [];
  }

  if (node.nodeType === 1) {
    const ignored = new Set([...(options.ignoreTags ?? []), ...(options.ignore_tags ?? [])].map((tag) => tag.toLowerCase()));
    const element = node as Element;

    if (ignored.has(element.tagName.toLowerCase())) {
      return [];
    }
  }

  return Array.from(node.childNodes).flatMap((child) => collectAllTextSegments(child, options));
}

function createDocumentFromHtml(html: string, options: SelectorOptions = {}): Document {
  const { document } = parseHTML(html);
  pruneSerializedNodes(document, options);
  return document;
}

function resolveDocument(node: SelectorRoot): Document {
  if (isElementNode(node)) {
    const ownerDocument = node.ownerDocument;
    return ownerDocument ?? createDocumentFromHtml((node as Element).outerHTML);
  }

  return node;
}

function collectDirectText(node: SelectorRoot): string {
  if (!("childNodes" in node)) {
    return "";
  }

  const text = Array.from(node.childNodes)
    .filter((child) => child.nodeType === 3)
    .map((child) => child.textContent ?? "")
    .join(" ");

  return normalizeWhitespace(text);
}

function createSelector(node: Element, source: Selector): Selector {
  return new Selector(node, {
    url: source.url,
    adaptive: source.adaptive,
    keepComments: source.keepComments,
    keepCdata: source.keepCdata,
  });
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value != null && !Array.isArray(value) && !(value instanceof RegExp);
}

function isStringIterable(value: unknown): value is Iterable<string> {
  if (typeof value === "string" || value == null || typeof value !== "object") {
    return false;
  }

  if (!(Symbol.iterator in value)) {
    return false;
  }

  return Array.from(value as Iterable<unknown>).every((item) => typeof item === "string");
}

function normalizeFindAttributeName(name: string): string {
  return name === "class_" ? "class" : name;
}

function getSearchPool(node: SelectorRoot): Element[] {
  if (isElementNode(node)) {
    return [node, ...Array.from(node.querySelectorAll("*"))];
  }

  return Array.from(node.querySelectorAll("*"));
}

function matchesText(value: string, query: string, options: TextMatchOptions): boolean {
  const haystack = options.caseSensitive ? value : value.toLowerCase();
  const needle = options.caseSensitive ? query : query.toLowerCase();

  return options.partial ? haystack.includes(needle) : haystack === needle;
}

function normalizeXPath(query: string): string {
  return query.replace(
    /(^|\.{0,1}\/{1,2}|::)([A-Za-z_][A-Za-z0-9_-]*)(?=(\[|\/{1,2}|$))/g,
    (_, prefix: string, name: string) => `${prefix}*[local-name()="${name}"]`,
  );
}

function getNodeIndex(element: Element): number {
  if (element.parentElement == null) {
    return 1;
  }

  const siblings = Array.from(element.parentElement.children).filter(
    (candidate) => candidate.tagName === element.tagName,
  );

  return siblings.indexOf(element) + 1;
}

function escapeXPathLiteral(value: string): string {
  return value.replace(/"/g, '\\"');
}

function getClassSignature(element: Element): string {
  return Array.from(element.classList).sort().join(" ");
}

function validateXPathQuery(query: string): void {
  const trimmed = query.trim();
  if (trimmed.length === 0 || /^[0-9]/.test(trimmed)) {
    throw new TypeError(`Invalid XPath selector: ${query}`);
  }
}

function validateCssQuery(query: string): void {
  const trimmed = query.trim();
  if (trimmed.length === 0 || /^[0-9]/.test(trimmed)) {
    throw new TypeError(`Invalid CSS selector: ${query}`);
  }

  parseCssSelector(trimmed);
}

function createCollection<T>(items: T[]): SelectorCollection<T> {
  return new SelectorCollection(items);
}

export class Selector {
  readonly url?: string;
  readonly adaptive: boolean;
  readonly keepComments: boolean;
  readonly keepCdata: boolean;
  readonly #document: Document;
  readonly #node: SelectorRoot;

  constructor(input: string | SelectorRoot, options: SelectorOptions = {}) {
    if (typeof input === "string") {
      const document = createDocumentFromHtml(input, options);
      this.#document = document;
      this.#node = document;
    } else if (input != null && typeof input === "object" && "querySelectorAll" in input) {
      this.#document = resolveDocument(input);
      this.#node = input;
    } else {
      throw new TypeError("Selector requires an HTML string, Document, or Element input");
    }

    this.url = options.url;
    this.adaptive = options.adaptive ?? false;
    this.keepComments = shouldKeepComments(options);
    this.keepCdata = shouldKeepCdata(options);
  }

  css(query: string): SelectorCollection<Selector | TextSelection> {
    const textMode = query.endsWith("::text");
    const attrMatch = query.match(/::attr\(([^)]+)\)$/);
    const attrMode = attrMatch != null;
    const normalizedQuery = textMode
      ? query.slice(0, -6)
      : attrMode
        ? query.slice(0, -(attrMatch?.[0].length ?? 0))
        : query;
    validateCssQuery(normalizedQuery);
    const matches = Array.from(this.#node.querySelectorAll(normalizedQuery));

    if (textMode) {
      return createCollection(matches.map((element) => new TextSelection(element.textContent ?? "")));
    }

    if (attrMode) {
      const attrName = attrMatch?.[1].trim() ?? "";
      return createCollection(matches.map((element) => new TextSelection(element.getAttribute(attrName) ?? "")));
    }

    return createCollection(
      matches.map((element) => new Selector(element, { url: this.url, adaptive: this.adaptive })),
    );
  }

  xpath(query: string, variables: Record<string, unknown> = {}): SelectorCollection<Selector> {
    validateXPathQuery(query);
    const normalizedQuery = normalizeXPath(query);
    const nodes = evaluateXPathToNodes(normalizedQuery, this.#node, undefined, variables);

    return createCollection(
      nodes
        .filter((node): node is Element => isElementNode(node as Element))
        .map((element) => createSelector(element, this)),
    );
  }

  findByText(query: string, options: TextMatchOptions = {}): Selector | Selector[] | null {
    const matches = getSearchPool(this.#node)
      .map((element) => createSelector(element, this))
      .filter((selector) => matchesText(String(selector.text), query, options));

    if (options.firstMatch === false) {
      return matches;
    }

    return matches[0] ?? null;
  }

  findByRegex(pattern: RegExp | string, options: RegexMatchOptions = {}): Selector | Selector[] | null {
    const regex = typeof pattern === "string"
      ? new RegExp(pattern, options.caseSensitive === false ? "i" : "")
      : pattern;

    const matches = getSearchPool(this.#node)
      .map((element) => createSelector(element, this))
      .filter((selector) => regex.test(String(selector.text)));

    if (options.firstMatch === false) {
      return matches;
    }

    return matches[0] ?? null;
  }

  get tag(): string | null {
    return isElementNode(this.#node) ? this.#node.tagName.toLowerCase() : null;
  }

  get text(): TextHandler {
    return new TextHandler(collectDirectText(this.#node));
  }

  get attributes(): Readonly<Record<string, string>> {
    if (!isElementNode(this.#node)) {
      return Object.freeze({});
    }

    const element = this.#node;
    const pairs = element.getAttributeNames().map((name) => [name, element.getAttribute(name) ?? ""]);
    return Object.freeze(Object.fromEntries(pairs));
  }

  get attrib(): AttributesHandler {
    return new AttributesHandler({ ...this.attributes });
  }

  get textHandler(): TextHandler {
    return this.text;
  }

  get parent(): Selector | null {
    if (!isElementNode(this.#node) || this.#node.parentElement == null) {
      return null;
    }

    return createSelector(this.#node.parentElement, this);
  }

  get children(): Selector[] {
    if (!isElementNode(this.#node)) {
      return [];
    }

    return Array.from(this.#node.children).map((element) => createSelector(element, this));
  }

  get next(): Selector | null {
    if (!isElementNode(this.#node) || this.#node.nextElementSibling == null) {
      return null;
    }

    return createSelector(this.#node.nextElementSibling, this);
  }

  get previous(): Selector | null {
    if (!isElementNode(this.#node) || this.#node.previousElementSibling == null) {
      return null;
    }

    return createSelector(this.#node.previousElementSibling, this);
  }

  get siblings(): SelectorCollection<Selector> {
    if (!isElementNode(this.#node) || this.#node.parentElement == null) {
      return createCollection([]);
    }

    return createCollection(
      Array.from(this.#node.parentElement.children)
        .filter((element) => element !== this.#node)
        .map((element) => createSelector(element, this)),
    );
  }

  get ancestors(): Selector[] {
    if (!isElementNode(this.#node)) {
      return [];
    }

    const ancestors: Selector[] = [];
    let current = this.#node.parentElement;

    while (current != null) {
      ancestors.push(createSelector(current, this));
      current = current.parentElement;
    }

    return ancestors;
  }

  get generateCssSelector(): string {
    if (!isElementNode(this.#node)) {
      return "html";
    }

    const id = this.#node.getAttribute("id");
    if (id) {
      return `#${id}`;
    }

    if (this.#node.classList.length > 0) {
      return `.${Array.from(this.#node.classList).join(".")}`;
    }

    return this.#node.tagName.toLowerCase();
  }

  get generate_css_selector(): string {
    return this.generateCssSelector;
  }

  get generateFullCssSelector(): string {
    if (!isElementNode(this.#node)) {
      return "html";
    }

    const chain = [this.#node, ...this.ancestors.map((selector) => selector.#node).filter(isElementNode)].reverse();

    return chain
      .map((element) => {
        const id = element.getAttribute("id");
        if (id) {
          return `#${id}`;
        }

        if (element.classList.length > 0) {
          return `${element.tagName.toLowerCase()}.${Array.from(element.classList).join(".")}`;
        }

        return element.tagName.toLowerCase();
      })
      .join(" > ");
  }

  get generate_full_css_selector(): string {
    return this.generateFullCssSelector;
  }

  get generateXPathSelector(): string {
    if (!isElementNode(this.#node)) {
      return "/html";
    }

    const id = this.#node.getAttribute("id");
    if (id) {
      return `//*[@id="${escapeXPathLiteral(id)}"]`;
    }

    const className = this.#node.getAttribute("class");
    if (className) {
      return `//*[contains(@class, "${escapeXPathLiteral(className.split(" ")[0])}")]`;
    }

    return `//${this.#node.tagName.toLowerCase()}`;
  }

  get generate_xpath_selector(): string {
    return this.generateXPathSelector;
  }

  get generateFullXPathSelector(): string {
    if (!isElementNode(this.#node)) {
      return "/html";
    }

    const chain = [this.#node, ...this.ancestors.map((selector) => selector.#node).filter(isElementNode)].reverse();

    return chain
      .map((element) => `/${element.tagName.toLowerCase()}[${getNodeIndex(element)}]`)
      .join("");
  }

  get generate_full_xpath_selector(): string {
    return this.generateFullXPathSelector;
  }

  get htmlContent(): string {
    if (isElementNode(this.#node)) {
      return this.#node.outerHTML;
    }

    return this.#document.documentElement?.outerHTML ?? "";
  }

  get body(): string {
    return this.#document.body?.outerHTML ?? "";
  }

  get path(): string {
    return this.generateFullXPathSelector;
  }

  prettify(): string {
    return this.htmlContent;
  }

  getAllText(options: GetAllTextOptions = {}): string {
    const root = isElementNode(this.#node) ? this.#node : (this.#document.documentElement ?? this.#document);
    const separator = options.separator ?? " ";
    const values = collectAllTextSegments(root, options);
    const text = values.join(separator);

    return options.strip ? text.trim() : normalizeWhitespace(text);
  }

  get_all_text(options: GetAllTextOptions = {}): string {
    return this.getAllText(options);
  }

  hasClass(className: string): boolean {
    return isElementNode(this.#node) ? this.#node.classList.contains(className) : false;
  }

  has_class(className: string): boolean {
    return this.hasClass(className);
  }

  get(): TextHandler {
    return new TextHandler(this.getAllText());
  }

  re(pattern: RegExp | string): string[] {
    return this.get().re(pattern);
  }

  reFirst(pattern: RegExp | string): string | null {
    return this.get().reFirst(pattern);
  }

  re_first(pattern: RegExp | string): string | null {
    return this.reFirst(pattern);
  }

  urljoin(input: string): string {
    if (this.url == null) {
      return input;
    }

    return new URL(input, this.url).toString();
  }

  findSimilar(): SelectorCollection<Selector> {
    if (!isElementNode(this.#node)) {
      return createCollection([]);
    }

    const tagName = this.#node.tagName.toLowerCase();
    const classSignature = getClassSignature(this.#node);
    const candidates = Array.from(this.#document.querySelectorAll(tagName)).filter((element) => {
      if (element === this.#node) {
        return false;
      }

      return getClassSignature(element) === classSignature;
    });

    return createCollection(candidates.map((element) => createSelector(element, this)));
  }

  find_similar(): SelectorCollection<Selector> {
    return this.findSimilar();
  }

  find_by_text(query: string, options: TextMatchOptions = {}): Selector | Selector[] | null {
    return this.findByText(query, options);
  }

  find_by_regex(pattern: RegExp | string, options: RegexMatchOptions = {}): Selector | Selector[] | null {
    return this.findByRegex(pattern, options);
  }

  find_all(...args: FindArg[]): SelectorCollection<Selector> {
    if (args.length === 0) {
      throw new TypeError("You have to pass something to search with, like tag name(s), tag attributes, or both.");
    }

    const tags = new Set<string>();
    const attributes: Record<string, string> = {};
    const patterns: RegExp[] = [];
    const predicates: Array<(element: Selector) => boolean> = [];

    for (const arg of args) {
      if (typeof arg === "string") {
        tags.add(arg);
        continue;
      }

      if (arg instanceof RegExp) {
        patterns.push(arg);
        continue;
      }

      if (typeof arg === "function") {
        predicates.push(arg);
        continue;
      }

      if (isStringIterable(arg)) {
        for (const tag of arg) {
          tags.add(tag);
        }
        continue;
      }

      if (isStringRecord(arg)) {
        for (const [key, value] of Object.entries(arg)) {
          attributes[normalizeFindAttributeName(key)] = value;
        }
      }
    }

    const selectors: string[] = [];
    const activeTags = tags.size > 0 ? Array.from(tags) : ["*"];

    for (const tag of activeTags) {
      let selector = tag;
      for (const [key, value] of Object.entries(attributes)) {
        selector += `[${key}="${value.replace(/"/g, '\\"')}"]`;
      }
      selectors.push(selector);
    }

    let results = createCollection(
      Array.from(new Set(selectors.flatMap((selector) => this.css(selector))))
        .filter((item): item is Selector => item instanceof Selector),
    );

    if (selectors.length === 0 || (selectors.length === 1 && selectors[0] === "*")) {
      results = createCollection(
        Array.from(this.#node.querySelectorAll("*")).map((element) => createSelector(element, this)),
      );
    }

    for (const pattern of patterns) {
      results = results.filter((element) => element.text.re(pattern).length > 0);
    }

    for (const predicate of predicates) {
      results = results.filter(predicate);
    }

    return results;
  }

  find(...args: FindArg[]): Selector | null {
    return this.find_all(...args).first ?? null;
  }

  findAncestor(predicate: (node: Selector) => boolean): Selector | null {
    for (const ancestor of this.ancestors) {
      if (predicate(ancestor)) {
        return ancestor;
      }
    }

    return null;
  }

  find_ancestor(predicate: (node: Selector) => boolean): Selector | null {
    return this.findAncestor(predicate);
  }

  toString(): string {
    return this.htmlContent;
  }
}
