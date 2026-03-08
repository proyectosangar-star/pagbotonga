document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables ---
    let productsList = [];
    let cart = JSON.parse(localStorage.getItem('botonga_cart')) || [];

    // --- DOM Elements ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const themeToggle = document.getElementById('theme-toggle');
    
    const cartToggle = document.getElementById('cart-toggle');
    const closeCart = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const sideCart = document.getElementById('side-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCount = document.querySelector('.cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    const productsGrid = document.getElementById('products-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const categoryCards = document.querySelectorAll('.category-card');

    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const modalContent = document.getElementById('modal-content');

    const chatToggle = document.getElementById('chat-toggle');
    const chatPanel = document.getElementById('chat-panel');
    const closeChat = document.getElementById('close-chat');
    const chatInputText = document.getElementById('chat-input-text');
    const sendChatBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');

    // --- Footer Year ---
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- Mobile Menu Toggle ---
    mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });

    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });

    // --- Theme Toggle ---
    // Check initial preference from localStorage or OS
    const initialTheme = localStorage.getItem('botonga_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (initialTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('botonga_theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });

    // --- Fetch Products ---
    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            productsList = data;
            renderProducts(productsList);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            productsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Error cargando productos. Por favor intente luego.</p>';
        });

    // --- Render Products ---
    function renderProducts(products) {
        productsGrid.innerHTML = '';
        if (products.length === 0) {
            productsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No se encontraron productos.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card fade-in visible'; // Immediately visible when added
            
            card.innerHTML = `
                <div class="product-img-wrapper" data-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title" data-id="${product.id}">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">Agregar al carrito</button>
                </div>
            `;
            productsGrid.appendChild(card);
        });

        // Add event listeners for new elements
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                addToCart(id);
            });
        });

        document.querySelectorAll('.product-img-wrapper, .product-title').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                openModal(id);
            });
        });
    }

    // --- Filtering and Sorting ---
    function filterAndSortProducts() {
        let filtered = productsList;
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const sortMode = sortFilter.value;

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
        }

        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        if (sortMode === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortMode === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else {
            // Relevancia: Sort by ID
            filtered.sort((a, b) => a.id - b.id);
        }

        renderProducts(filtered);
    }

    searchInput.addEventListener('input', filterAndSortProducts);
    categoryFilter.addEventListener('change', filterAndSortProducts);
    sortFilter.addEventListener('change', filterAndSortProducts);

    // Category Cards click
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.category;
            categoryFilter.value = cat;
            document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
            filterAndSortProducts();
        });
    });

    // --- Cart Logic ---
    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Hide/show cart count depending on amount
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
            cartTotalPrice.textContent = '$0.00';
            localStorage.setItem('botonga_cart', JSON.stringify(cart));
            return;
        }

        cartItemsContainer.innerHTML = '';
        let totalCost = 0;

        cart.forEach(item => {
            totalCost += item.price * item.quantity;
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });

        cartTotalPrice.textContent = '$' + totalCost.toFixed(2);
        localStorage.setItem('botonga_cart', JSON.stringify(cart));

        // Event listeners for cart controls
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.classList.contains('plus')) changeQuantity(id, 1);
                if (e.target.classList.contains('minus')) changeQuantity(id, -1);
            });
        });

        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find nearest button in case click is on the icon
                const targetBtn = e.target.closest('.cart-item-remove');
                const id = parseInt(targetBtn.dataset.id);
                removeFromCart(id);
            });
        });
    }

    function addToCart(id) {
        const product = productsList.find(p => p.id === id);
        if (!product) return;

        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        updateCartUI();
        openCartSidebar();
    }

    function changeQuantity(id, delta) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                updateCartUI();
            }
        }
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
    }

    // Initialize cart on load
    updateCartUI();

    // --- Side Cart Toggle ---
    function openCartSidebar() {
        sideCart.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCartSidebar() {
        sideCart.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    cartToggle.addEventListener('click', openCartSidebar);
    closeCart.addEventListener('click', closeCartSidebar);
    cartOverlay.addEventListener('click', closeCartSidebar);

    // --- Modal Logic ---
    function openModal(id) {
        const product = productsList.find(p => p.id === id);
        if (!product) return;

        modalContent.innerHTML = `
            <div class="modal-content-grid">
                <div class="modal-img-container">
                    <img src="${product.image}" alt="${product.name}" class="modal-img">
                </div>
                <div class="modal-details">
                    <span class="product-category">${product.category}</span>
                    <h2>${product.name}</h2>
                    <div class="product-price" style="font-size: 2rem; margin: 1rem 0; color: var(--clr-primary); font-weight: bold;">$${product.price.toFixed(2)}</div>
                    <p class="modal-desc">${product.description}</p>
                    <button class="btn btn-primary btn-lg mt-4" id="modal-add-to-cart" style="width: 100%;">Agregar al carrito</button>
                </div>
            </div>
        `;

        document.getElementById('modal-add-to-cart').addEventListener('click', () => {
            addToCart(product.id);
            closeProductModal();
        });

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeProductModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeModalBtn.addEventListener('click', closeProductModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeProductModal();
    });

    // --- Chat Logic ---
    chatToggle.addEventListener('click', () => {
        chatPanel.classList.toggle('active');
    });

    closeChat.addEventListener('click', () => {
        chatPanel.classList.remove('active');
    });

    function sendChatMessage() {
        const text = chatInputText.value.trim();
        if (!text) return;

        // User message
        const userMsg = document.createElement('div');
        userMsg.className = 'message outgoing';
        userMsg.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(userMsg);
        
        chatInputText.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Bot response simulation delay
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'message incoming';
            botMsg.innerHTML = `<p>Gracias por contactarnos. Un agente de Botonga revisará tu mensaje pronto.</p>`;
            chatMessages.appendChild(botMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInputText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // --- Hero Carousel Auto Slide ---
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;

    function nextSlide() {
        if (slides.length === 0) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    setInterval(nextSlide, 5000);

    // --- Scroll Animations ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });
});
