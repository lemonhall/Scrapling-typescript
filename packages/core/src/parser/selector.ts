import { parseHTML } from "linkedom";

type SelectorRoot = Document | Element;

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
    return node.ownerDocument ?? createDocumentFromHtml(node.outerHTML);
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

    const pairs = this.#node.getAttributeNames().map((name) => [name, this.#node.getAttribute(name) ?? ""]);
    return Object.freeze(Object.fromEntries(pairs));
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

