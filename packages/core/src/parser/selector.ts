import { parseHTML } from "linkedom";
import { parse as parseCssSelector } from "css-what";
import fontoxpath from "fontoxpath";

import { AttributesHandler, TextHandler } from "./handlers.js";

const { evaluateXPathToNodes } = fontoxpath;

type SelectorRoot = Document | Element;

interface TextMatchOptions {
  partial?: boolean;
  firstMatch?: boolean;
  caseSensitive?: boolean;
}

interface RegexMatchOptions {
  firstMatch?: boolean;
}

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

  override filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: unknown): SelectorCollection<S>;
  override filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): SelectorCollection<T>;
  override filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): SelectorCollection<T> {
    return new SelectorCollection(Array.from(this).filter(predicate as (value: T, index: number, array: T[]) => unknown, thisArg));
  }
}

export interface SelectorOptions {
  url?: string;
  adaptive?: boolean;
}

function isElementNode(node: SelectorRoot): node is Element {
  return typeof (node as Element).tagName === "string";
}

function normalizeWhitespace(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function createDocumentFromHtml(html: string): Document {
  const { document } = parseHTML(html);
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
  return new Selector(node, { url: source.url, adaptive: source.adaptive });
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
  readonly #document: Document;
  readonly #node: SelectorRoot;

  constructor(input: string | SelectorRoot, options: SelectorOptions = {}) {
    if (typeof input === "string") {
      const document = createDocumentFromHtml(input);
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
  }

  css(query: string): SelectorCollection<Selector | TextSelection> {
    const textMode = query.endsWith("::text");
    const normalizedQuery = textMode ? query.slice(0, -6) : query;
    validateCssQuery(normalizedQuery);
    const matches = Array.from(this.#node.querySelectorAll(normalizedQuery));

    if (textMode) {
      return createCollection(matches.map((element) => new TextSelection(element.textContent ?? "")));
    }

    return createCollection(
      matches.map((element) => new Selector(element, { url: this.url, adaptive: this.adaptive })),
    );
  }

  xpath(query: string): SelectorCollection<Selector> {
    validateXPathQuery(query);
    const normalizedQuery = normalizeXPath(query);
    const nodes = evaluateXPathToNodes(normalizedQuery, this.#node);

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

  findByRegex(pattern: RegExp, options: RegexMatchOptions = {}): Selector | Selector[] | null {
    const matches = getSearchPool(this.#node)
      .map((element) => createSelector(element, this))
      .filter((selector) => pattern.test(String(selector.text)));

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

  get generateFullXPathSelector(): string {
    if (!isElementNode(this.#node)) {
      return "/html";
    }

    const chain = [this.#node, ...this.ancestors.map((selector) => selector.#node).filter(isElementNode)].reverse();

    return chain
      .map((element) => `/${element.tagName.toLowerCase()}[${getNodeIndex(element)}]`)
      .join("");
  }

  get htmlContent(): string {
    if (isElementNode(this.#node)) {
      return this.#node.outerHTML;
    }

    return this.#document.documentElement?.outerHTML ?? "";
  }

  getAllText(): string {
    if (isElementNode(this.#node)) {
      return normalizeWhitespace(this.#node.textContent);
    }

    return normalizeWhitespace(this.#document.documentElement?.textContent);
  }

  get_all_text(): string {
    return this.getAllText();
  }

  hasClass(className: string): boolean {
    return isElementNode(this.#node) ? this.#node.classList.contains(className) : false;
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
