import { Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { LeafFieldNode } from '../types/form-schema';
import { getInputType, getValueAtPath } from '../utils/schema-utils';

/** Binds native inputs to a signal-forms field path. Kept separate so host inputs never collide with FormField. */
@Component({
  selector: 'sf-leaf-field',
  standalone: true,
  imports: [FormField],
  templateUrl: './leaf-field.component.html',
  styleUrl: './leaf-field.component.scss',
})
export class LeafFieldComponent {
  fieldDef = input.required<LeafFieldNode>();
  fieldPath = input.required<(...args: unknown[]) => unknown>();
  model = input.required<object>();
  fieldId = input.required<string>();

  protected readonly getInputType = getInputType;

  protected rangeValue(): unknown {
    return getValueAtPath(this.model() as Record<string, unknown>, this.fieldId());
  }
}
