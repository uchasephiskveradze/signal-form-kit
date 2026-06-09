import {
  Component,
  effect,
  inject,
  Injector,
  input,
  output,
  runInInjectionContext,
  signal,
  type OnInit,
} from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import type { FormSchema } from '../types/form-schema';
import { applyFieldRules, buildInitialModel, VALIDATION_MESSAGES } from '../utils/schema-utils';

@Component({
  selector: 'sf-json-form',
  standalone: true,
  imports: [FormField],
  templateUrl: './json-form.component.html',
  styleUrl: './json-form.component.scss',
})
export class JsonFormComponent<T extends object> implements OnInit {
  /** JSON or TypeScript-defined form schema */
  schema = input.required<FormSchema<T>>();

  /** Label shown on the button while the submit handler runs */
  submittingLabel = input('Submitting...');

  /** Emits the typed form value after successful validation + submit */
  formSubmit = output<T>();

  /** Emits on every model change for live previews / side effects */
  valueChange = output<T>();

  protected readonly formModel = signal<T>({} as T);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly formTree = signal<any>(undefined);
  protected readonly submitting = signal(false);

  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const model = this.formModel();
      if (this.formTree()) {
        this.valueChange.emit(model);
      }
    });
  }

  ngOnInit(): void {
    this.resetModel();

    const tree = runInInjectionContext(this.injector, () =>
      form(this.formModel, (schemaPath) => {
        const getModel = () => this.formModel();

        for (const field of this.schema().fields) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const path = (schemaPath as any)[field.key];
          if (path) {
            applyFieldRules(path, field, getModel);
          }
        }
      }),
    );

    this.formTree.set(tree);
  }

  /** Reset the form model to schema defaults */
  reset(): void {
    this.resetModel();
    this.valueChange.emit(this.formModel());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected isHidden(form: any, key: string): boolean {
    return form[key]?.()['hidden']?.() ?? false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected isInvalid(form: any, key: string): boolean {
    return form[key]?.()['invalid']?.() ?? false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected isTouched(form: any, key: string): boolean {
    return form[key]?.()['touched']?.() ?? false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected fieldErrors(form: any, key: string): { kind: string; message: string }[] {
    const errors = form[key]?.()['errors']?.() ?? {};
    const field = this.schema().fields.find((f) => f.key === key);
    const validation = field?.validation;
    const result: { kind: string; message: string }[] = [];

    for (const kind of Object.keys(errors)) {
      let message = VALIDATION_MESSAGES[kind]?.();

      if (kind === 'minLength' && validation?.minLength != null) {
        message = VALIDATION_MESSAGES['minLength'](validation.minLength);
      } else if (kind === 'maxLength' && validation?.maxLength != null) {
        message = VALIDATION_MESSAGES['maxLength'](validation.maxLength);
      } else if (kind === 'min' && validation?.min != null) {
        message = VALIDATION_MESSAGES['min'](validation.min);
      } else if (kind === 'max' && validation?.max != null) {
        message = VALIDATION_MESSAGES['max'](validation.max);
      }

      result.push({ kind, message: message ?? 'Invalid value.' });
    }

    return result;
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const tree = this.formTree();
    if (!tree) return;

    await submit(tree, async () => {
      this.submitting.set(true);

      try {
        const value = { ...this.formModel() };
        this.formSubmit.emit(value);
        this.valueChange.emit(value);
      } finally {
        this.submitting.set(false);
      }
    });
  }

  private resetModel(): void {
    this.formModel.set(buildInitialModel(this.schema()));
  }
}
