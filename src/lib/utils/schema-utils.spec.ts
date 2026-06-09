import { defineFormSchema } from '../types/form-schema';
import {
  buildInitialModel,
  shouldHideField,
  VALIDATION_MESSAGES,
} from './schema-utils';

interface TestModel {
  name: string;
  age: number;
  role: string;
  taxId: string;
}

const baseSchema = defineFormSchema<TestModel>({
  fields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'age', label: 'Age', type: 'number', defaultValue: 25 },
    { key: 'role', label: 'Role', type: 'select', defaultValue: 'user' },
    {
      key: 'taxId',
      label: 'Tax ID',
      type: 'text',
      hideWhen: { field: 'role', notEquals: 'corporate' },
    },
  ],
});

describe('schema-utils', () => {
  describe('buildInitialModel', () => {
    it('applies defaultValue when provided', () => {
      const model = buildInitialModel(baseSchema);

      expect(model.name).toBe('');
      expect(model.age).toBe(25);
      expect(model.role).toBe('user');
      expect(model.taxId).toBe('');
    });

    it('uses type-based defaults when defaultValue is omitted', () => {
      const schema = defineFormSchema<TestModel>({
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'age', label: 'Age', type: 'number' },
        ],
      });

      const model = buildInitialModel(schema);

      expect(model.name).toBe('');
      expect(model.age).toBe(0);
    });
  });

  describe('shouldHideField', () => {
    const taxIdField = baseSchema.fields.find((f) => f.key === 'taxId')!;

    it('returns false when no visibility rules are set', () => {
      const nameField = baseSchema.fields.find((f) => f.key === 'name')!;

      expect(shouldHideField(nameField, { name: '', age: 0, role: 'user', taxId: '' })).toBe(false);
    });

    it('hides field when hideWhen notEquals matches', () => {
      expect(
        shouldHideField(taxIdField, { name: '', age: 0, role: 'personal', taxId: '' }),
      ).toBe(true);
    });

    it('shows field when hideWhen notEquals does not match', () => {
      expect(
        shouldHideField(taxIdField, { name: '', age: 0, role: 'corporate', taxId: '' }),
      ).toBe(false);
    });

    it('hides field when hideWhen equals matches', () => {
      const field = {
        ...taxIdField,
        hideWhen: { field: 'role' as const, equals: 'guest' },
      };

      expect(shouldHideField(field, { name: '', age: 0, role: 'guest', taxId: '' })).toBe(true);
    });

    it('prefers hideIf over hideWhen', () => {
      const field = {
        ...taxIdField,
        hideIf: (value: TestModel) => value.age < 18,
      };

      expect(shouldHideField(field, { name: '', age: 16, role: 'corporate', taxId: '' })).toBe(
        true,
      );
      expect(shouldHideField(field, { name: '', age: 21, role: 'corporate', taxId: '' })).toBe(
        false,
      );
    });

    it('treats hideWhen array as OR logic', () => {
      const field = {
        ...taxIdField,
        hideWhen: [
          { field: 'role' as const, equals: 'guest' },
          { field: 'role' as const, equals: 'personal' },
        ],
      };

      expect(shouldHideField(field, { name: '', age: 0, role: 'personal', taxId: '' })).toBe(
        true,
      );
      expect(shouldHideField(field, { name: '', age: 0, role: 'corporate', taxId: '' })).toBe(
        false,
      );
    });
  });

  describe('VALIDATION_MESSAGES', () => {
    it('returns user-facing messages for known validators', () => {
      expect(VALIDATION_MESSAGES['required']()).toBe('This field is required.');
      expect(VALIDATION_MESSAGES['email']()).toBe('Invalid email format.');
      expect(VALIDATION_MESSAGES['minLength'](3)).toBe('Minimum length is 3 characters.');
      expect(VALIDATION_MESSAGES['max'](120)).toBe('Maximum value is 120.');
    });
  });
});
