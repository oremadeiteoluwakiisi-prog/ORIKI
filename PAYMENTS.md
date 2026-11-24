# Paystack test checkout

The storefront uses a small Python API so the Paystack secret key and trusted
product prices remain on the server. No third-party Python packages are needed.

## Local test setup

1. Create a Paystack **test** secret key in your Paystack dashboard.
2. In PowerShell, open the project folder and set the key for this terminal:

   ```powershell
   $env:PAYSTACK_SECRET_KEY = "sk_test_your_test_secret"
   $env:ORIKI_CALLBACK_URL = "http://127.0.0.1:5500/shop.html"
   python payment_api.py
   ```

3. In a second terminal, serve the website:

   ```powershell
   python -m http.server 5500
   ```

4. Open `http://127.0.0.1:5500/`, add a product, then choose **Pay securely
   with Paystack** from the cart. Paystack test cards and test mobile-money
   details are available in the Paystack documentation.

   Run the API validation tests with:

   ```powershell
   python -B -m unittest payment_api_test
   ```

The cart submits product IDs and quantities only. The API calculates prices
from its server-side catalogue, initializes a NGN payment, stores the order in
`orders.sqlite3`, and verifies the transaction reference before clearing the
cart. Prices displayed in USD are indicative; Paystack charges in NGN.

## Deployment

Deploy `payment_api.py` behind HTTPS with persistent storage. Set
`PAYSTACK_SECRET_KEY`, `ORIKI_CALLBACK_URL` to the public HTTPS cart URL,
`ORIKI_ALLOWED_ORIGIN` to the exact storefront origin, and optionally
`ORIKI_DB_PATH`, `ORIKI_API_HOST`, and `ORIKI_API_PORT`.

Set `window.ORIKI_API_BASE` in `payment-config.js` to the deployed API base URL.
Keep `ORIKI_ALLOW_LIVE_PAYMENTS` unset until live checkout has been deliberately
enabled; live secret keys are rejected by default.
