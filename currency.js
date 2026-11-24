const NGN_PER_USD = 1600;
const CURRENCY_STORAGE_KEY = "oriki-currency";

const originalTextValues = new WeakMap();

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
});

function formatNgNToUsd(amount) {
    return currencyFormatter.format(amount / NGN_PER_USD);
}

function updateTextNode(node, currency) {
    if (!originalTextValues.has(node)) {
        originalTextValues.set(node, node.textContent);
    }

    const originalText = originalTextValues.get(node);
    if (currency === "USD") {
        node.textContent = originalText.replace(/₦([\d,]+)/g, (match, amount) =>
            formatNgNToUsd(Number(amount.replace(/,/g, "")))
        );
    } else {
        node.textContent = originalText;
    }
}

function updatePrices(currency) {
    const textNodes = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
    );

    let node = textNodes.nextNode();
    while (node) {
        if (node.textContent.includes("₦")) {
            updateTextNode(node, currency);
        }
        node = textNodes.nextNode();
    }
}

function updateCurrencyButton(currency) {
    document.querySelectorAll("#currencyBtn").forEach(button => {
        button.textContent = currency === "USD" ? "USD $" : "NGN ₦";
        button.setAttribute("aria-label",
            currency === "USD"
                ? "Switch prices to Nigerian naira"
                : "Switch prices to US dollars"
        );
        button.setAttribute("aria-pressed", String(currency === "USD"));
        button.title = currency === "USD"
            ? "Prices shown in US dollars"
            : "Prices shown in Nigerian naira";
    });
}

function setCurrency(currency) {
    const selectedCurrency = currency === "USD" ? "USD" : "NGN";
    try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, selectedCurrency);
    } catch (error) {
        // Currency switching still works when storage is unavailable.
    }
    updatePrices(selectedCurrency);
    updateCurrencyButton(selectedCurrency);
}

document.querySelectorAll("#currencyBtn").forEach(button => {
    button.addEventListener("click", () => {
        const currentCurrency =
            getSavedCurrency();
        setCurrency(currentCurrency === "USD" ? "NGN" : "USD");
    });
});

function getSavedCurrency() {
    try {
        return localStorage.getItem(CURRENCY_STORAGE_KEY) === "USD" ? "USD" : "NGN";
    } catch (error) {
        return "NGN";
    }
}

setCurrency(getSavedCurrency());

const priceObserver = new MutationObserver(mutations => {
    const currency = getSavedCurrency();
    if (currency === "USD") {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(addedNode => {
                if (addedNode.nodeType === Node.TEXT_NODE &&
                    addedNode.textContent.includes("₦")) {
                    updateTextNode(addedNode, "USD");
                } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
                    const textNodes = document.createTreeWalker(
                        addedNode,
                        NodeFilter.SHOW_TEXT
                    );
                    let node = textNodes.nextNode();
                    while (node) {
                        if (node.textContent.includes("₦")) {
                            updateTextNode(node, "USD");
                        }
                        node = textNodes.nextNode();
                    }
                }
            });
        });
    }
});

priceObserver.observe(document.body, { childList: true, subtree: true });
