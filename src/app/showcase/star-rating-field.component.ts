import { Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { CustomFieldRendererInputs } from '@signal-form-kit/core';

/** Demo custom field registered via FieldTypeRegistry (`type: 'star-rating'`). */
@Component({
  selector: 'app-star-rating-field',
  standalone: true,
  imports: [FormField],
  template: `
    @let f = fieldDef();
    @let path = fieldPath();
    <div class="star-rating-field">
      @if (f.label) {
        <span class="star-rating-label">{{ f.label }}</span>
      }
      <div class="star-rating-stars" role="radiogroup" [attr.aria-label]="f.label ?? 'Rating'">
        @for (star of stars; track star) {
          <button
            type="button"
            class="star-btn"
            [class.active]="star <= currentValue()"
            (click)="setRating(star, path)"
          >
            ★
          </button>
        }
      </div>
      <span class="star-rating-value">{{ currentValue() }} / 5</span>
      <input type="hidden" [formField]="$any(path)" />
    </div>
  `,
  styles: `
    .star-rating-field {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .star-rating-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--sf-text);
    }

    .star-rating-stars {
      display: flex;
      gap: 0.25rem;
    }

    .star-btn {
      border: none;
      background: transparent;
      font-size: 1.45rem;
      line-height: 1;
      color: #cbd5e1;
      cursor: pointer;
      padding: 0.1rem;
      transition: color 0.15s ease, transform 0.15s ease;
    }

    .star-btn.active {
      color: #f59e0b;
    }

    .star-btn:hover {
      transform: scale(1.08);
    }

    .star-rating-value {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--sf-muted);
    }
  `,
})
export class StarRatingFieldComponent {
  fieldDef = input.required<CustomFieldRendererInputs['fieldDef']>();
  fieldPath = input.required<CustomFieldRendererInputs['fieldPath']>();
  model = input.required<object>();
  fieldId = input.required<string>();

  protected readonly stars = [1, 2, 3, 4, 5];

  protected currentValue(): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = this.fieldPath()() as any;
    const value = state?.value?.() ?? state?.controlValue?.();
    return typeof value === 'number' ? value : 0;
  }

  protected setRating(star: number, path: CustomFieldRendererInputs['fieldPath']): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = path() as any;
    state?.controlValue?.set(star);
  }
}
