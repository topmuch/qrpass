---
Task ID: 3
Agent: main
Task: Add IP Detection for Phone Country Code + Replace Plain Phone Input with PhoneInput Component (Country Flags)

Work Log:
- Created `/src/app/api/ip-country/route.ts` — new API route for IP-to-country detection
  - Uses x-forwarded-for / x-real-ip headers to get client IP
  - Falls back to Senegal (SN) for local/private IPs
  - Calls ipapi.co free API for real IPs (3s timeout)
  - Returns { country, ip } JSON with SN fallback on any error

- Updated `/src/app/activate/baggage/page.tsx`:
  - Added `import PhoneInput from '@/components/ui/PhoneInput'`
  - Added `const [phoneCountry, setPhoneCountry] = useState('SN')` state
  - Added useEffect to fetch `/api/ip-country` and set phoneCountry on mount
  - Replaced plain `<Input type="tel">` for WhatsApp with `<PhoneInput>` component
    - Uses countryCode/onCountryChange for flag selector
    - Uses value/onChange for phone number (returns full international format like +221771234567)
    - Placeholder changed to "77 123 45 67" (local format)
  - `whatsappOwner: phone.trim()` in handleSubmit still works (PhoneInput onChange returns full international number)

- Updated `/src/app/hajj/activate/page.tsx`:
  - Added `import PhoneInput from '@/components/ui/PhoneInput'`
  - Added `const [chefPhoneCountry, setChefPhoneCountry] = useState('SN')` state
  - Added useEffect to fetch `/api/ip-country` and set chefPhoneCountry on mount
  - Replaced plain `<Input type="tel">` for WhatsApp Chef de Groupe with `<PhoneInput>` component
    - Uses countryCode/onCountryChange for flag selector
    - Uses value/onChange for phone number
    - Placeholder changed to "77 123 45 67" (local format)

Stage Summary:
- IP detection API route created at `/api/ip-country` with Senegal default fallback
- Both `/activate/baggage` and `/hajj/activate` pages now use PhoneInput with country flags
- Auto-detects user's country from IP on page load
- PhoneInput returns full international number (e.g. +221771234567), compatible with existing API
- Lint: only pre-existing errors in create-admin.cjs, no new issues
