import { createDefaultField, createFormSchemaFromJson, defineFormSchema, FIELD_TYPE_CATALOG, isArrayField, isGroupField } from './form-schema';

describe('form-schema', () => {
  describe('defineFormSchema', () => {
    it('returns the schema with typed field keys', () => {
      interface TestModel {
        name: string;
        age: number;
      }

      const schema = defineFormSchema<TestModel>({
        title: 'Test',
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'age', label: 'Age', type: 'number', defaultValue: 21 },
        ],
      });

      expect(schema.title).toBe('Test');
      expect(schema.fields).toHaveLength(2);
      expect(schema.fields[0].key).toBe('name');
      expect(schema.fields[1].defaultValue).toBe(21);
    });
  });

  describe('createFormSchemaFromJson', () => {
    it('parses a JSON string', () => {
      interface TestModel {
        name: string;
      }

      const json = JSON.stringify({
        title: 'From JSON',
        fields: [{ key: 'name', label: 'Name', type: 'text' }],
      });

      const schema = createFormSchemaFromJson<TestModel>(json);

      expect(schema.title).toBe('From JSON');
      expect(schema.fields[0].key).toBe('name');
    });
  });

  describe('createDefaultField', () => {
    it('creates structural defaults for group and array', () => {
      const group = createDefaultField('group', 'address');
      const array = createDefaultField('array', 'items');

      expect(group.type).toBe('group');
      expect(array.type).toBe('array');
      expect(isGroupField(group) && group.fields.length).toBeGreaterThan(0);
      expect(isArrayField(array) && array.itemFields.length).toBeGreaterThan(0);
    });

    it('catalog covers 24 field types', () => {
      expect(FIELD_TYPE_CATALOG.length).toBe(24);
    });
  });
});
