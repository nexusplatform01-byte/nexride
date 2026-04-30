import { RideType } from "@/components/RideTypeIcon";

export type RideOption = {
  id: RideType;
  name: string;
  description: string;
  eta: string;
  seats: number;
  price: number;
};

export const RIDE_OPTIONS: RideOption[] = [
  {
    id: "motorbike",
    name: "Boda-Boda",
    description: "Fast solo motorcycle taxi",
    eta: "1 min",
    seats: 1,
    price: 3000,
  },
  {
    id: "economy",
    name: "Economy Car",
    description: "Affordable shared car ride",
    eta: "3 mins",
    seats: 3,
    price: 8000,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Comfortable private car",
    eta: "4 mins",
    seats: 4,
    price: 12000,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Executive SUV experience",
    eta: "5 mins",
    seats: 6,
    price: 20000,
  },
];

export const CURRENCY = "UGX";
