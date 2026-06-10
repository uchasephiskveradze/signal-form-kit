import { ApplicationConfig } from '@angular/core';
import { provideSignalFormKit } from '@signal-form-kit/core';

export const appConfig: ApplicationConfig = {
  providers: [provideSignalFormKit()],
};
