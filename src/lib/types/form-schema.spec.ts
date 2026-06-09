import { createFormSchemaFromJson, defineFormSchema } from './form-schema';

interface TestModel {
  name: string;
  age: number;
}

describe('form-schema', () => {
  describe('defineFormSchema', () => {
    it('returns the schema with typed field keys', () => {
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
      const json = JSON.stringify({
        title: 'From JSON',
        fields: [{ key: 'name', label: 'Name', type: 'text' }],
      });

      const schema = createFormSchemaFromJson<TestModel>(json);

      expect(schema.title).toBe('From JSON');
      expect(schema.fields[0].key).toBe('name');
    });

    it('accepts a schema object directly', () => {
      const input = defineFormSchema<TestModel>({
        fields: [{ key: 'name', label: 'Name', type: 'text' }],
      });

      const schema = createFormSchemaFromJson(input);

      expect(schema).toBe(input);
    });
  });
});
