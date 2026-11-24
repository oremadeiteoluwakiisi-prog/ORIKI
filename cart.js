(() => {
    const storageKey = "oriki-cart";

    function readItems() {
        const storedItems = localStorage.getItem(storageKey);
        if (!storedItems) return [];

        let items;
        try {
            items = JSON.parse(storedItems);
        } catch (error) {
            throw new Error("Your saved cart could not be read. Clear the damaged cart data and try again.");
        }

        if (!Array.isArray(items) || items.some(item =>
            !item ||
            typeof item.id !== "string" ||
            typeof item.name !== "string" ||
            typeof item.image !== "string" ||
            !Number.isFinite(item.priceNgn) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1
        )) {
            throw new Error("Your saved cart has invalid data. Clear the damaged cart data and try again.");
        }
        return items;
    }

    function updateBadges(items) {
        const count = items.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll(".cart-count").forEach(badge => {
            badge.textContent = String(count);
            badge.hidden = count === 0;
        });
    }

    function saveItems(items) {
        localStorage.setItem(storageKey, JSON.stringify(items));
        updateBadges(items);
        window.dispatchEvent(new CustomEvent("oriki-cart-change", { detail: { items } }));
    }

    function add(product) {
        if (!product || typeof product.id !== "string" ||
            typeof product.name !== "string" || typeof product.image !== "string" ||
            !Number.isFinite(product.priceNgn) || product.priceNgn < 0) {
            throw new Error("This product could not be added to your cart.");
        }

        const items = readItems();
        const existingItem = items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            items.push({ ...product, quantity: 1 });
        }
        saveItems(items);
    }

    function setQuantity(id, quantity) {
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error("Cart quantity must be at least one.");
        }
        const items = readItems();
        const item = items.find(cartItem => cartItem.id === id);
        if (!item) throw new Error("That item is no longer in your cart.");
        item.quantity = quantity;
        saveItems(items);
    }

    function remove(id) {
        const items = readItems().filter(item => item.id !== id);
        saveItems(items);
    }

    window.orikiCart = {
        add,
        getItems: readItems,
        remove,
        setQuantity
    };

    try {
        updateBadges(readItems());
    } catch (error) {
        console.error(error);
    }

    window.addEventListener("storage", event => {
        if (event.key === storageKey) {
            try {
                updateBadges(readItems());
            } catch (error) {
                console.error(error);
            }
        }
    });
})();
