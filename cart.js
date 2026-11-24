(() => {
const CART_STORAGE_KEY = "oriki-cart";

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        // Keep the cart working in memory when browser storage is unavailable.
    }
    updateCartCount();
}

function addToCart(product) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart(cart);
}

function updateCartCount() {
    const count = getCart().reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll(".shop-btn").forEach(link => {
        link.href = "shop.html";
        let badge = link.querySelector(".cart-count");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "cart-count";
            link.appendChild(badge);
        }
        badge.textContent = count;
        badge.hidden = count === 0;
    });
}

window.orikiCart = {
    get: getCart,
    add: addToCart,
    save: saveCart
};

updateCartCount();
})();
