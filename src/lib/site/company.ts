export const COMPANY_BRAND_NAME = "UNHOLY CO."
export const COMPANY_LEGAL_NAME = "Unholy Beverages Pvt Ltd"
export const COMPANY_SUPPORT_EMAIL = "rituals@theunholy.co"
export const COMPANY_PRESS_EMAIL = "press@theunholy.co"
export const COMPANY_GSTIN = "09AADCU8103C1ZL"
export const COMPANY_FSSAI_LICENSE = "12725999000701"
export const COMPANY_REGISTERED_ADDRESS_LINES = [
  "C-12, Bank Colony, Krishna Nagar",
  "Mathura, Uttar Pradesh 281004",
] as const
export const COMPANY_REGISTERED_COUNTRY = "India"
export const COMPANY_REGISTERED_ADDRESS = [
  ...COMPANY_REGISTERED_ADDRESS_LINES,
  COMPANY_REGISTERED_COUNTRY,
].join(", ")
