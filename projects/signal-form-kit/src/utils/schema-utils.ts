import {
  applyEach,
  applyWhen,
  email,
  hidden,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import type {
  ArrayFieldNode,
  FieldNode,
  FieldType,
  FormSchema,
  LeafFieldNode,
  VisibilityRule,
} from '../types/form-schema';
import { isArrayField, isGroupField, isLeafField } from '../types/form-schema';
import type { FieldTypeRegistry } from '../registry/field-type-registry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaPathRef = any;

export function buildInitialModel<T extends object>(
  schema: FormSchema<T>,
  registry?: FieldTypeRegistry,
): T {
  const model = {} as Record<string, unknown>;

  for (const field of schema.fields) {
    model[field.key] = buildFieldValue(field, registry);
  }

  return model as T;
}

export function buildFieldValue(field: FieldNode, registry?: FieldTypeRegistry): unknown {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (isGroupField(field)) {
    const group: Record<string, unknown> = {};
    for (const child of field.fields) {
      group[child.key] = buildFieldValue(child, registry);
    }
    return group;
  }

  if (isArrayField(field)) {
    const minItems = field.minItems ?? 0;
    if (minItems > 0) {
      return Array.from({ length: minItems }, () => buildArrayItemValue(field, registry));
    }
    return [];
  }

  return defaultForType(field.type, registry);
}

export function buildArrayItemValue(
  field: ArrayFieldNode,
  registry?: FieldTypeRegistry,
): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const child of field.itemFields) {
    item[child.key] = buildFieldValue(child, registry);
  }
  return item;
}

function defaultForType(type: FieldType | string, registry?: FieldTypeRegistry): unknown {
  const customDefault = registry?.defaultValueFor(type);
  if (customDefault !== undefined) {
    return customDefault;
  }

  switch (type as FieldType) {
    case 'number':
    case 'range':
      return 0;
    case 'checkbox':
    case 'switch':
      return false;
    case 'multiselect':
      return [];
    case 'hidden':
      return '';
    default:
      return '';
  }
}

export function shouldHideField(
  field: FieldNode,
  context: Record<string, unknown>,
): boolean {
  if (field.hideIf) {
    return field.hideIf(context);
  }

  if (!field.hideWhen) {
    return false;
  }

  const rules = Array.isArray(field.hideWhen) ? field.hideWhen : [field.hideWhen];
  return rules.some((rule) => matchesVisibilityRule(context, rule));
}

function matchesVisibilityRule(
  context: Record<string, unknown>,
  rule: VisibilityRule,
): boolean {
  const value = context[rule.field];

  if (rule.equals !== undefined) {
    return value === rule.equals;
  }

  if (rule.notEquals !== undefined) {
    return value !== rule.notEquals;
  }

  return false;
}

export function configureSchemaFields(
  path: SchemaPathRef,
  fields: readonly FieldNode[],
  getContext: () => Record<string, unknown>,
): void {
  for (const field of fields) {
    const fieldPath = path[field.key];
    if (!fieldPath) continue;

    if (isGroupField(field)) {
      applyVisibility(field, fieldPath, getContext);
      configureSchemaFields(fieldPath, field.fields, () => {
        const ctx = getContext();
        return (ctx[field.key] as Record<string, unknown>) ?? {};
      });
      continue;
    }

    if (isArrayField(field)) {
      applyVisibility(field, fieldPath, getContext);
      applyEach(fieldPath, (itemPath: SchemaPathRef) => {
        configureSchemaFields(itemPath, field.itemFields, () => {
          const state = itemPath();
          return (state?.value?.() ?? {}) as Record<string, unknown>;
        });
      });
      continue;
    }

    applyFieldRules(fieldPath, field, getContext);
  }
}

function applyVisibility(
  field: FieldNode,
  path: SchemaPathRef,
  getContext: () => Record<string, unknown>,
): void {
  if (field.hideIf || field.hideWhen) {
    hidden(path, () => shouldHideField(field, getContext()));
  }
}

export function applyFieldRules(
  path: SchemaPathRef,
  field: LeafFieldNode,
  getContext: () => Record<string, unknown>,
): void {
  applyVisibility(field, path, getContext);

  const conditional = !!(field.hideIf || field.hideWhen);
  const bind = (target: SchemaPathRef) => bindLeafValidators(target, field);

  if (conditional) {
    applyWhen(path, () => !shouldHideField(field, getContext()), (childPath) => bind(childPath));
  } else {
    bind(path);
  }
}

function bindLeafValidators(path: SchemaPathRef, field: LeafFieldNode): void {
  const validation = field.validation;
  if (!validation) return;

  const msg = (kind: string) => validation.messages?.[kind];

  if (validation.required) {
    required(path, msg('required') ? { message: msg('required') } : undefined);
  }

  if (validation.email && (field.type === 'email' || field.type === 'text')) {
    email(path, msg('email') ? { message: msg('email') } : undefined);
  }

  if (validation.minLength != null) {
    minLength(path, validation.minLength, msg('minLength') ? { message: msg('minLength') } : undefined);
  }

  if (validation.maxLength != null) {
    maxLength(path, validation.maxLength, msg('maxLength') ? { message: msg('maxLength') } : undefined);
  }

  if (validation.min != null && (field.type === 'number' || field.type === 'range')) {
    min(path, validation.min, msg('min') ? { message: msg('min') } : undefined);
  }

  if (validation.max != null && (field.type === 'number' || field.type === 'range')) {
    max(path, validation.max, msg('max') ? { message: msg('max') } : undefined);
  }

  if (validation.pattern) {
    pattern(path, new RegExp(validation.pattern), msg('pattern') ? { message: msg('pattern') } : undefined);
  }
}

export function findFieldByPath(fields: readonly FieldNode[], path: string): LeafFieldNode | undefined {
  const node = findFieldNodeByPath(fields, path);
  return node && isLeafField(node) ? node : undefined;
}

export function findFieldNodeByPath(fields: readonly FieldNode[], path: string): FieldNode | undefined {
  if (!path) return undefined;

  const segments = path.split('.');
  let currentFields = fields;
  let current: FieldNode | undefined;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (/^\d+$/.test(segment)) continue;

    current = currentFields.find((f) => f.key === segment);
    if (!current) return undefined;

    const remaining = segments.slice(i + 1).filter((s) => !/^\d+$/.test(s));
    if (remaining.length === 0) return current;

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

/** Collects labels for invalid leaf fields by walking the schema against the live form tree. */
export function collectInvalidFieldLabels(
  fields: readonly FieldNode[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tree: any,
  getContext: () => Record<string, unknown>,
  pathPrefix = '',
): string[] {
  const labels: string[] = [];

  for (const field of fields) {
    if (shouldHideField(field, getContext())) continue;

    const path = pathPrefix ? `${pathPrefix}.${field.key}` : field.key;
    const node = tree?.[field.key];

    if (isGroupField(field)) {
      labels.push(
        ...collectInvalidFieldLabels(field.fields, node, () => {
          const ctx = getContext();
          return (ctx[field.key] as Record<string, unknown>) ?? {};
        }, path),
      );
      continue;
    }

    if (isArrayField(field)) {
      const items = getValueAtPath(getContext(), path);
      if (Array.isArray(items)) {
        items.forEach((item, index) => {
          labels.push(
            ...collectInvalidFieldLabels(field.itemFields, node?.[index], () => {
              return (item as Record<string, unknown>) ?? {};
            }, `${path}.${index}`),
          );
        });
      }
      continue;
    }

    const state = typeof node === 'function' ? node() : undefined;
    if (state?.invalid?.()) {
      labels.push(field.label ?? field.key);
    }
  }

  return labels;
}

export function getValueAtPath(model: Record<string, unknown>, path: string): unknown {
  if (!path) return model;

  return path.split('.').reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== 'object') return undefined;
    if (/^\d+$/.test(segment)) {
      return Array.isArray(current) ? current[Number(segment)] : undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, model);
}

export function setValueAtPath(
  model: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const clone = structuredClone(model);
  const segments = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = clone;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (/^\d+$/.test(segment)) {
      cursor = cursor[Number(segment)];
    } else {
      cursor = cursor[segment];
    }
  }

  const last = segments[segments.length - 1];
  if (/^\d+$/.test(last)) {
    cursor[Number(last)] = value;
  } else {
    cursor[last] = value;
  }

  return clone;
}

export const VALIDATION_MESSAGES: Record<string, (meta?: number) => string> = {
  required: () => 'This field is required.',
  email: () => 'Invalid email format.',
  minLength: (n) => `Minimum length is ${n} characters.`,
  maxLength: (n) => `Maximum length is ${n} characters.`,
  min: (n) => `Minimum value is ${n}.`,
  max: (n) => `Maximum value is ${n}.`,
  pattern: () => 'Invalid format.',
};

export function getInputType(field: LeafFieldNode): string {
  if (field.type === 'switch') return 'checkbox';
  return field.type;
}

export function isBooleanField(field: LeafFieldNode): boolean {
  return field.type === 'checkbox' || field.type === 'switch';
}

export function isNumericField(field: LeafFieldNode): boolean {
  return field.type === 'number' || field.type === 'range';
}
