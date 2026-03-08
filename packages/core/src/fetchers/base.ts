import type { AdaptiveStorage } from "../parser/adaptive-storage.js";
import type { SelectorOptions } from "../parser/selector.js";

type FetcherConfigKey =
  | "hugeTree"
  | "adaptive"
  | "adaptiveStorage"
  | "keepComments"
  | "keepCdata"
  | "adaptiveDomain";

export interface FetcherConfigurationInput {
  hugeTree?: boolean;
  huge_tree?: boolean;
  adaptive?: boolean;
  adaptiveStorage?: AdaptiveStorage;
  adaptive_storage?: AdaptiveStorage;
  keepComments?: boolean;
  keep_comments?: boolean;
  keepCdata?: boolean;
  keep_cdata?: boolean;
  adaptiveDomain?: string;
  adaptive_domain?: string;
}

export interface FetcherDisplayConfig {
  huge_tree: boolean;
  adaptive: boolean;
  adaptive_storage?: AdaptiveStorage;
  keep_comments: boolean;
  keep_cdata: boolean;
  adaptive_domain: string;
}

function normalizeConfigKey(key: string): FetcherConfigKey | null {
  const normalized = key.trim();

  switch (normalized) {
    case "hugeTree":
    case "huge_tree":
      return "hugeTree";
    case "adaptive":
      return "adaptive";
    case "adaptiveStorage":
    case "adaptive_storage":
      return "adaptiveStorage";
    case "keepComments":
    case "keep_comments":
      return "keepComments";
    case "keepCdata":
    case "keep_cdata":
      return "keepCdata";
    case "adaptiveDomain":
    case "adaptive_domain":
      return "adaptiveDomain";
    default:
      return null;
  }
}

export class BaseFetcher {
  static hugeTree = true;
  static adaptive = false;
  static adaptiveStorage: AdaptiveStorage | undefined;
  static keepComments = false;
  static keepCdata = false;
  static adaptiveDomain = "";

  static displayConfig(): FetcherDisplayConfig {
    return {
      huge_tree: this.hugeTree,
      adaptive: this.adaptive,
      adaptive_storage: this.adaptiveStorage,
      keep_comments: this.keepComments,
      keep_cdata: this.keepCdata,
      adaptive_domain: this.adaptiveDomain,
    };
  }

  static configure(options: FetcherConfigurationInput): void {
    const entries = Object.entries(options);
    if (entries.length === 0) {
      throw new Error("You must pass a keyword to configure, current keywords: huge_tree, adaptive, adaptive_storage, keep_comments, keep_cdata, adaptive_domain");
    }

    for (const [key, value] of entries) {
      const normalizedKey = normalizeConfigKey(key);

      if (normalizedKey == null) {
        throw new Error(`Unknown parser argument: \"${key}\"`);
      }

      (this as typeof BaseFetcher)[normalizedKey] = value as never;
    }
  }

  protected static generateSelectorOptions(options: SelectorOptions & FetcherConfigurationInput = {}): SelectorOptions {
    return {
      adaptive: options.adaptive ?? this.adaptive,
      adaptiveStorage: options.adaptiveStorage ?? options.adaptive_storage ?? this.adaptiveStorage,
      keepComments: options.keepComments ?? options.keep_comments ?? this.keepComments,
      keepCdata: options.keepCdata ?? options.keep_cdata ?? this.keepCdata,
      url: options.adaptiveDomain ?? options.adaptive_domain ?? this.adaptiveDomain,
    };
  }
}
