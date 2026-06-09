export type InputFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'url'
  | 'tel'
  | 'search'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  | 'range'
  | 'file'
  | 'hidden';

export type ChoiceFieldType = 'select' | 'multiselect' | 'checkbox' | 'switch' | 'radio';

export type StructuralFieldType = 'group' | 'array';

export type FieldType = InputFieldType | ChoiceFieldType | StructuralFieldType;

export interface FieldValidation {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  messages?: Partial<Record<string, string>>;
}

export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

export interface VisibilityRule {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
}

interface FieldNodeBase {
  key: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  defaultValue?: unknown;
  validation?: FieldValidation;
  hideWhen?: VisibilityRule | VisibilityRule[];
  hideIf?: (value: Record<string, unknown>) => boolean;
}

export interface LeafFieldNode extends FieldNodeBase {
  type: Exclude<FieldType, StructuralFieldType>;
  options?: SelectOption[];
  /** For range inputs */
  step?: number;
  /** For file inputs */
  accept?: string;
  /** For radio / checkbox groups displayed inline */
  inline?: boolean;
}

export interface GroupFieldNode extends FieldNodeBase {
  type: 'group';
  fields: FieldNode[];
}

export interface ArrayFieldNode extends FieldNodeBase {
  type: 'array';
  itemLabel?: string;
  itemFields: FieldNode[];
  minItems?: number;
  maxItems?: number;
  addLabel?: string;
}

export type FieldNode = LeafFieldNode | GroupFieldNode | ArrayFieldNode;

export type FieldKey<T> = Extract<keyof T, string>;

/** @deprecated Use FieldNode — kept for backward compatibility */
export type FieldDefinition<T extends object = object, K extends string = string> = LeafFieldNode & {
  key: K;
};

export interface FormSchema<T extends object = object> {
  title?: string;
  description?: string;
  submitLabel?: string;
  fields: readonly FieldNode[];
}

/** Top-level field keys are checked when defining a schema with `defineFormSchema<T>()`. */
export type TypedFormSchema<T extends object> = Omit<FormSchema<T>, 'fields'> & {
  fields: readonly (FieldNode & { key: FieldKey<T> })[];
};

export interface FormValidity {
  valid: boolean;
  invalid: boolean;
}

export function isGroupField(field: FieldNode): field is GroupFieldNode {
  return field.type === 'group';
}

export function isArrayField(field: FieldNode): field is ArrayFieldNode {
  return field.type === 'array';
}

export function isLeafField(field: FieldNode): field is LeafFieldNode {
  return field.type !== 'group' && field.type !== 'array';
}

export function defineFormSchema(schema: FormSchema): FormSchema;
export function defineFormSchema<T extends object>(schema: TypedFormSchema<T>): FormSchema<T>;
export function defineFormSchema<T extends object>(schema: FormSchema | TypedFormSchema<T>): FormSchema<T> {
  return schema as FormSchema<T>;
}

export function createFormSchemaFromJson<T extends object>(
  json: string | FormSchema<T>,
): FormSchema<T> {
  return typeof json === 'string' ? (JSON.parse(json) as FormSchema<T>) : json;
}

export interface FieldTypeMeta {
  type: FieldType;
  label: string;
  category: 'input' | 'choice' | 'structural';
  description: string;
}

export const FIELD_TYPE_CATALOG: readonly FieldTypeMeta[] = [
  { type: 'text', label: 'Text', category: 'input', description: 'Single-line text' },
  { type: 'email', label: 'Email', category: 'input', description: 'Email address' },
  { type: 'password', label: 'Password', category: 'input', description: 'Masked password' },
  { type: 'number', label: 'Number', category: 'input', description: 'Numeric input' },
  { type: 'textarea', label: 'Textarea', category: 'input', description: 'Multi-line text' },
  { type: 'url', label: 'URL', category: 'input', description: 'Web address' },
  { type: 'tel', label: 'Phone', category: 'input', description: 'Telephone number' },
  { type: 'search', label: 'Search', category: 'input', description: 'Search field' },
  { type: 'color', label: 'Color', category: 'input', description: 'Color picker' },
  { type: 'date', label: 'Date', category: 'input', description: 'Date picker' },
  { type: 'datetime-local', label: 'Date & Time', category: 'input', description: 'Local datetime' },
  { type: 'time', label: 'Time', category: 'input', description: 'Time picker' },
  { type: 'month', label: 'Month', category: 'input', description: 'Month picker' },
  { type: 'week', label: 'Week', category: 'input', description: 'Week picker' },
  { type: 'range', label: 'Range', category: 'input', description: 'Slider' },
  { type: 'file', label: 'File', category: 'input', description: 'File upload' },
  { type: 'hidden', label: 'Hidden', category: 'input', description: 'Hidden value' },
  { type: 'select', label: 'Select', category: 'choice', description: 'Dropdown' },
  { type: 'multiselect', label: 'Multi-select', category: 'choice', description: 'Multiple choices' },
  { type: 'checkbox', label: 'Checkbox', category: 'choice', description: 'Boolean toggle' },
  { type: 'switch', label: 'Switch', category: 'choice', description: 'On/off switch' },
  { type: 'radio', label: 'Radio', category: 'choice', description: 'Single choice list' },
  { type: 'group', label: 'Group', category: 'structural', description: 'Nested field group' },
  { type: 'array', label: 'Array', category: 'structural', description: 'Repeatable items' },
] as const;

export function createDefaultField(type: FieldType, key?: string): FieldNode {
  const id = key ?? `field_${Date.now()}`;

  if (type === 'group') {
    return {
      key: id,
      label: 'Field Group',
      type: 'group',
      fields: [
        { key: `${id}_child`, label: 'Child Field', type: 'text' },
      ],
    };
  }

  if (type === 'array') {
    return {
      key: id,
      label: 'Repeatable Items',
      type: 'array',
      itemLabel: 'Item',
      addLabel: 'Add item',
      itemFields: [
        { key: 'name', label: 'Name', type: 'text', validation: { required: true } },
      ],
    };
  }

  const base: LeafFieldNode = { key: id, label: FIELD_TYPE_CATALOG.find((f) => f.type === type)?.label ?? type, type };

  if (type === 'select' || type === 'multiselect' || type === 'radio') {
    base.options = [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
    ];
  }

  if (type === 'checkbox' || type === 'switch') {
    base.defaultValue = false;
  }

  if (type === 'multiselect') {
    base.defaultValue = [];
  }

  if (type === 'number' || type === 'range') {
    base.defaultValue = 0;
  }

  return base;
}
