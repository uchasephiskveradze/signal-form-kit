import { Component, input, output } from '@angular/core';
import { JsonFormComponent, type FormSchema, type FormValidity } from '../../lib';
import type { OnboardingForm } from '../schemas/onboarding.schema';

/**
 * Typed facade over JsonFormComponent for the onboarding demo.
 * Centralizes the generic-to-concrete cast so consumers stay fully typed.
 */
@Component({
  selector: 'app-onboarding-form',
  standalone: true,
  imports: [JsonFormComponent],
  templateUrl: './onboarding-form.component.html',
})
export class OnboardingFormComponent {
  schema = input.required<FormSchema<OnboardingForm>>();
  valueChange = output<OnboardingForm>();
  formSubmit = output<OnboardingForm>();
  validityChange = output<FormValidity>();

  protected onValueChange(value: object): void {
    this.valueChange.emit(value as OnboardingForm);
  }

  protected onFormSubmit(value: object): void {
    this.formSubmit.emit(value as OnboardingForm);
  }

  protected onValidityChange(status: FormValidity): void {
    this.validityChange.emit(status);
  }
}
