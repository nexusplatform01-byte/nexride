export type Trip = {
  id: string;
  date: string;
  pickup: string;
  destination: string;
  ride: string;
  price: number;
  status: "completed" | "cancelled";
};

export const TRIPS: Trip[] = [
  {
    id: "t1",
    date: "Today, 2:14 PM",
    pickup: "Union Coop Mall",
    destination: "Emaar Dubai Square",
    ride: "Premium",
    price: 23,
    status: "completed",
  },
  {
    id: "t2",
    date: "Yesterday, 8:42 AM",
    pickup: "Acholi Inn",
    destination: "Gulu Main Market",
    ride: "Motorbike",
    price: 8,
    status: "completed",
  },
  {
    id: "t3",
    date: "Mon, 6:15 PM",
    pickup: "Pece Stadium",
    destination: "Layibi College",
    ride: "Economy",
    price: 14,
    status: "completed",
  },
  {
    id: "t4",
    date: "Sun, 11:02 AM",
    pickup: "Gulu University",
    destination: "Senior Quarters",
    ride: "Economy",
    price: 11,
    status: "cancelled",
  },
];

export type PaymentMethod = {
  id: string;
  label: string;
  detail: string;
  type: "wallet" | "mtn" | "airtel" | "cash";
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "wallet", label: "Riider Wallet", detail: "Balance 84,500", type: "wallet" },
  { id: "mtn", label: "MTN Mobile Money", detail: "•••• 7812", type: "mtn" },
  { id: "airtel", label: "Airtel Money", detail: "•••• 4421", type: "airtel" },
  { id: "cash", label: "Cash", detail: "Pay on arrival", type: "cash" },
];
