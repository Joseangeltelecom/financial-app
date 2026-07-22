const CATEGORY_KEY_MAP: Record<string, string> = {
  "Home Food": "categories.homeFood",
  "Restaurants & Snacks": "categories.restaurants",
  "Housing / Rent": "categories.housing",
  "Utilities": "categories.utilities",
  "Health": "categories.health",
  "Transportation": "categories.transportation",
  "Education": "categories.education",
  "Entertainment": "categories.entertainment",
  "Hygiene": "categories.hygiene",
  "Beauty": "categories.beauty",
  "Household Items": "categories.householdItems",
  "Personal Items": "categories.personalItems",
  "Clothing": "categories.clothing",
  "Salary": "categories.salary",
  "Freelance": "categories.freelance",
  "Investments": "categories.investments",
  "Other Income": "categories.otherIncome",
};

export function getCategoryTranslationKey(name: string): string {
  return CATEGORY_KEY_MAP[name] || "";
}
