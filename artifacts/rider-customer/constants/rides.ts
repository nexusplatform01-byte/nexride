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
    id: "economy",
    name: "Economy",
    description: "Everyday affordable rides",
    eta: "2 mins",
    seats: 3,
    price: 23,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Ride in comfort & style",
    eta: "2 mins",
    seats: 4,
    price: 23,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Executive experience",
    eta: "2 mins",
    seats: 6,
    price: 23,
  },
  {
    id: "motorbike",
    name: "Motorbike",
    description: "Quick solo rides",
    eta: "2 mins",
    seats: 1,
    price: 23,
  },
];

export const CURRENCY = "UGX";
