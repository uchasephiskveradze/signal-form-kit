import {
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
  FieldDefinition,
  FieldType,
  FormSchema,
  VisibilityRule,
} from '../types/form-schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaPathRef = any;

export function buildInitialModel<T extends object>(schema: FormSchema<T>): T {
  const model = {} as T;

  for (const field of schema.fields) {
    model[field.key] = (field.defaultValue ?? defaultForType(field.type)) as T[typeof field.key];
  }

  return model;
}

function defaultForType(type: FieldType): string | number {
  return type === 'number' ? 0 : '';
}

export function shouldHideField<T extends object>(
  field: FieldDefinition<T>,
  model: T,
): boolean {
  if (field.hideIf) {
    return field.hideIf(model);
  }

  if (!field.hideWhen) {
    return false;
  }

  const rules = Array.isArray(field.hideWhen) ? field.hideWhen : [field.hideWhen];
  return rules.some((rule) => matchesVisibilityRule(model, rule));
}

function matchesVisibilityRule<T extends object>(
  model: T,
  rule: VisibilityRule<T>,
): boolean {
  const value = model[rule.field as keyof T];

  if (rule.equals !== undefined) {
    return value === rule.equals;
  }

  if (rule.notEquals !== undefined) {
    return value !== rule.notEquals;
  }

  return false;
}

export function applyFieldRules<T extends object>(
  path: SchemaPathRef,
  field: FieldDefinition<T>,
  getModel: () => T,
): void {
  if (field.hideIf || field.hideWhen) {
    hidden(path, () => shouldHideField(field, getModel()));
  }

  const validation = field.validation;
  if (!validation) {
    return;
  }

  if (validation.required) {
    required(path);
  }

  if (validation.email && (field.type === 'email' || field.type === 'text')) {
    email(path);
  }

  if (validation.minLength != null) {
    minLength(path, validation.minLength);
  }

  if (validation.maxLength != null) {
    maxLength(path, validation.maxLength);
  }

  if (validation.min != null && field.type === 'number') {
    min(path, validation.min);
  }

  if (validation.max != null && field.type === 'number') {
    max(path, validation.max);
  }

  if (validation.pattern) {
    pattern(path, new RegExp(validation.pattern));
  }
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
