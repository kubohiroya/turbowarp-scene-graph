export type SceneGraphScalar = string | number | boolean | null;

export interface SceneGraphOptions {
  layer: string;
  mode: string;
}

export interface SceneGraphNode {
  type?: string;
  id?: string;
  class?: string | readonly string[];
  classes?: readonly string[];
  data?: Record<string, SceneGraphScalar>;
  attributes?: Record<string, SceneGraphScalar>;
  children?: readonly SceneGraphNode[];
}

export interface SceneGraphDocument {
  formatVersion: 1;
  options?: Partial<SceneGraphOptions>;
  root: SceneGraphNode;
}

export interface NormalizedSceneGraphDocument {
  formatVersion: 1;
  options: SceneGraphOptions;
  root: SceneGraphNode;
}

export type AFrameSceneGraphCall =
  | {
      extension: 'turbowarp-aframe';
      opcode: 'createScene';
      args: {LAYER: string; MODE: string};
    }
  | {
      extension: 'turbowarp-aframe';
      opcode: 'createNode';
      args: {TYPE: string; ID: string; PARENT: string};
    }
  | {
      extension: 'turbowarp-aframe';
      opcode: 'addClass';
      args: {CLASS: string; SELECTOR: string};
    }
  | {
      extension: 'turbowarp-aframe';
      opcode: 'setData';
      args: {SELECTOR: string; KEY: string; VALUE: string};
    }
  | {
      extension: 'turbowarp-aframe';
      opcode: 'setAttribute';
      args: {SELECTOR: string; NAME: string; VALUE: string};
    };

const defaultOptions: SceneGraphOptions = Object.freeze({layer: 'above-stage', mode: '3d'});
const rootId = 'scene';
const nodeKeys = new Set(['attributes', 'children', 'class', 'classes', 'data', 'id', 'type']);
const documentKeys = new Set(['formatVersion', 'options', 'root']);
const optionKeys = new Set(['layer', 'mode']);

export function validateSceneGraphDocument(value: unknown): asserts value is SceneGraphDocument {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Scene graph document must be an object.');
  }
  const document = value as Record<string, unknown>;
  for (const key of Object.keys(document)) {
    if (!documentKeys.has(key)) throw new TypeError(`Scene graph document ${key} is not supported.`);
  }
  if (document['formatVersion'] !== 1) {
    throw new TypeError('Scene graph document formatVersion must be 1.');
  }
  validateSceneGraphOptions(document['options']);
  validateSceneGraphNode(document['root'], 'root');
}

export function validateSceneGraphNode(value: unknown, path = 'node'): asserts value is SceneGraphNode {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`Scene graph ${path} must be an object.`);
  }
  const node = value as Record<string, unknown>;
  for (const key of Object.keys(node)) {
    if (!nodeKeys.has(key)) throw new TypeError(`Scene graph ${path}.${key} is not supported.`);
  }
  validateOptionalString(node['type'], `${path}.type`);
  validateOptionalString(node['id'], `${path}.id`);
  validateClassList(node['class'], `${path}.class`);
  validateOptionalStringArray(node['classes'], `${path}.classes`);
  validateRecord(node['data'], `${path}.data`);
  validateRecord(node['attributes'], `${path}.attributes`);
  if (node['children'] === undefined) return;
  if (!Array.isArray(node['children'])) {
    throw new TypeError(`Scene graph ${path}.children must be an array.`);
  }
  node['children'].forEach((child, index) => validateSceneGraphNode(child, `${path}.children[${index}]`));
}

export function normalizeSceneGraphDocument(
  document: SceneGraphDocument
): NormalizedSceneGraphDocument {
  validateSceneGraphDocument(document);
  const root = cloneNode(document.root);
  root.id = rootId;
  root.children = (root.children ?? []).map((child, index) => normalizeChildNode(child, rootId, index));
  assertUniqueIds(root);
  return Object.freeze({
    formatVersion: 1,
    options: Object.freeze({
      layer: document.options?.layer ?? defaultOptions.layer,
      mode: document.options?.mode ?? defaultOptions.mode
    }),
    root: deepFreeze(root)
  });
}

export function createAFrameSceneGraphPlan(document: SceneGraphDocument): AFrameSceneGraphCall[] {
  const normalized = normalizeSceneGraphDocument(document);
  const calls: AFrameSceneGraphCall[] = [
    {
      extension: 'turbowarp-aframe',
      opcode: 'createScene',
      args: {LAYER: normalized.options.layer, MODE: normalized.options.mode}
    }
  ];
  for (const child of normalized.root.children ?? []) appendNodeCalls(calls, child, rootId);
  return deepFreeze(calls);
}

function validateSceneGraphOptions(value: unknown): void {
  if (value === undefined) return;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Scene graph document options must be an object.');
  }
  const options = value as Record<string, unknown>;
  for (const key of Object.keys(options)) {
    if (!optionKeys.has(key)) throw new TypeError(`Scene graph document options.${key} is not supported.`);
  }
  validateOptionalString(options['layer'], 'options.layer');
  validateOptionalString(options['mode'], 'options.mode');
}

function appendNodeCalls(calls: AFrameSceneGraphCall[], node: SceneGraphNode, parentId: string): void {
  const id = normalizeId(node.id ?? '');
  if (id.length === 0) throw new TypeError('Normalized scene graph nodes must have ids before planning.');
  const selector = `#${id}`;
  calls.push({
    extension: 'turbowarp-aframe',
    opcode: 'createNode',
    args: {TYPE: node.type ?? 'group', ID: id, PARENT: `#${parentId}`}
  });
  for (const className of classTokens(node)) {
    calls.push({extension: 'turbowarp-aframe', opcode: 'addClass', args: {CLASS: className, SELECTOR: selector}});
  }
  for (const [key, value] of Object.entries(node.data ?? {})) {
    calls.push({extension: 'turbowarp-aframe', opcode: 'setData', args: {SELECTOR: selector, KEY: key, VALUE: String(value)}});
  }
  for (const [name, value] of Object.entries(node.attributes ?? {})) {
    calls.push({extension: 'turbowarp-aframe', opcode: 'setAttribute', args: {SELECTOR: selector, NAME: name, VALUE: String(value)}});
  }
  for (const child of node.children ?? []) appendNodeCalls(calls, child, id);
}

function classTokens(node: SceneGraphNode): string[] {
  return [
    ...(Array.isArray(node.class) ? node.class : String(node.class ?? '').split(/\s+/)),
    ...(node.classes ?? [])
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function normalizeChildNode(node: SceneGraphNode, parentId: string, index: number): SceneGraphNode {
  const next = cloneNode(node);
  next.id = normalizeId(next.id ?? `${parentId}-${normalizeId(next.type ?? 'node') || 'node'}-${index + 1}`);
  next.children = (next.children ?? []).map((child, childIndex) => normalizeChildNode(child, next.id ?? rootId, childIndex));
  return next;
}

function assertUniqueIds(root: SceneGraphNode): void {
  const ids = new Set<string>();
  visit(root, (node) => {
    const id = normalizeId(node.id ?? '');
    if (id.length === 0) return;
    if (ids.has(id)) throw new Error(`Duplicate scene graph node id: ${id}`);
    ids.add(id);
  });
}

function visit(node: SceneGraphNode, visitor: (node: SceneGraphNode) => void): void {
  visitor(node);
  for (const child of node.children ?? []) visit(child, visitor);
}

function cloneNode(node: SceneGraphNode): SceneGraphNode {
  return {
    ...node,
    ...(node.data === undefined ? {} : {data: {...node.data}}),
    ...(node.attributes === undefined ? {} : {attributes: {...node.attributes}}),
    ...(node.children === undefined ? {} : {children: node.children.map(cloneNode)})
  };
}

function validateClassList(value: unknown, path: string): void {
  if (value === undefined || typeof value === 'string') return;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return;
  throw new TypeError(`Scene graph ${path} must be a string or string array.`);
}

function validateOptionalStringArray(value: unknown, path: string): void {
  if (value === undefined) return;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return;
  throw new TypeError(`Scene graph ${path} must be a string array.`);
}

function validateOptionalString(value: unknown, path: string): void {
  if (value === undefined || typeof value === 'string') return;
  throw new TypeError(`Scene graph ${path} must be a string.`);
}

function validateRecord(value: unknown, path: string): void {
  if (value === undefined) return;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`Scene graph ${path} must be an object.`);
  }
  for (const [key, child] of Object.entries(value)) {
    if (key.trim().length === 0) throw new TypeError(`Scene graph ${path} keys must be non-empty strings.`);
    if (child === undefined) throw new TypeError(`Scene graph ${path}.${key} must not be undefined.`);
    if (
      typeof child !== 'string' &&
      typeof child !== 'number' &&
      typeof child !== 'boolean' &&
      child !== null
    ) {
      throw new TypeError(`Scene graph ${path}.${key} must be a scalar value.`);
    }
  }
}

function normalizeId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]/gu, '-');
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
