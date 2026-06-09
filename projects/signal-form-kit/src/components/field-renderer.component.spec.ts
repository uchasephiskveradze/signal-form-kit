import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { defineFormSchema } from '../types/form-schema';
import { provideSignalFormKit } from '../provide-signal-form-kit';
import { buildInitialModel, configureSchemaFields } from '../utils/schema-utils';
import { JsonFormComponent } from './json-form.component';
import { JsonFormInstanceComponent } from './json-form-instance.component';

interface NestedTestForm {
  fullName: string;
  satisfaction: number;
  address: { street: string };
  emergencyContacts: { name: string; phone: string }[];
}

const nestedTestSchema = defineFormSchema<NestedTestForm>({
  fields: [
    { key: 'fullName', label: 'Full Name', type: 'text', validation: { required: true } },
    { key: 'satisfaction', label: 'Rating', type: 'number', defaultValue: 0 },
    {
      key: 'address',
      type: 'group',
      fields: [{ key: 'street', label: 'Street', type: 'text', validation: { required: true } }],
    },
    {
      key: 'emergencyContacts',
      type: 'array',
      minItems: 1,
      itemFields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'tel' },
      ],
    },
  ],
});

const flushFormInit = async (fixture: ComponentFixture<unknown>): Promise<void> => {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  fixture.detectChanges();
};

describe('FieldRendererComponent integration', () => {
  let fixture: ComponentFixture<JsonFormComponent<NestedTestForm>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFormComponent],
      providers: [provideSignalFormKit()],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonFormComponent<NestedTestForm>);
    fixture.componentRef.setInput('schema', nestedTestSchema);
    await flushFormInit(fixture);
  });

  it('should render nested onboarding fields without binding errors', () => {
    const el = fixture.nativeElement as HTMLElement;
    const arrayInputs = el.querySelectorAll('.sf-array input');

    expect(el.querySelector('input[id="fullName"]')).toBeTruthy();
    expect(el.querySelector('input[id="address.street"]')).toBeTruthy();
    expect(el.querySelector('input[id="satisfaction"]')).toBeTruthy();
    expect(arrayInputs.length).toBeGreaterThan(0);
    expect([...arrayInputs].map((input) => input.id)).toEqual(
      expect.arrayContaining(['emergencyContacts.0.name', 'emergencyContacts.0.phone']),
    );
  });

  it('should expose callable paths for nested and array fields', () => {
    const instance = fixture.debugElement.query(
      (de) => de.componentInstance instanceof JsonFormInstanceComponent,
    )?.componentInstance as JsonFormInstanceComponent<NestedTestForm> | undefined;

    const tree = (instance as unknown as { formTree: () => unknown }).formTree() as {
      [key: string]: unknown;
    } & (() => unknown);

    expect(typeof tree['address']).toBe('function');
    expect(typeof (tree['address'] as { [key: string]: unknown })['street']).toBe('function');
    expect(typeof tree['emergencyContacts']).toBe('function');
    expect(typeof (tree['emergencyContacts'] as { [key: number]: unknown })[0]).toBe('function');
    expect(
      typeof ((tree['emergencyContacts'] as { [key: number]: unknown })[0] as { [key: string]: unknown })['name'],
    ).toBe('function');
    expect(typeof tree['satisfaction']).toBe('function');
  });
});

describe('FieldRenderer path resolution', () => {
  it('resolves leaf paths from nested field trees', () => {
    TestBed.runInInjectionContext(() => {
      const model = signal(buildInitialModel(nestedTestSchema));
      const tree = form(model, (schemaPath) => {
        configureSchemaFields(schemaPath, nestedTestSchema.fields, () => model() as unknown as Record<string, unknown>);
      });

      const addressTree = tree['address'] as unknown as { [key: string]: unknown };
      const contactsTree = tree['emergencyContacts'] as unknown as { [key: number]: unknown };
      const itemTree = contactsTree[0] as { [key: string]: unknown };

      expect(typeof addressTree['street']).toBe('function');
      expect(typeof itemTree['name']).toBe('function');
      expect(typeof tree['satisfaction']).toBe('function');
    });
  });
});
