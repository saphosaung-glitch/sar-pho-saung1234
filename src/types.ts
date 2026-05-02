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

export interface ServiceAreaCity {
  name: string;
  townships: string[];
}

export interface ServiceArea {
  id: string;
  region: string;
  cities?: ServiceAreaCity[];
  city?: string; // Legacy
  townships?: string[]; // Legacy
  isActive: boolean;
}
