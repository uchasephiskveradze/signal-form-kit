export type FieldKey<T> = Extract<keyof T, string>;

export type FieldType = 'text' | 'email' | 'number' | 'select' | 'textarea' | 'password';

export interface FieldValidation {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  /** Regex source string — JSON-serializable alternative to RegExp */
  pattern?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

/** JSON-serializable conditional visibility rule */
export interface VisibilityRule<T extends object> {
  field: FieldKey<T>;
  equals?: unknown;
  notEquals?: unknown;
}

export interface FieldDefinition<
  T extends object,
  K extends FieldKey<T> = FieldKey<T>,
> {
  key: K;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: T[K];
  options?: SelectOption[];
  validation?: FieldValidation;
  /** JSON-friendly conditional visibility (OR when array) */
  hideWhen?: VisibilityRule<T> | VisibilityRule<T>[];
  /** TypeScript-only dynamic visibility; takes precedence over hideWhen */
  hideIf?: (value: T) => boolean;
  hint?: string;
}

export interface FormSchema<T extends object> {
  title?: string;
  description?: string;
  submitLabel?: string;
  fields: readonly FieldDefinition<T>[];
}

/**
 * Type-safe schema builder. Ensures field keys align with your model interface.
 *
 * @example
 * interface User { name: string; email: string; }
 * const schema = defineFormSchema<User>({ fields: [...] });
 */
export function defineFormSchema<T extends object>(schema: FormSchema<T>): FormSchema<T> {
  return schema;
}

/**
 * Parse a JSON string or object into a form schema.
 * Use hideWhen (not hideIf) for JSON-driven conditional fields.
 */
export function createFormSchemaFromJson<T extends object>(
  json: string | FormSchema<T>,
): FormSchema<T> {
  return typeof json === 'string' ? (JSON.parse(json) as FormSchema<T>) : json;
}
