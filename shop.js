const cartGrid = document.getElementById("cartGrid");
const cartTotal = document.getElementById("cartTotal");
const cartItemCount = document.getElementById("cartItemCount");
const orderRequestLink = document.getElementById("orderRequestLink");

function renderCart() {
    let items;
    try {
        items = window.orikiCart.getItems();
    } catch (error) {
        cartGrid.textContent = error.message;
        cartItemCount.textContent = "CART UNAVAILABLE";
        orderRequestLink.setAttribute("aria-disabled", "true");
        orderRequestLink.removeAttribute("href");
        return;
    }

    cartGrid.replaceChildren();
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const totalNgn = items.reduce((total, item) => total + item.priceNgn * item.quantity, 0);
    cartItemCount.textContent = `${count} ${count === 1 ? "ITEM" : "ITEMS"}`;
    cartTotal.textContent = `₦${totalNgn.toLocaleString("en-NG")}`;

    if (items.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "cart-empty";
        const message = document.createElement("p");
        message.textContent = "Your cart is waiting for something special.";
        const link = document.createElement("a");
        link.href = "collection.html";
        link.textContent = "EXPLORE THE COLLECTION";
        emptyState.append(message, link);
        cartGrid.appendChild(emptyState);
        orderRequestLink.setAttribute("aria-disabled", "true");
        orderRequestLink.removeAttribute("href");
        return;
    }

    items.forEach(item => {
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
        price.textContent = `₦${item.priceNgn.toLocaleString("en-NG")}`;
        details.append(name, price);

        const quantity = document.createElement("div");
        quantity.className = "cart-quantity";
        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.textContent = "−";
        decrease.setAttribute("aria-label", `Decrease quantity of ${item.name}`);
        decrease.disabled = item.quantity <= 1;
        decrease.addEventListener("click", () => changeCart(() =>
            window.orikiCart.setQuantity(item.id, item.quantity - 1)
        ));
        const quantityValue = document.createElement("span");
        quantityValue.textContent = String(item.quantity);
        const increase = document.createElement("button");
        increase.type = "button";
        increase.textContent = "+";
        increase.setAttribute("aria-label", `Increase quantity of ${item.name}`);
        increase.addEventListener("click", () => changeCart(() =>
            window.orikiCart.setQuantity(item.id, item.quantity + 1)
        ));
        quantity.append(decrease, quantityValue, increase);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "cart-remove";
        remove.textContent = "Remove";
        remove.setAttribute("aria-label", `Remove ${item.name} from cart`);
        remove.addEventListener("click", () => changeCart(() =>
            window.orikiCart.remove(item.id)
        ));

        row.append(image, details, quantity, remove);
        cartGrid.appendChild(row);
    });

    const orderLines = items.map(item =>
        `${item.name} — ${item.quantity} x ₦${item.priceNgn.toLocaleString("en-NG")}`
    );
    const emailBody = [
        "Hello ORIKI,",
        "",
        "I would like to request the following items:",
        ...orderLines,
        "",
        `Total: ₦${totalNgn.toLocaleString("en-NG")}`
    ].join("\n");
    orderRequestLink.href = `mailto:hello@oriki.com?subject=${encodeURIComponent("ORIKI order request")}&body=${encodeURIComponent(emailBody)}`;
    orderRequestLink.removeAttribute("aria-disabled");
}

function changeCart(update) {
    try {
        update();
    } catch (error) {
        window.alert(error.message);
    }
}

window.addEventListener("oriki-cart-change", renderCart);
renderCart();
