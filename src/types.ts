export interface Address {
  id: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  township: string;
  street: string;
  building?: string;
  room?: string;
  label: 'Home' | 'Office' | 'Other';
  isDefault: boolean;
}
