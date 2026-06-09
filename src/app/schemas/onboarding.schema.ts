import { defineFormSchema } from '../../lib';

export interface OnboardingForm {
  fullName: string;
  email: string;
  age: number;
  accountType: 'personal' | 'corporate';
  taxId: string;
  bio: string;
}

export const onboardingSchema = defineFormSchema<OnboardingForm>({
  title: 'Onboarding Form',
  description: 'Generated from a typed schema — swap in JSON with createFormSchemaFromJson()',
  submitLabel: 'Complete Onboarding',
  fields: [
    {
      key: 'fullName',
      label: 'Full Name',
      type: 'text',
      placeholder: 'John Doe',
      validation: { required: true, minLength: 3 },
    },
    {
      key: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'john@example.com',
      validation: { required: true, email: true },
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number',
      defaultValue: 25,
      validation: { required: true, min: 18, max: 120 },
    },
    {
      key: 'accountType',
      label: 'Account Type',
      type: 'select',
      defaultValue: 'personal',
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Corporate', value: 'corporate' },
      ],
    },
    {
      key: 'taxId',
      label: 'Corporate Tax ID',
      type: 'text',
      placeholder: 'TX-999-000',
      validation: { required: true },
      hideWhen: { field: 'accountType', notEquals: 'corporate' },
    },
    {
      key: 'bio',
      label: 'Short Biography',
      type: 'textarea',
      placeholder: 'Tell us about yourself...',
      validation: { maxLength: 500 },
    },
  ],
});
