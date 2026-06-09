import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defineFormSchema } from '../types/form-schema';
import { provideSignalFormKit } from '../provide-signal-form-kit';
import { JsonFormComponent } from './json-form.component';
import { JsonFormInstanceComponent } from './json-form-instance.component';

interface AccountForm {
  accountType: 'personal' | 'corporate';
  taxId: string;
  name: string;
}

const accountSchema = defineFormSchema<AccountForm>({
  title: 'Account',
  submitLabel: 'Save',
  fields: [
    {
      key: 'accountType',
      label: 'Account Type',
      type: 'select',
      defaultValue: 'personal',
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Corporate', value: 'corporate' },
      ],
    },
    {
      key: 'taxId',
      label: 'Corporate Tax ID',
      type: 'text',
      validation: {
        required: true,
        messages: { required: 'Tax ID is required for corporate accounts.' },
      },
      hideWhen: { field: 'accountType', notEquals: 'corporate' },
    },
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      validation: { required: true },
    },
  ],
});

const flushFormInit = async (fixture: ComponentFixture<unknown>): Promise<void> => {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  fixture.detectChanges();
};

function getFormInstance<T extends object>(
  fixture: ComponentFixture<JsonFormComponent<T>>,
): JsonFormInstanceComponent<T> {
  const debugEl = fixture.debugElement.query(
    (de) => de.componentInstance instanceof JsonFormInstanceComponent,
  );
  if (!debugEl) {
    throw new Error('JsonFormInstanceComponent not found');
  }
  return debugEl.componentInstance as JsonFormInstanceComponent<T>;
}

function patchFormModel<T extends object>(
  fixture: ComponentFixture<JsonFormComponent<T>>,
  patch: Partial<T>,
): void {
  const instance = getFormInstance(fixture);
  const modelSignal = (instance as unknown as { formModel: { (): T; set(v: T): void } }).formModel;
  modelSignal.set({ ...modelSignal(), ...patch });
}

describe('hideWhen integration (taxId / accountType)', () => {
  let fixture: ComponentFixture<JsonFormComponent<AccountForm>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFormComponent],
      providers: [provideSignalFormKit()],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonFormComponent<AccountForm>);
    fixture.componentRef.setInput('schema', accountSchema);
    await flushFormInit(fixture);
  });

  it('should hide taxId when accountType is personal', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#taxId')).toBeNull();
    expect(el.querySelector('label[for="taxId"]')).toBeNull();
  });

  it('should allow submit without taxId when accountType is personal', async () => {
    const submitted: AccountForm[] = [];
    fixture.componentInstance.formSubmit.subscribe((value) => submitted.push(value));

    patchFormModel(fixture, { name: 'Jane Doe' });
    await flushFormInit(fixture);

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    await flushFormInit(fixture);

    expect(submitted).toHaveLength(1);
    expect(submitted[0].accountType).toBe('personal');
    expect(submitted[0].name).toBe('Jane Doe');
    expect(submitted[0].taxId).toBe('');
  });

  it('should show taxId when accountType is corporate', async () => {
    patchFormModel(fixture, { accountType: 'corporate' });
    await flushFormInit(fixture);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#taxId')).toBeTruthy();
  });

  it('should block submit when corporate and taxId is empty', async () => {
    const submitted: AccountForm[] = [];
    fixture.componentInstance.formSubmit.subscribe((value) => submitted.push(value));

    patchFormModel(fixture, { accountType: 'corporate', name: 'Acme Corp', taxId: '' });
    await flushFormInit(fixture);

    const el = fixture.nativeElement as HTMLElement;
    const submitBtn = el.querySelector('.sf-submit') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    const form = el.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(submitted).toHaveLength(0);
  });
});
