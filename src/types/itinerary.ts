export interface Location {
  name: string;
  lat: number;
  lng: number;
  notes: string;
}

export interface FoodItem {
  name: string;
  note: string;
  must_try?: boolean;
}

export interface CostItem {
  item: string;
  cost: string;
}

export interface Stay {
  name: string;
  price: string;
  note: string;
}

export interface DayPlan {
  day: number;
  date: string;
  theme: string;
  region: string;
  locations: Location[];
  morning: string;
  afternoon: string;
  evening: string;
  food: FoodItem[];
  stay: Stay;
  costs: CostItem[];
  tips: string;
  // Legacy field — kept for backward compat
  dining?: string[];
}

export interface PracticalInfo {
  best_time_to_visit: string;
  currency: string;
  transport_tips: string;
  budget_estimate: string;
}

export interface Trip {
  destination: string;
  duration_days: number;
  days: DayPlan[];
  practical_info: PracticalInfo;
}

export interface TripResponse {
  trip: Trip;
}

export interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: "backpacker" | "mid-range" | "luxury";
  interests: string;
}
