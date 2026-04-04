# Shiprocket Setup

This project now supports a fully server-driven fulfillment flow:

1. Customer places an order on the website.
2. Razorpay captures payment.
3. The website saves the payment record in Airtable.
4. The backend creates the Shiprocket order.
5. The backend assigns an AWB.
6. The backend requests pickup automatically.
7. Shiprocket webhook updates shipment status back into Airtable and sends customer tracking emails.

## 1. Shiprocket dashboard setup

Complete these in Shiprocket first:

- Finish company details, KYC, pickup address, and wallet recharge.
  Source: https://support.shiprocket.in/support/solutions/articles/43000607399-what-are-the-basic-details-required-to-start-shipping-with-shiprocket-
- Create a dedicated API user in `Settings -> API`.
  Source: https://support.shiprocket.in/support/solutions/articles/43000604103-how-to-create-an-api-user-can-i-have-more-than-one-api-users-
- Note your pickup location name exactly as it appears in Shiprocket. The code defaults to `Primary`, but you should set `SHIPROCKET_PICKUP_LOCATION` explicitly if your saved pickup name is different.
- If you use sales channels in Shiprocket, copy the relevant channel ID into `SHIPROCKET_CHANNEL_ID`. If you do not use a specific channel, leave it blank.

## 2. Runtime secrets

Set these secrets in the environment where your Next.js API routes run:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `AIRTABLE_TOKEN`
- `AIRTABLE_ORDERS_BASE_ID`
- `MAILJET_API_KEY`
- `MAILJET_SECRET`
- `PUBLIC_SITE_URL`
- `SECURITY_SIGNING_SECRET`
- `SHIPROCKET_EMAIL`
- `SHIPROCKET_PASSWORD`
- `SHIPROCKET_PICKUP_LOCATION`
- `SHIPROCKET_CHANNEL_ID` (optional)
- `SHIPROCKET_WEBHOOK_SECRET`

`SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` must be the Shiprocket API user credentials, not the primary dashboard login.

If Airtable shows `Shiprocket auth failed (403)` with an HTML response, treat it as an auth/config incident first:

- Verify `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` in production match an active Shiprocket API user from `Settings -> API`.
- Reset or recreate the API user if needed.
- Redeploy after updating the secrets.
- Retry failed orders through `/api/cron/retry-shiprocket` once auth is fixed.
- If fresh API-user credentials still return `403`, Shiprocket may be blocking the Cloudflare-origin request before it reaches the API.

## 3. Razorpay webhook

Create this webhook in Razorpay:

- URL: `https://your-domain.com/api/webhooks/razorpay`
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET`
- Events:
  - `payment.captured`
  - `payment.failed`

This route is the server-side safety net. If the browser closes after payment, the webhook still fulfills the order.

## 4. Shiprocket webhook

Create this webhook in Shiprocket:

- URL: `https://your-domain.com/api/webhooks/tracking-updates`
- Token/header value: optional according to Shiprocket's docs

This app accepts either:

- query param `token`
- header `x-api-key`

Use the neutral `tracking-updates` path because Shiprocket may reject webhook URLs containing `shiprocket`, `kartrocket`, `sr`, or `kr`.
Shiprocket's webhook documentation also says the callback URL should return only HTTP `200`, so this endpoint is intentionally permissive for webhook delivery.

When shipment status changes, the webhook updates Airtable and emails the customer for major shipping milestones.

## 5. Airtable fields

Your `Abandoned Carts` table should include at least:

- `Razorpay Order ID`
- `Pack`
- `Pack ID`
- `Quantity`
- `Price`
- `Amount`
- `Customer Name`
- `Customer Email`
- `Customer Phone`
- `Shipping Address`
- `Shipping City`
- `Shipping State`
- `Shipping Pincode`
- `Full Shipping Address`
- `Promo Code`
- `Discount Amount`
- `Status`
- `Created At`
- `Converted At`

Your `Payments` table should include at least:

- `Payment ID`
- `Order ID`
- `Pack`
- `Quantity`
- `Amount`
- `Customer Name`
- `Customer Email`
- `Customer Phone`
- `Shipping Address`
- `Shipping City`
- `Shipping State`
- `Shipping Pincode`
- `Full Shipping Address`
- `Promo Code`
- `Discount Amount`
- `Timestamp`
- `Shipping Status`
- `Shiprocket Order ID`
- `Shipment ID`
- `AWB Code`
- `Courier Name`
- `Estimated Delivery`
- `Delivered At`

## 6. Expected flow after this setup

After a successful payment:

- `/api/order/verify` confirms the payment and saves the order.
- If Razorpay webhook reaches the server first, the frontend still completes successfully instead of failing on a duplicate confirmation race.
- The server sends the order to Shiprocket with the customer shipping details.
- The server requests AWB assignment and then pickup automatically.
- The Shiprocket webhook keeps the website and Airtable in sync as shipping progresses.

## 7. Recommended test

Use one low-value test order and verify each step in this order:

1. Website checkout reaches the thank-you page.
2. Airtable `Abandoned Carts` record flips from `pending` to `converted`.
3. Airtable `Payments` record is created with full shipping data.
4. Shiprocket receives the order.
5. AWB is assigned.
6. Pickup is requested.
7. Tracking works on `/track`.
8. Shiprocket webhook updates status back into Airtable.
