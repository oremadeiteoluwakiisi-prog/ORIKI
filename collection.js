
// =====================================
// ORIKI COLLECTION PAGE
// JAVASCRIPT FUNCTIONALITY
// =====================================


// =====================================
// 1. MOBILE NAVIGATION
// =====================================

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {

    // Open and close the mobile menu
    menuToggle.addEventListener("click", () => {

        const isOpen = navMenu.classList.toggle("active");

        menuToggle.setAttribute("aria-expanded", isOpen);
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );

    });

    // Close menu when a navigation link is clicked
    const navLinks = navMenu.querySelectorAll(".nav-link");

    navLinks.forEach(link => {

        link.addEventListener("click", () => {

            navMenu.classList.remove("active");

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");

        });

    });

    // Close menu when Escape is pressed
    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            navMenu.classList.remove("active");

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");

        }

    });

}


// =====================================
// 2. HEADER SCROLL EFFECT
// =====================================

const header = document.getElementById("header");

if (header) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }

    });

}


// =====================================
// 3. PRODUCT FILTERS
// =====================================

const products = [
    {
        name: "Classic Royal Agbada",
        category: "senator",
        gender: "men",
        price: "₦85,000",
        image: "assets/Product 2.jpg",
        alt: "Traditional men's Yoruba agbada",
        tag: "Bestseller"
    },
    {
        name: "Scarlet Elegance Aso Oke",
        category: "asooke",
        gender: "women",
        price: "₦82,000",
        image: "assets/Product 1.jpg",
        alt: "Traditional Yoruba women's aso oke outfit"
    },
    {
        name: "Burgundy Aso Oke Ensemble",
        category: "asooke",
        gender: "women",
        price: "₦125,000",
        image: "assets-collection/download (4).jpg",
        alt: "Women's burgundy Aso Oke ensemble",
        tag: "New"
    },
    {
        name: "Modern Senator Set",
        category: "senator",
        gender: "men",
        price: "₦65,000",
        image: "assets/Product 3.webp",
        alt: "Men's contemporary traditional outfit",
        tag: "New arrival"
    },
    {
        name: "Royal Ankara Shirt",
        category: "ankara",
        gender: "men",
        price: "₦96,000",
        image: "assets-collection/product 2.jpg",
        alt: "Men's royal patterned Ankara shirt"
    },
    {
        name: "Sapphire Adire Shirt",
        category: "ankara",
        gender: "men",
        price: "₦62,000",
        image: "assets/new-arrival-1.jpg",
        alt: "Men's contemporary Adire shirt"
    },
    {
        name: "Crimson Aso Ebi Statement",
        category: "asooke",
        gender: "women",
        price: "₦108,000",
        image: "assets/new-arrival-2.jpg",
        alt: "Women's statement Aso Ebi outfit",
        tag: "Limited"
    },
    {
        name: "Ivory Senator Tunic",
        category: "senator",
        gender: "men",
        price: "₦72,000",
        image: "assets/new-arrivl-3.jpg",
        alt: "Ivory senator-style men's tunic"
    },
    {
        name: "Earthtone Heritage Dress",
        category: "ankara",
        gender: "women",
        price: "₦86,000",
        image: "assets/oriki-craft.jpg",
        alt: "Women's Yoruba heritage dress"
    },
    {
        name: "Ember Agbada",
        category: "senator",
        gender: "women",
        price: "₦120,000",
        image: "assets/custom-tailoring.jpg",
        alt: "Custom tailored women's agbada",
        tag: "Custom"
    },
    {
        name: "Midnight Senator Set",
        category: "senator",
        gender: "men",
        price: "₦68,000",
        image: "assets/Product 3.webp",
        alt: "Men's midnight senator set"
    },
    {
        name: "Spiralled Ankara Set",
        category: "ankara",
        gender: "men",
        price: "₦78,000",
        image: "assets-collection/Men Ankara.jpg",
        alt: "Men's red and blue patterned Ankara set",
        tag: "New Arrival"
    },
    {
        name: "Solar Ankara Ensemble",
        category: "ankara",
        gender: "women",
        price: "₦115,000",
        image: "assets-collection/product 4.jpg",
        alt: "Women's red, black, and patterned Ankara ensemble",
        tag: "New"
    },
    {
        name: "Sunburst Adire Ensemble",
        category: "ankara",
        gender: "women",
        price: "₦98,000",
        image: "assets-collection/product 7.jpg",
        alt: "Women's rust and cream Adire Ankara ensemble",
        tag: "New"
    },
    {
        name: "Golden Ankara Heritage Set",
        category: "ankara",
        gender: "women",
        price: "₦105,000",
        image: "assets-collection/product 9.jpg",
        alt: "Women's gold and blue patterned Ankara ensemble",
        tag: "New"
    },
    {
        name: "Royal Stripe Aso Oke",
        category: "asooke",
        gender: "women",
        price: "₦118,000",
        image: "assets-collection/product 11.jpg",
        alt: "Women's striped Yoruba Aso Oke ensemble",
        tag: "New"
    }
];

const productGrid = document.getElementById("productGrid");
const productsCount = document.getElementById("productsCount");

if (productGrid) {
    products.forEach(product => {
        const card = document.createElement("article");
        card.className = "collection-product-card";
        card.dataset.category = `${product.category} ${product.gender}`;
        const productId = product.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const imageLink = document.createElement("a");
        imageLink.href = "#";
        imageLink.className = "collection-product-image";
        imageLink.setAttribute("aria-label", `View ${product.name}`);
        imageLink.addEventListener("click", event => event.preventDefault());

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.alt;
        image.loading = "lazy";
        imageLink.appendChild(image);

        if (product.tag) {
            const tag = document.createElement("span");
            tag.className = "collection-product-tag";
            tag.textContent = product.tag;
            imageLink.appendChild(tag);
        }

        const info = document.createElement("div");
        info.className = "collection-product-info";

        const details = document.createElement("div");
        const category = document.createElement("p");
        category.className = "collection-product-category";
        category.textContent = `${product.gender}'s collection`;
        const name = document.createElement("h3");
        name.textContent = product.name;
        details.append(category, name);

        const price = document.createElement("p");
        price.className = "collection-product-price";
        price.textContent = product.price;

        info.append(details, price);

        const actions = document.createElement("div");
        actions.className = "collection-product-actions";

        let isLiked = false;
        try {
            isLiked = localStorage.getItem(`oriki-liked-${productId}`) === "true";
        } catch (error) {
            isLiked = false;
        }

        const likeButton = document.createElement("button");
        likeButton.type = "button";
        likeButton.className = "product-action like-action";
        likeButton.setAttribute("aria-pressed", String(isLiked));
        likeButton.innerHTML = `<span aria-hidden="true">${isLiked ? "♥" : "♡"}</span> Like`;

        likeButton.addEventListener("click", () => {
            const liked = likeButton.getAttribute("aria-pressed") !== "true";
            likeButton.setAttribute("aria-pressed", String(liked));
            likeButton.innerHTML = `<span aria-hidden="true">${liked ? "♥" : "♡"}</span> ${liked ? "Liked" : "Like"}`;
            try {
                localStorage.setItem(`oriki-liked-${productId}`, String(liked));
            } catch (error) {
                // The like remains active for this visit if storage is unavailable.
            }
        });

        const commentButton = document.createElement("button");
        commentButton.type = "button";
        commentButton.className = "product-action comment-action";
        commentButton.setAttribute("aria-expanded", "false");
        commentButton.textContent = "Comment";

        const contactLink = document.createElement("a");
        contactLink.className = "product-action contact-action";
        contactLink.href = `mailto:hello@oriki.com?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}&body=${encodeURIComponent(`Hello ORIKI,\n\nI would like to know more about ${product.name}.`)}`;
        contactLink.textContent = "Contact";

        const cartButton = document.createElement("button");
        cartButton.type = "button";
        cartButton.className = "product-action cart-action";
        cartButton.textContent = "Add to Cart";
        cartButton.setAttribute("aria-label", `Add ${product.name} to cart`);

        cartButton.addEventListener("click", () => {
            const priceNgn = Number(String(product.price).replace(/[^0-9]/g, ""));
            if (!window.orikiCart) {
                try {
                    const storedCart = JSON.parse(localStorage.getItem("oriki-cart") || "[]");
                    const existingItem = storedCart.find(item => item.id === productId);
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        storedCart.push({
                            id: productId,
                            name: product.name,
                            priceNgn,
                            image: product.image,
                            quantity: 1
                        });
                    }
                    localStorage.setItem("oriki-cart", JSON.stringify(storedCart));
                    document.querySelectorAll(".cart-count").forEach(badge => {
                        badge.textContent = storedCart.reduce((total, item) => total + item.quantity, 0);
                        badge.hidden = false;
                    });
                } catch (error) {
                    window.alert("Please enable browser storage and try adding the item again.");
                    return;
                }
            } else {
                window.orikiCart.add({
                    id: productId,
                    name: product.name,
                    priceNgn,
                    image: product.image
                });
            }
            cartButton.textContent = "Added ✓";
            window.setTimeout(() => {
                cartButton.textContent = "Add to Cart";
            }, 1200);
        });

        actions.append(likeButton, commentButton, contactLink, cartButton);

        const commentPanel = document.createElement("div");
        commentPanel.className = "product-comment-panel";
        commentPanel.hidden = true;

        const commentLabel = document.createElement("label");
        commentLabel.htmlFor = `comment-${productId}`;
        commentLabel.textContent = `How do you feel about the colors on ${product.name}?`;

        const commentInput = document.createElement("textarea");
        commentInput.id = `comment-${productId}`;
        commentInput.rows = 3;
        commentInput.maxLength = 500;
        commentInput.placeholder = "Tell us if you like the colors...";

        const commentSubmit = document.createElement("button");
        commentSubmit.type = "button";
        commentSubmit.className = "product-comment-submit";
        commentSubmit.textContent = "Send Feedback";

        const commentStatus = document.createElement("p");
        commentStatus.className = "product-comment-status";
        commentStatus.setAttribute("role", "status");

        commentButton.addEventListener("click", () => {
            const opening = commentPanel.hidden;
            commentPanel.hidden = !opening;
            commentButton.setAttribute("aria-expanded", String(opening));
            if (opening) commentInput.focus();
        });

        commentSubmit.addEventListener("click", () => {
            const comment = commentInput.value.trim();
            if (!comment) {
                commentStatus.textContent = "Please write a comment before sending.";
                commentInput.focus();
                return;
            }

            try {
                const storageKey = "oriki-product-comments";
                const savedComments = JSON.parse(localStorage.getItem(storageKey) || "[]");
                savedComments.push({
                    product: product.name,
                    comment,
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem(storageKey, JSON.stringify(savedComments));
            } catch (error) {
                // Feedback can still be sent by email if storage is unavailable.
            }

            commentStatus.textContent = "Opening your email app...";
            const subject = encodeURIComponent(`Color feedback: ${product.name}`);
            const body = encodeURIComponent(`Product: ${product.name}\n\nMy feedback:\n${comment}`);
            window.location.href = `mailto:hello@oriki.com?subject=${subject}&body=${body}`;
        });

        commentPanel.append(commentLabel, commentInput, commentSubmit, commentStatus);
        card.append(imageLink, info, actions, commentPanel);
        productGrid.appendChild(card);
    });
}

const filterButtons = document.querySelectorAll("[data-filter]");
const productCards = productGrid
    ? productGrid.querySelectorAll("[data-category]")
    : [];

const isMenPage = window.location.pathname.toLowerCase().endsWith("/men.html");
const isWomenPage = window.location.pathname.toLowerCase().endsWith("/women.html");

const applyProductFilter = (selectedFilter) => {
    const matchingButton = Array.from(filterButtons).find(
        button => button.dataset.filter === selectedFilter
    ) || Array.from(filterButtons).find(
        button => button.dataset.filter === "all"
    );

    if (!matchingButton) return;

    filterButtons.forEach(filterButton => {
        filterButton.classList.remove("active");
        filterButton.setAttribute("aria-pressed", "false");
    });

    matchingButton.classList.add("active");
    matchingButton.setAttribute("aria-pressed", "true");

    productCards.forEach(card => {
        const productCategories = card.dataset.category.split(" ");
        const matchesGender =
            (!isMenPage || productCategories.includes("men")) &&
            (!isWomenPage || productCategories.includes("women"));
        const matchesSelection =
            selectedFilter === "all" ||
            selectedFilter === "men" ||
            selectedFilter === "women" ||
            productCategories.includes(selectedFilter);
        card.hidden = !(matchesGender && matchesSelection);
    });

    const visibleCount = Array.from(productCards).filter(card => !card.hidden).length;

    if (productsCount) {
        productsCount.textContent =
            `${visibleCount} ${visibleCount === 1 ? "PIECE" : "PIECES"}`;
    }
};

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        applyProductFilter(button.dataset.filter);
    });
});

if (isMenPage) {
    applyProductFilter("men");
} else if (isWomenPage) {
    applyProductFilter("women");
} else {
    const requestedFilter = new URLSearchParams(window.location.search).get("filter");
    if (requestedFilter) {
        applyProductFilter(requestedFilter);
    }
}


// =====================================
// 4. END OF COLLECTION JAVASCRIPT
// =====================================
