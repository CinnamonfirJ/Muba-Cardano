# Walkthrough: Global Correction of Vendor Onboarding & Payouts

The system has been globally corrected to use **Paystack Subaccounts** instead of Transfer Recipients, ensuring full compatibility with Split Payments and implementing strict marketplace gating.

## 1. Corrected Onboarding (Subaccounts ✅)
Vendors now create proper Paystack Subaccounts during payout setup.
- **API Change:** Migrated from `/transferrecipient` to `/subaccount`.
- **Fields:** We now store `paystack_subaccount_code` and `paystack_subaccount_id`.
- **Validation:** Creation now requires a verified Bank Account, Phone Number, and Matric Number.

## 2. Marketplace Gating 🛑
Vendors who haven't completed onboarding are now strictly filtered out of the marketplace.
- **Gating Logic:** A vendor is "payout ready" only if they have a subaccount, phone, and matric number.
- **Product Filtering:** Products from non-ready vendors are hidden from:
  - Product Listing
  - Search Results
  - Featured Sections
  - Category Pages
- **Checkout Blocking:** If a vendor somehow becomes un-onboarded after an item is in a cart, the checkout flow will fail fast with a clear error message.

## 3. Shared Platform Fee Logic 🧮
Fee calculation is now unified across backend and frontend:
- **Rules:** 2.5% for all orders, plus ₦100 flat fee for orders ≥ ₦1,000.
- **Utility:** [paymentSplit.util.ts](file:///c:/Users/JESSE/Documents/Github%20Repo/Muba%20X%20Cardano/muba-college-ecommerce/src/utils/paymentSplit.util.ts) is imported everywhere fees are displayed or calculated.

## 4. Vendor Dashboard Improvements 📈
The Payouts page now features an **Onboarding Checklist** to help vendors identify missing requirements.
- **Checklist:** Tracks Phone, Matric Number, and Paystack Subaccount status.
- **Status Badge:** Explicitly shows "Eligible to Sell" or "Not Eligible to Sell".

## 5. Security & Safety 🔐
- **Fail Fast:** Initialization fails immediately if a subaccount creation or resolution error occurs.
- **Auditable Splits:** Split information is stored in transaction metadata for transparency.
- **No Residual Logic:** Manual Transfer APIs and `recipient_code` references have been purged.

---
### Verification Summary
- [x] Subaccounts created in Paystack Dashboard (via integration tests).
- [x] Marketplace filters products correctly.
- [x] Checkout fails if vendor lacks subaccount.
- [x] Fees match between frontend summary and backend initialization.
