import unittest

from payment_api import RequestError, normalize_checkout, payment_matches_order


class CheckoutValidationTests(unittest.TestCase):
    def test_calculates_total_from_server_catalog_not_client_price(self):
        checkout = normalize_checkout({
            "email": "buyer@example.com",
            "items": [
                {
                    "id": "scarlet-elegance-aso-oke",
                    "quantity": 2,
                    "priceNgn": 1,
                }
            ],
        })

        self.assertEqual(checkout["amount_kobo"], 16_400_000)
        self.assertEqual(checkout["items"][0]["unit_price_ngn"], 82_000)

    def test_rejects_unknown_products(self):
        with self.assertRaises(RequestError):
            normalize_checkout({
                "email": "buyer@example.com",
                "items": [{"id": "unknown-product", "quantity": 1}],
            })

    def test_rejects_invalid_quantities(self):
        for quantity in (0, -1, 1.5, True, 11):
            with self.subTest(quantity=quantity):
                with self.assertRaises(RequestError):
                    normalize_checkout({
                        "email": "buyer@example.com",
                        "items": [{
                            "id": "scarlet-elegance-aso-oke",
                            "quantity": quantity,
                        }],
                    })

    def test_rejects_invalid_email(self):
        with self.assertRaises(RequestError):
            normalize_checkout({
                "email": "not-an-email",
                "items": [{
                    "id": "scarlet-elegance-aso-oke",
                    "quantity": 1,
                }],
            })

    def test_payment_must_match_amount_currency_and_success_status(self):
        transaction = {"status": "success", "amount": 8_200_000, "currency": "NGN"}
        self.assertTrue(payment_matches_order(transaction, 8_200_000))
        self.assertFalse(payment_matches_order(transaction, 8_200_001))
        self.assertFalse(payment_matches_order(
            {**transaction, "currency": "USD"}, 8_200_000
        ))
        self.assertFalse(payment_matches_order(
            {**transaction, "status": "pending"}, 8_200_000
        ))


if __name__ == "__main__":
    unittest.main()
