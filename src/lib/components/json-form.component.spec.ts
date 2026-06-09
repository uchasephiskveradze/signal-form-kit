import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defineFormSchema } from '../types/form-schema';
import { JsonFormComponent } from './json-form.component';

interface TestForm {
  name: string;
  email: string;
}

const testSchema = defineFormSchema<TestForm>({
  title: 'Test Form',
  description: 'A test form',
  submitLabel: 'Save',
  fields: [
    {
      key: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter name',
      validation: { required: true, minLength: 2 },
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      validation: { required: true, email: true },
    },
  ],
});

describe('JsonFormComponent', () => {
  let fixture: ComponentFixture<JsonFormComponent<TestForm>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonFormComponent<TestForm>);
    fixture.componentRef.setInput('schema', testSchema);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render schema title, description, and fields', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.sf-form-title')?.textContent).toContain('Test Form');
    expect(el.querySelector('.sf-form-description')?.textContent).toContain('A test form');
    expect(el.querySelector('label[for="name"]')?.textContent).toContain('Full Name');
    expect(el.querySelector('label[for="email"]')?.textContent).toContain('Email');
    expect(el.querySelector('.sf-submit')?.textContent?.trim()).toContain('Save');
  });

  it('should emit valueChange with initial model', async () => {
    const emitted: TestForm[] = [];
    const localFixture = TestBed.createComponent(JsonFormComponent<TestForm>);

    localFixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    localFixture.componentRef.setInput('schema', testSchema);
    localFixture.detectChanges();
    await localFixture.whenStable();

    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[0]).toEqual({ name: '', email: '' });
  });

  it('should reset model to schema defaults', () => {
    const component = fixture.componentInstance;
    const emitted: TestForm[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));

    component.reset();

    expect(emitted.at(-1)).toEqual({ name: '', email: '' });
  });

  it('should not emit formSubmit when required fields are empty', async () => {
    const submitted: TestForm[] = [];
    fixture.componentInstance.formSubmit.subscribe((value) => submitted.push(value));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(submitted).toHaveLength(0);
  });
});
