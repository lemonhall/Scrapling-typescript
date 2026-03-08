import { parseHTML } from "linkedom";
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
    } else {
      this.#document = resolveDocument(input);
      this.#node = input;
    }

    this.url = options.url;
    this.adaptive = options.adaptive ?? false;
  }

  css(query: string): Selector[] {
    return Array.from(this.#node.querySelectorAll(query)).map(
      (element) => new Selector(element, { url: this.url, adaptive: this.adaptive }),
    );
  }

  xpath(query: string): Selector[] {
    const normalizedQuery = normalizeXPath(query);
    const nodes = evaluateXPathToNodes(normalizedQuery, this.#node);

    return nodes
      .filter((node): node is Element => isElementNode(node as Element))
      .map((element) => createSelector(element, this));
  }

  findByText(query: string, options: TextMatchOptions = {}): Selector | Selector[] | null {
    const matches = getSearchPool(this.#node)
      .map((element) => createSelector(element, this))
      .filter((selector) => matchesText(selector.text, query, options));

    if (options.firstMatch === false) {
      return matches;
    }

    return matches[0] ?? null;
  }

  findByRegex(pattern: RegExp, options: RegexMatchOptions = {}): Selector | Selector[] | null {
    const matches = getSearchPool(this.#node)
      .map((element) => createSelector(element, this))
      .filter((selector) => pattern.test(selector.text));

    if (options.firstMatch === false) {
      return matches;
    }

    return matches[0] ?? null;
  }

  get tag(): string | null {
    return isElementNode(this.#node) ? this.#node.tagName.toLowerCase() : null;
  }

  get text(): string {
    return collectDirectText(this.#node);
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
    return new TextHandler(this.text);
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

  hasClass(className: string): boolean {
    return isElementNode(this.#node) ? this.#node.classList.contains(className) : false;
  }

  toString(): string {
    return this.htmlContent;
  }
}
