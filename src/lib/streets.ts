export interface Street {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
}

export const streets: Street[] = [
  {
    id: "fashion",
    name: "Fashion Street",
    category: "Clothing & Accessories",
    isActive: true,
  },
  {
    id: "food",
    name: "Food Street",
    category: "Restaurants & Cafes",
    isActive: false,
  },
  {
    id: "tech",
    name: "Tech Street",
    category: "Electronics & Gadgets",
    isActive: false,
  },
];

export const getStreetById = (id: string): Street | undefined => {
  return streets.find((street) => street.id === id);
};

export interface Shop {
  id: string;
  name: string;
  status: "for-rent" | "taken";
}

export const getShopsForStreet = (streetId: string): Shop[] => {
  // Mock data for now
  return [
    { id: "1", name: "Shop 1", status: "for-rent" },
    { id: "2", name: "Shop 2", status: "taken" },
    { id: "3", name: "Shop 3", status: "for-rent" },
  ];
};
