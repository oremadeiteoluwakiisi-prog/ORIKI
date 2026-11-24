(() => {
const cartGrid = document.getElementById("cartGrid");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");
const checkoutEmail = document.getElementById("checkoutEmail");
const checkoutStatus = document.getElementById("checkoutStatus");
const NGN_PER_USD = 1600;
const apiBase = (window.ORIKI_API_BASE || "/api").replace(/\/$/, "");

function formatPrice(priceNgn) {
    const selectedCurrency =
        localStorage.getItem("oriki-currency") === "USD" ? "USD" : "NGN";
    if (selectedCurrency === "USD") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2
        }).format(priceNgn / NGN_PER_USD);
    }
    return `₦${priceNgn.toLocaleString("en-NG")}`;
}

function renderCart() {
    const cart = window.orikiCart.get();
    cartGrid.replaceChildren();

    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.reduce(
        (total, item) => total + item.priceNgn * item.quantity,
        0
    );
    cartCount.textContent =
        `${totalQuantity} ${totalQuantity === 1 ? "ITEM" : "ITEMS"}`;
    cartTotal.textContent = formatPrice(totalPrice);
    checkoutButton.disabled = cart.length === 0;
    checkoutEmail.disabled = cart.length === 0;

    if (cart.length === 0) {
        const empty = document.createElement("div");
        empty.className = "cart-empty";
        empty.innerHTML =
            '<p>Your cart is empty.</p><a href="collection.html">Explore the collection</a>';
        cartGrid.appendChild(empty);
        return;
    }

    cart.forEach(item => {
        const row = document.createElement("article");
        row.className = "cart-item";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;

        const details = document.createElement("div");
        details.className = "cart-item-details";
        const name = document.createElement("h2");
        name.textContent = item.name;
        const price = document.createElement("p");
        price.textContent = formatPrice(item.priceNgn);
        details.append(name, price);

        const quantity = document.createElement("div");
        quantity.className = "cart-quantity";

        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.textContent = "−";
        decrease.setAttribute("aria-label", `Decrease ${item.name} quantity`);

        const quantityValue = document.createElement("span");
        quantityValue.textContent = item.quantity;
        quantityValue.setAttribute("aria-label", "Quantity");

        const increase = document.createElement("button");
        increase.type = "button";
        increase.textContent = "+";
        increase.setAttribute("aria-label", `Increase ${item.name} quantity`);

        decrease.addEventListener("click", () => {
            item.quantity -= 1;
            const updatedCart = item.quantity > 0
                ? cart
                : cart.filter(cartItem => cartItem.id !== item.id);
            window.orikiCart.save(updatedCart);
            renderCart();
        });

        increase.addEventListener("click", () => {
            item.quantity += 1;
            window.orikiCart.save(cart);
            renderCart();
        });

        quantity.append(decrease, quantityValue, increase);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "cart-remove";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
            window.orikiCart.save(cart.filter(cartItem => cartItem.id !== item.id));
            renderCart();
        });

        row.append(image, details, quantity, remove);
        cartGrid.appendChild(row);
    });
}

checkoutButton.addEventListener("click", async () => {
    const cart = window.orikiCart.get();
    if (!cart.length) return;

    if (!checkoutEmail.reportValidity()) return;

    checkoutButton.disabled = true;
    checkoutStatus.textContent = "Connecting securely to Paystack...";
    try {
        const response = await fetch(`${apiBase}/payments/initialize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: checkoutEmail.value.trim(),
                items: cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity
                }))
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Could not start payment. Please try again.");
        }
        if (!result.authorization_url) {
            throw new Error("Paystack did not return a checkout link.");
        }
        window.location.assign(result.authorization_url);
    } catch (error) {
        checkoutStatus.textContent = error instanceof TypeError
            ? "Could not reach the payment server. Check that the API is running, then try again."
            : error.message;
        checkoutButton.disabled = false;
    }
});

async function verifyPaymentReturn() {
    const parameters = new URLSearchParams(window.location.search);
    const reference = parameters.get("reference");
    if (!reference) return;

    checkoutStatus.textContent = "Verifying your payment...";
    checkoutButton.disabled = true;
    try {
        const response = await fetch(
            `${apiBase}/payments/verify?reference=${encodeURIComponent(reference)}`
        );
        const result = await response.json();
        if (!response.ok && response.status !== 202) {
            throw new Error(result.error || "We could not verify this payment.");
        }

        if (result.status === "success") {
            window.orikiCart.save([]);
            checkoutStatus.textContent = "Payment confirmed. Thank you for your order!";
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            checkoutStatus.textContent =
                "Payment is not confirmed yet. Your cart is saved; please try again shortly.";
            checkoutButton.disabled = false;
        }
    } catch (error) {
        checkoutStatus.textContent = error instanceof TypeError
            ? "Could not reach the payment server to verify your payment. Your cart is saved."
            : error.message;
        checkoutButton.disabled = false;
    }
}

renderCart();
verifyPaymentReturn();
})();
