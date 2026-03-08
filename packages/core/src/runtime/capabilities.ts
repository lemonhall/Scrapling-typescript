export type RuntimeTarget = "node" | "chrome-extension";

export type RuntimeCapability =
  | "html-parsing"
  | "css-selectors"
  | "http-fetch"
  | "node-fs"
  | "node-child-process"
  | "playwright-launch"
  | "chrome-tabs"
  | "chrome-storage"
  | "content-script-dom"
  | "proxy-configuration";

export interface RuntimeDescriptor {
  target: RuntimeTarget;
  capabilities: readonly RuntimeCapability[];
  constraints: readonly string[];
}

export function defineRuntimeDescriptor(descriptor: RuntimeDescriptor): Readonly<RuntimeDescriptor> {
  return Object.freeze({
    ...descriptor,
    capabilities: Object.freeze([...descriptor.capabilities]),
    constraints: Object.freeze([...descriptor.constraints]),
  });
}

export function hasCapability(
  descriptor: Pick<RuntimeDescriptor, "capabilities">,
  capability: RuntimeCapability,
): boolean {
  return descriptor.capabilities.includes(capability);
}
