import { defineFormSchema } from '../../lib';

export interface Address {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface OnboardingForm {
  fullName: string;
  email: string;
  age: number;
  website: string;
  phone: string;
  birthDate: string;
  accountType: 'personal' | 'corporate';
  taxId: string;
  newsletter: boolean;
  notifications: boolean;
  preferredContact: string;
  satisfaction: number;
  address: Address;
  emergencyContacts: EmergencyContact[];
  bio: string;
}

export const onboardingSchema = defineFormSchema<OnboardingForm>({
  title: 'Onboarding Form',
  description: 'Full-featured demo with groups, arrays, and every field category',
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
      key: 'website',
      label: 'Website',
      type: 'url',
      placeholder: 'https://example.com',
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '+1 555 0100',
    },
    {
      key: 'birthDate',
      label: 'Date of Birth',
      type: 'date',
      validation: { required: true },
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
      key: 'preferredContact',
      label: 'Preferred Contact Method',
      type: 'radio',
      defaultValue: 'email',
      inline: true,
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'SMS', value: 'sms' },
      ],
    },
    {
      key: 'newsletter',
      label: 'Subscribe to newsletter',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      key: 'notifications',
      label: 'Enable push notifications',
      type: 'switch',
      defaultValue: false,
    },
    {
      key: 'satisfaction',
      label: 'How excited are you? (1–10)',
      type: 'range',
      defaultValue: 7,
      validation: { min: 1, max: 10 },
      step: 1,
    },
    {
      key: 'address',
      label: 'Home Address',
      type: 'group',
      fields: [
        {
          key: 'street',
          label: 'Street',
          type: 'text',
          validation: { required: true },
        },
        {
          key: 'city',
          label: 'City',
          type: 'text',
          validation: { required: true },
        },
        {
          key: 'zip',
          label: 'ZIP / Postal Code',
          type: 'text',
          validation: { required: true, pattern: '^[0-9A-Za-z\\-]{3,10}$' },
        },
        {
          key: 'country',
          label: 'Country',
          type: 'select',
          defaultValue: 'us',
          options: [
            { label: 'United States', value: 'us' },
            { label: 'Canada', value: 'ca' },
            { label: 'United Kingdom', value: 'uk' },
          ],
        },
      ],
    },
    {
      key: 'emergencyContacts',
      label: 'Emergency Contacts',
      type: 'array',
      itemLabel: 'Contact',
      addLabel: 'Add contact',
      minItems: 1,
      maxItems: 3,
      itemFields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          validation: { required: true, minLength: 2 },
        },
        {
          key: 'phone',
          label: 'Phone',
          type: 'tel',
          validation: { required: true },
        },
        {
          key: 'relation',
          label: 'Relationship',
          type: 'select',
          options: [
            { label: 'Spouse', value: 'spouse' },
            { label: 'Parent', value: 'parent' },
            { label: 'Friend', value: 'friend' },
            { label: 'Other', value: 'other' },
          ],
        },
      ],
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
