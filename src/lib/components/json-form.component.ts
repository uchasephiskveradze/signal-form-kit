import {
  Component,
  effect,
  inject,
  Injector,
  input,
  output,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core';
import { form, submit } from '@angular/forms/signals';
import type { ArrayFieldNode, FormSchema, FormValidity } from '../types/form-schema';
import {
  buildArrayItemValue,
  buildInitialModel,
  configureSchemaFields,
  getValueAtPath,
  setValueAtPath,
} from '../utils/schema-utils';
import { FieldRendererComponent } from './field-renderer.component';

@Component({
  selector: 'sf-json-form',
  standalone: true,
  imports: [FieldRendererComponent],
  templateUrl: './json-form.component.html',
  styleUrl: './json-form.component.scss',
})
export class JsonFormComponent<T extends object> {
  schema = input.required<FormSchema<T>>();

  submittingLabel = input('Submitting...');

  formSubmit = output<T>();

  valueChange = output<T>();

  validityChange = output<FormValidity>();

  protected readonly formModel = signal<T>({} as T);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly formTree = signal<any>(undefined);
  protected readonly formRevision = signal(0);
  protected readonly submitting = signal(false);

  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      this.schema();
      untracked(() => {
        queueMicrotask(() => this.initializeForm());
      });
    });

    effect(() => {
      const model = this.formModel();
      const tree = this.formTree();
      if (!tree) return;

      this.valueChange.emit(model);

      const root = tree();
      this.validityChange.emit({
        valid: root['valid']?.() ?? false,
        invalid: root['invalid']?.() ?? true,
      });
    });
  }

  private initializeForm(): void {
    const schema = this.schema();
    this.formTree.set(undefined);

    const model = buildInitialModel(schema);
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

    this.formRevision.update((revision) => revision + 1);
    this.formTree.set(tree);
  }

  reset(): void {
    this.formModel.set(buildInitialModel(this.schema()) as T);
    this.valueChange.emit(this.formModel());
  }

  protected onAddArrayItem(event: { field: ArrayFieldNode; path: string }): void {
    const current = getValueAtPath(this.formModel() as Record<string, unknown>, event.path);
    const next = Array.isArray(current) ? [...current] : [];
    next.push(buildArrayItemValue(event.field));
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

    await submit(tree, async () => {
      this.submitting.set(true);

      try {
        const value = structuredClone(this.formModel());
        this.formSubmit.emit(value);
        this.valueChange.emit(value);
      } finally {
        this.submitting.set(false);
      }
    });
  }

  private patchModel(path: string, value: unknown): void {
    const next = setValueAtPath(this.formModel() as Record<string, unknown>, path, value);
    this.formModel.set(next as T);
  }
}
