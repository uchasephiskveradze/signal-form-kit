import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { onboardingSchema, type OnboardingForm } from '../../app/schemas/onboarding.schema';
import { buildInitialModel, configureSchemaFields } from '../utils/schema-utils';
import { JsonFormComponent } from './json-form.component';

const flushFormInit = async (fixture: ComponentFixture<unknown>): Promise<void> => {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  fixture.detectChanges();
};

describe('FieldRendererComponent integration', () => {
  let fixture: ComponentFixture<JsonFormComponent<OnboardingForm>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonFormComponent<OnboardingForm>);
    fixture.componentRef.setInput('schema', onboardingSchema);
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
    const tree = (fixture.componentInstance as unknown as { formTree: () => unknown }).formTree() as {
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
      const model = signal(buildInitialModel(onboardingSchema));
      const tree = form(model, (schemaPath) => {
        configureSchemaFields(schemaPath, onboardingSchema.fields, () => model() as unknown as Record<string, unknown>);
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
