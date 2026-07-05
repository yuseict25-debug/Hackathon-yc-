export interface IdentityTrait {
  id: string;
  category: string;
  label: string;
  value: number;
  description: string;
  discoveredAt: string;
}

export interface IdentityData {
  userId: string;
  traits: IdentityTrait[];
  completeness: number;
  lastUpdated: string;
}
