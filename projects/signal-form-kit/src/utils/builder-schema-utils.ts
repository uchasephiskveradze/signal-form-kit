import type { FieldNode } from '../types/form-schema';
import { isArrayField, isGroupField } from '../types/form-schema';

export function joinFieldPath(parent: string, key: string): string {
  return parent ? `${parent}.${key}` : key;
}

export function findFieldNodeByPath(fields: readonly FieldNode[], path: string): FieldNode | undefined {
  if (!path) return undefined;

  const segments = path.split('.');
  let currentFields = fields;
  let current: FieldNode | undefined;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    current = currentFields.find((f) => f.key === segment);
    if (!current) return undefined;

    const isLast = i === segments.length - 1;
    if (isLast) return current;

    if (isGroupField(current)) {
      currentFields = current.fields;
    } else if (isArrayField(current)) {
      currentFields = current.itemFields;
    } else {
      return undefined;
    }
  }

  return current;
}

export function resolveFieldContainer(fields: FieldNode[], containerPath: string): FieldNode[] | null {
  if (!containerPath) return fields;

  const node = findFieldNodeByPath(fields, containerPath);
  if (!node) return null;
  if (isGroupField(node)) return node.fields;
  if (isArrayField(node)) return node.itemFields;
  return null;
}

export function containerLabel(fields: readonly FieldNode[], containerPath: string): string {
  if (!containerPath) return 'Root';

  const node = findFieldNodeByPath(fields, containerPath);
  if (!node) return containerPath;
  if (isArrayField(node)) return `${node.label ?? node.key} (item template)`;
  return node.label ?? node.key;
}

export function addFieldToContainer(
  fields: readonly FieldNode[],
  containerPath: string,
  field: FieldNode,
): FieldNode[] {
  const clone = structuredClone(fields) as FieldNode[];
  const container = resolveFieldContainer(clone, containerPath);
  if (!container) return [...fields];
  container.push(field);
  return clone;
}

export function removeFieldAtPath(fields: readonly FieldNode[], path: string): FieldNode[] {
  const segments = path.split('.');
  const key = segments.pop();
  if (!key) return [...fields];

  const clone = structuredClone(fields) as FieldNode[];
  const containerPath = segments.join('.');
  const container = resolveFieldContainer(clone, containerPath);
  if (!container) return [...fields];

  const index = container.findIndex((f) => f.key === key);
  if (index < 0) return [...fields];
  container.splice(index, 1);
  return clone;
}

export function moveFieldAtPath(
  fields: readonly FieldNode[],
  path: string,
  direction: -1 | 1,
): FieldNode[] {
  const segments = path.split('.');
  const key = segments.pop();
  if (!key) return [...fields];

  const clone = structuredClone(fields) as FieldNode[];
  const containerPath = segments.join('.');
  const container = resolveFieldContainer(clone, containerPath);
  if (!container) return [...fields];

  const index = container.findIndex((f) => f.key === key);
  if (index < 0) return [...fields];

  const target = index + direction;
  if (target < 0 || target >= container.length) return [...fields];

  [container[index], container[target]] = [container[target], container[index]];
  return clone;
}

export function updateFieldAtPath(
  fields: readonly FieldNode[],
  path: string,
  patch: Partial<FieldNode>,
): FieldNode[] {
  const clone = structuredClone(fields) as FieldNode[];
  const field = findFieldNodeByPath(clone, path);
  if (!field) return [...fields];
  Object.assign(field, patch);
  return clone;
}

export function isContainerPath(fields: readonly FieldNode[], path: string): boolean {
  if (!path) return true;
  const node = findFieldNodeByPath(fields, path);
  return node != null && (isGroupField(node) || isArrayField(node));
}
