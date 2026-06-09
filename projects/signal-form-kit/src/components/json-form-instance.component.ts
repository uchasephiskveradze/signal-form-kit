import {
  afterNextRender,
  Component,
  effect,
  inject,
  Injector,
  input,
  output,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { form, submit } from '@angular/forms/signals';
import type { ArrayFieldNode, FormSchema, FormValidity } from '../types/form-schema';
import { injectFieldTypeRegistry } from '../registry/field-type-registry';
import {
  buildArrayItemValue,
  buildInitialModel,
  collectInvalidFieldLabels,
  configureSchemaFields,
  getValueAtPath,
  setValueAtPath,
} from '../utils/schema-utils';
import { FieldRendererComponent } from './field-renderer.component';

/** Internal form instance — created fresh on each mount (see JsonFormComponent.formKey). */
@Component({
  selector: 'sf-json-form-instance',
  standalone: true,
  imports: [FieldRendererComponent],
  templateUrl: './json-form-instance.component.html',
  styleUrl: './json-form.component.scss',
})
export class JsonFormInstanceComponent<T extends object> {
  schema = input.required<FormSchema<T>>();
  submittingLabel = input('Submitting...');
  disableSubmitWhenInvalid = input(true);

  formSubmit = output<T>();
  valueChange = output<T>();
  validityChange = output<FormValidity>();

  protected readonly formModel = signal<T>({} as T);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly formTree = signal<any>(undefined);
  protected readonly submitting = signal(false);
  protected readonly formValid = signal(false);
  protected readonly missingLabels = signal<string[]>([]);
  protected readonly submitAttempted = signal(false);

  private readonly injector = inject(Injector);
  private readonly fieldRegistry = injectFieldTypeRegistry();

  constructor() {
    afterNextRender(() => this.initializeForm(), { injector: this.injector });

    effect(() => {
      const model = this.formModel();
      const tree = this.formTree();
      if (!tree) return;

      this.valueChange.emit(model);

      const root = tree();
      const valid = root['valid']?.() ?? false;
      const missing = collectInvalidFieldLabels(
        this.schema().fields,
        tree,
        () => this.formModel() as unknown as Record<string, unknown>,
      );

      this.formValid.set(valid);
      this.missingLabels.set(missing);
      this.validityChange.emit({
        valid,
        invalid: !valid,
        missingLabels: missing,
      });
    });
  }

  protected validationHint(): string {
    const labels = this.missingLabels();
    if (labels.length === 0) {
      return 'Complete all required fields to submit.';
    }
    if (labels.length <= 3) {
      return `Missing: ${labels.join(', ')}`;
    }
    return `Missing: ${labels.slice(0, 3).join(', ')} (+${labels.length - 3} more)`;
  }

  reset(): void {
    this.formModel.set(buildInitialModel(this.schema(), this.fieldRegistry) as T);
    this.submitAttempted.set(false);
    this.valueChange.emit(this.formModel());
  }

  protected onAddArrayItem(event: { field: ArrayFieldNode; path: string }): void {
    const current = getValueAtPath(this.formModel() as Record<string, unknown>, event.path);
    const next = Array.isArray(current) ? [...current] : [];
    next.push(buildArrayItemValue(event.field, this.fieldRegistry));
    this.patchModel(event.path, next);
  }

  protected onRemoveArrayItem(event: { field: ArrayFieldNode; index: number; path: string }): void {
    const current = getValueAtPath(this.formModel() as Record<string, unknown>, event.path);
    if (!Array.isArray(current)) return;

    const minItems = event.field.minItems ?? 0;
    if (current.length <= minItems) return;

    const next = current.filter((_, i) => i !== event.index);
    this.patchModel(event.path, next);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const tree = this.formTree();
    if (!tree) return;

    this.submitAttempted.set(true);

    await submit(tree, {
      action: async () => {
        this.submitting.set(true);

        try {
          const value = structuredClone(this.formModel());
          this.formSubmit.emit(value);
          this.valueChange.emit(value);
        } finally {
          this.submitting.set(false);
        }

        return undefined;
      },
      onInvalid: (field) => {
        const firstError = field().errorSummary()[0];
        firstError?.fieldTree().focusBoundControl();
      },
    });
  }

  private initializeForm(): void {
    const schema = this.schema();
    this.submitAttempted.set(false);

    const model = buildInitialModel(schema, this.fieldRegistry);
    this.formModel.set(model as T);

    const tree = runInInjectionContext(this.injector, () =>
      form(this.formModel, (schemaPath) => {
        configureSchemaFields(
          schemaPath,
          schema.fields,
          () => this.formModel() as unknown as Record<string, unknown>,
        );
      }),
    );

    this.formTree.set(tree);
  }

  private patchModel(path: string, value: unknown): void {
    const next = setValueAtPath(this.formModel() as Record<string, unknown>, path, value);
    this.formModel.set(next as T);
  }
}
