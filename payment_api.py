import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import sqlite3
import threading
from datetime import datetime, timezone
from email.utils import parseaddr
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, urlsplit
from urllib.request import Request, urlopen


HOST = os.environ.get("ORIKI_API_HOST", "127.0.0.1")
PORT = int(os.environ.get("ORIKI_API_PORT", "5000"))
DATABASE_PATH = os.environ.get(
    "ORIKI_DB_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "orders.sqlite3"),
)
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")
CALLBACK_URL = os.environ.get(
    "ORIKI_CALLBACK_URL", "http://127.0.0.1:5500/shop.html"
)
ALLOWED_ORIGIN = os.environ.get("ORIKI_ALLOWED_ORIGIN", "")
MAX_REQUEST_BYTES = 16 * 1024
MAX_LINES = 20
MAX_QUANTITY = 10
DATABASE_LOCK = threading.Lock()

PRODUCT_PRICES_NGN = {
    "classic-royal-agbada": 85000,
    "scarlet-elegance-aso-oke": 82000,
    "burgundy-aso-oke-ensemble": 125000,
    "modern-senator-set": 65000,
    "royal-ankara-shirt": 96000,
    "sapphire-adire-shirt": 62000,
    "crimson-aso-ebi-statement": 108000,
    "ivory-senator-tunic": 72000,
    "earthtone-heritage-dress": 86000,
    "ember-agbada": 120000,
    "midnight-senator-set": 68000,
    "spiralled-ankara-set": 78000,
    "solar-ankara-ensemble": 115000,
    "sunburst-adire-ensemble": 98000,
    "golden-ankara-heritage-set": 105000,
    "royal-stripe-aso-oke": 118000,
}


class RequestError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


class PaystackError(Exception):
    pass


def normalize_checkout(payload):
    if not isinstance(payload, dict):
        raise RequestError("Request body must be a JSON object.")

    email = payload.get("email")
    if not isinstance(email, str) or len(email) > 254:
        raise RequestError("Enter a valid email address.")
    parsed_email = parseaddr(email.strip())[1]
    if parsed_email != email.strip() or not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+", parsed_email
    ):
        raise RequestError("Enter a valid email address.")

    items = payload.get("items")
    if not isinstance(items, list) or not items or len(items) > MAX_LINES:
        raise RequestError("Your cart is empty or contains too many products.")

    normalized_items = []
    seen_ids = set()
    total_ngn = 0
    for item in items:
        if not isinstance(item, dict):
            raise RequestError("Cart contains an invalid product.")
        product_id = item.get("id")
        quantity = item.get("quantity")
        if not isinstance(product_id, str) or product_id not in PRODUCT_PRICES_NGN:
            raise RequestError("Cart contains an unavailable product.")
        if type(quantity) is not int or quantity < 1 or quantity > MAX_QUANTITY:
            raise RequestError("Product quantities must be between 1 and 10.")

        unit_price_ngn = PRODUCT_PRICES_NGN[product_id]
        normalized_items.append({
            "id": product_id,
            "quantity": quantity,
            "unit_price_ngn": unit_price_ngn,
        })
        total_ngn += unit_price_ngn * quantity
        seen_ids.add(product_id)

    if len(seen_ids) != len(normalized_items):
        raise RequestError("Each product must appear only once in the cart.")

    return {
        "email": parsed_email,
        "items": normalized_items,
        "amount_kobo": total_ngn * 100,
    }


def payment_matches_order(transaction, expected_amount_kobo):
    return (
        isinstance(transaction, dict)
        and transaction.get("status") == "success"
        and transaction.get("currency") == "NGN"
        and transaction.get("amount") == expected_amount_kobo
    )


def open_database():
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            reference TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            amount_kobo INTEGER NOT NULL,
            currency TEXT NOT NULL,
            items_json TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    return connection


def paystack_request(path, payload=None):
    if not PAYSTACK_SECRET_KEY:
        raise PaystackError("Payment service is not configured on the server.")
    if PAYSTACK_SECRET_KEY.startswith("sk_live_") and os.environ.get(
        "ORIKI_ALLOW_LIVE_PAYMENTS"
    ) != "true":
        raise PaystackError("Live payments are disabled by server configuration.")

    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        f"https://api.paystack.co{path}",
        data=body,
        headers={
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST" if body is not None else "GET",
    )

    try:
        with urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        logging.warning("Paystack API returned HTTP %s.", error.code)
        raise PaystackError("Paystack could not process the request.") from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        logging.warning("Paystack API request failed: %s", error)
        raise PaystackError("Could not reach Paystack. Please try again.") from error

    if not result.get("status"):
        raise PaystackError("Paystack could not process the request.")
    return result.get("data", {})


def current_time():
    return datetime.now(timezone.utc).isoformat()


class PaymentHandler(BaseHTTPRequestHandler):
    server_version = "ORIKI-Payments/1.0"

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Vary", "Origin")
        origin = self.headers.get("Origin")
        if origin and self.origin_is_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    @staticmethod
    def origin_is_allowed(origin):
        if ALLOWED_ORIGIN:
            return origin == ALLOWED_ORIGIN
        parsed = urlsplit(origin)
        return parsed.scheme in ("http", "https") and parsed.hostname in (
            "localhost",
            "127.0.0.1",
        )

    def do_OPTIONS(self):
        origin = self.headers.get("Origin")
        if origin and not self.origin_is_allowed(origin):
            self.send_json(403, {"error": "Origin is not allowed."})
            return
        self.send_json(200, {})

    def do_GET(self):
        parsed_url = urlsplit(self.path)
        if parsed_url.path == "/api/health":
            self.send_json(200, {
                "ok": True,
                "payments_configured": bool(PAYSTACK_SECRET_KEY),
            })
            return
        if parsed_url.path != "/api/payments/verify":
            self.send_json(404, {"error": "Endpoint not found."})
            return
        if not self.check_origin():
            return

        reference = parse_qs(parsed_url.query).get("reference", [""])[0]
        if not re.fullmatch(r"[A-Za-z0-9_-]{8,100}", reference):
            self.send_json(400, {"error": "A valid payment reference is required."})
            return

        try:
            with DATABASE_LOCK:
                connection = open_database()
                order = connection.execute(
                    "SELECT * FROM orders WHERE reference = ?", (reference,)
                ).fetchone()
                connection.close()

            if order is None:
                self.send_json(404, {"error": "Order reference was not found."})
                return
            if order["status"] == "success":
                self.send_json(200, {
                    "status": "success",
                    "reference": reference,
                })
                return

            transaction = paystack_request(
                f"/transaction/verify/{quote(reference, safe='')}"
            )
            if payment_matches_order(transaction, order["amount_kobo"]):
                payment_status = "success"
                response_status = 200
            elif transaction.get("status") == "success":
                payment_status = "amount_mismatch"
                response_status = 409
            else:
                payment_status = transaction.get("status", "pending")
                response_status = 202

            with DATABASE_LOCK:
                connection = open_database()
                connection.execute(
                    "UPDATE orders SET status = ?, updated_at = ? WHERE reference = ?",
                    (payment_status, current_time(), reference),
                )
                connection.commit()
                connection.close()

            result = {"status": payment_status, "reference": reference}
            if payment_status == "amount_mismatch":
                result["error"] = "Payment amount could not be verified."
            self.send_json(response_status, result)
        except PaystackError as error:
            self.send_json(502, {"error": str(error)})
        except sqlite3.Error:
            logging.exception("Could not read or update the order database.")
            self.send_json(500, {"error": "Could not verify this order right now."})

    def do_POST(self):
        if urlsplit(self.path).path != "/api/payments/initialize":
            self.send_json(404, {"error": "Endpoint not found."})
            return
        if not self.check_origin():
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(400, {"error": "Invalid request size."})
            return
        if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
            self.send_json(413, {"error": "Request is empty or too large."})
            return
        if "application/json" not in self.headers.get("Content-Type", "").lower():
            self.send_json(415, {"error": "Request must use JSON."})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
            checkout = normalize_checkout(payload)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "Request body must contain valid JSON."})
            return
        except RequestError as error:
            self.send_json(error.status, {"error": str(error)})
            return

        reference = secrets.token_urlsafe(18)
        timestamp = current_time()

        try:
            with DATABASE_LOCK:
                connection = open_database()
                connection.execute(
                    """
                    INSERT INTO orders
                    (reference, email, amount_kobo, currency, items_json, status,
                     created_at, updated_at)
                    VALUES (?, ?, ?, 'NGN', ?, 'initializing', ?, ?)
                    """,
                    (
                        reference,
                        checkout["email"],
                        checkout["amount_kobo"],
                        json.dumps(checkout["items"]),
                        timestamp,
                        timestamp,
                    ),
                )
                connection.commit()
                connection.close()

            transaction = paystack_request(
                "/transaction/initialize",
                {
                    "email": checkout["email"],
                    "amount": checkout["amount_kobo"],
                    "currency": "NGN",
                    "reference": reference,
                    "callback_url": CALLBACK_URL,
                    "metadata": {
                        "custom_fields": [
                            {
                                "display_name": "ORIKI order",
                                "variable_name": "oriki_order",
                                "value": reference,
                            }
                        ]
                    },
                },
            )
            authorization_url = transaction.get("authorization_url")
            returned_reference = transaction.get("reference")
            if not authorization_url or returned_reference != reference:
                raise PaystackError("Paystack returned an invalid checkout response.")

            with DATABASE_LOCK:
                connection = open_database()
                connection.execute(
                    "UPDATE orders SET status = 'pending', updated_at = ? WHERE reference = ?",
                    (current_time(), reference),
                )
                connection.commit()
                connection.close()

            self.send_json(200, {
                "authorization_url": authorization_url,
                "reference": reference,
            })
        except PaystackError as error:
            with DATABASE_LOCK:
                connection = open_database()
                connection.execute(
                    "UPDATE orders SET status = 'initialization_failed', updated_at = ? WHERE reference = ?",
                    (current_time(), reference),
                )
                connection.commit()
                connection.close()
            self.send_json(502, {"error": str(error)})
        except sqlite3.Error:
            logging.exception("Could not save an order.")
            self.send_json(500, {"error": "Could not save the order. Please try again."})

    def check_origin(self):
        origin = self.headers.get("Origin")
        if origin and not self.origin_is_allowed(origin):
            self.send_json(403, {"error": "Origin is not allowed."})
            return False
        return True


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    server = ThreadingHTTPServer((HOST, PORT), PaymentHandler)
    logging.info("ORIKI payment API listening on http://%s:%s", HOST, PORT)
    if not PAYSTACK_SECRET_KEY:
        logging.warning("PAYSTACK_SECRET_KEY is not set; payment initialization is disabled.")
    server.serve_forever()


if __name__ == "__main__":
    main()
