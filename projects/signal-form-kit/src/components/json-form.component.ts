import {
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { FormSchema, FormValidity } from '../types/form-schema';
import { JsonFormInstanceComponent } from './json-form-instance.component';

/**
 * Schema-driven form root. Remounts the inner form when `schema` or `formKey` changes,
 * or when `reloadSchema()` is called — avoiding fragile manual form-tree teardown.
 */
@Component({
  selector: 'sf-json-form',
  standalone: true,
  imports: [JsonFormInstanceComponent],
  template: `
    @if (showInstance()) {
      <sf-json-form-instance
        [schema]="schema()"
        [submittingLabel]="submittingLabel()"
        [disableSubmitWhenInvalid]="disableSubmitWhenInvalid()"
        (formSubmit)="formSubmit.emit($event)"
        (valueChange)="valueChange.emit($event)"
        (validityChange)="validityChange.emit($event)"
      />
    }
  `,
})
export class JsonFormComponent<T extends object> {
  schema = input.required<FormSchema<T>>();

  /** Bump this input (or call reloadSchema()) to force a full form remount. */
  formKey = input<string | number>(0);

  submittingLabel = input('Submitting...');
  disableSubmitWhenInvalid = input(true);

  formSubmit = output<T>();
  valueChange = output<T>();
  validityChange = output<FormValidity>();

  protected readonly showInstance = signal(true);

  private readonly instance = viewChild(JsonFormInstanceComponent<T>);
  private readonly remountReady = signal(false);

  constructor() {
    effect(() => {
      this.schema();
      this.formKey();
      untracked(() => {
        if (!this.remountReady()) {
          this.remountReady.set(true);
          return;
        }
        this.scheduleRemount();
      });
    });
  }

  /** Remounts the form from the current schema (fresh model + signal-form tree). */
  reloadSchema(): void {
    this.scheduleRemount();
  }

  reset(): void {
    this.instance()?.reset();
  }

  private scheduleRemount(): void {
    this.showInstance.set(false);
    queueMicrotask(() => this.showInstance.set(true));
  }
}
