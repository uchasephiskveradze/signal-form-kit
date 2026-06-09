import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  createDefaultFieldTypeRegistry,
  provideSignalFormKit,
} from '@signal-form-kit/core';
import { StarRatingFieldComponent } from './showcase/star-rating-field.component';

const fieldRegistry = createDefaultFieldTypeRegistry().register({
  type: 'star-rating',
  label: 'Star Rating',
  category: 'custom',
  description: 'Interactive 1–5 star rating (custom renderer demo)',
  defaultValue: 0,
  component: StarRatingFieldComponent,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideSignalFormKit({ registry: fieldRegistry }),
  ],
};
