import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import {
  createDefaultFieldTypeRegistry,
  provideFieldTypeRegistry,
  type FieldTypeRegistry,
} from './registry/field-type-registry';

export interface SignalFormKitOptions {
  registry?: FieldTypeRegistry;
}

/** Registers default Signal Form Kit providers (field type registry, etc.). */
export function provideSignalFormKit(options: SignalFormKitOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideFieldTypeRegistry(options.registry ?? createDefaultFieldTypeRegistry()),
  ]);
}
