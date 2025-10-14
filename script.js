// ===== VULTEAT SCRIPT — Motor de recomendación y lógica de negocio =====

// ===== DATOS DEL MENÚ =====
const menuData = {
    burgers: [
        { id: 'b1', name: 'La Trufa Suprema', price: 15000, tags: ['gourmet', 'carne'], icon: 'burger', description: 'Hamburguesa premium con trufa negra y queso manchego' },
        { id: 'b2', name: 'Fuego Urbano', price: 13000, tags: ['picante', 'carne'], icon: 'burger', description: 'Carne angus con jalapeños y salsa chipotle ardiente' },
        { id: 'b3', name: 'Verde Minimal', price: 12000, tags: ['vegetariano', 'clasico'], icon: 'burger', description: 'Hamburguesa vegetal con aguacate y pesto de albahaca' },
        { id: 'b4', name: 'Malbec District', price: 16000, tags: ['gourmet', 'carne'], icon: 'burger', description: 'Carne reducida en vino Malbec con cebolla caramelizada' },
        { id: 'b5', name: 'Solar BBQ', price: 14000, tags: ['clasico', 'carne'], icon: 'burger', description: 'Clásica BBQ con tocino ahumado y salsa bourbon' }
    ],
    salads: [
        { id: 's1', name: 'Nórdica', price: 13000, tags: ['gourmet', 'vegetariano'], icon: 'salad', description: 'Salmón ahumado, espinaca y frutos rojos' },
        { id: 's2', name: 'Mediterránea', price: 11000, tags: ['vegetariano', 'clasico'], icon: 'salad', description: 'Tomate, pepino, aceitunas y queso feta' },
        { id: 's3', name: 'Zen Verde', price: 12000, tags: ['vegetariano', 'gourmet'], icon: 'salad', description: 'Mix de lechugas orgánicas con vinagreta de jengibre' }
    ],
    sides: [
        { id: 'si1', name: 'Papas trufadas', price: 5000, tags: ['gourmet'], icon: 'fries', description: 'Papas crujientes con aceite de trufa' },
        { id: 'si2', name: 'Aros de cebolla', price: 4000, tags: ['clasico'], icon: 'onion', description: 'Aros de cebolla empanizados y dorados' }
    ],
    drinks: [
        { id: 'd1', name: 'Jugo natural', price: 3500, tags: ['clasico'], icon: 'juice', description: 'Jugo recién exprimido de frutas del día' },
        { id: 'd2', name: 'Soda artesanal', price: 4000, tags: ['gourmet'], icon: 'soda', description: 'Soda con sabores únicos y naturales' },
        { id: 'd3', name: 'Agua mineral', price: 2000, tags: ['clasico'], icon: 'water', description: 'Agua mineral importada' }
    ]
};

// ===== ESTADO DE LA APLICACIÓN =====
let appState = {
    budget: 0,
    preferences: [],
    cart: [],
    currentScreen: 'screen-welcome'
};

// ===== NAVEGACIÓN ENTRE PANTALLAS =====
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        appState.currentScreen = screenId;
    }
}

// ===== MOTOR DE RECOMENDACIÓN =====
function generateRecommendations() {
    const { budget, preferences } = appState;
    const recommendations = [];

    // Si el presupuesto es muy bajo
    if (budget < 11000) {
        const affordableOptions = [];
        
        // Agregar bebidas y acompañamientos
        menuData.drinks.forEach(d => {
            if (d.price <= budget) affordableOptions.push({ type: 'drink', item: d });
        });
        menuData.sides.forEach(s => {
            if (s.price <= budget) affordableOptions.push({ type: 'side', item: s });
        });

        // Intentar combo bebida + acompañamiento
        if (budget >= 6000) {
            recommendations.push({
                title: 'Combo ligero',
                items: [menuData.sides[1], menuData.drinks[0]],
                total: 7500,
                match: 60
            });
        }

        return recommendations;
    }

    // Filtrar menú principal por preferencias
    let filteredBurgers = menuData.burgers;
    let filteredSalads = menuData.salads;

    if (preferences.length > 0) {
        filteredBurgers = menuData.burgers.filter(b => 
            b.tags.some(tag => preferences.includes(tag))
        );
        filteredSalads = menuData.salads.filter(s => 
            s.tags.some(tag => preferences.includes(tag))
        );
    }

    // Combinar hamburguesas + ensaladas para opciones principales
    const mains = [...filteredBurgers, ...filteredSalads];

    // Generar combos completos
    mains.forEach(main => {
        if (main.price > budget) return;

        const remainingBudget = budget - main.price;

        // Solo principal
        if (remainingBudget < 4000) {
            const match = calculateMatch(main, preferences);
            recommendations.push({
                title: 'Opción individual',
                items: [main],
                total: main.price,
                match
            });
        }

        // Principal + bebida
        menuData.drinks.forEach(drink => {
            const comboPrice = main.price + drink.price;
            if (comboPrice <= budget && remainingBudget >= drink.price) {
                const match = calculateMatch(main, preferences);
                recommendations.push({
                    title: 'Combo simple',
                    items: [main, drink],
                    total: comboPrice,
                    match: match + 10
                });
            }
        });

        // Principal + acompañamiento + bebida (combo completo)
        menuData.sides.forEach(side => {
            menuData.drinks.forEach(drink => {
                const comboPrice = main.price + side.price + drink.price;
                if (comboPrice <= budget) {
                    const match = calculateMatch(main, preferences);
                    recommendations.push({
                        title: 'Combo completo',
                        items: [main, side, drink],
                        total: comboPrice,
                        match: match + 20
                    });
                }
            });
        });
    });

    // Ordenar por match y precio
    recommendations.sort((a, b) => {
        if (b.match !== a.match) return b.match - a.match;
        return b.total - a.total; // Preferir combos que aprovechen más el presupuesto
    });

    // Retornar top 3 recomendaciones únicas
    const uniqueRecs = [];
    const seen = new Set();

    for (const rec of recommendations) {
        const key = rec.items.map(i => i.id).join('-');
        if (!seen.has(key) && uniqueRecs.length < 3) {
            seen.add(key);
            uniqueRecs.push(rec);
        }
    }

    return uniqueRecs;
}

// Calcular match score basado en preferencias
function calculateMatch(item, preferences) {
    if (preferences.length === 0) return 50;
    
    const matches = item.tags.filter(tag => preferences.includes(tag)).length;
    return Math.min(100, 50 + (matches * 25));
}

// ===== RENDERIZADO =====
function renderRecommendations() {
    const container = document.getElementById('recommendations-container');
    const recommendations = generateRecommendations();

    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">😔</div>
                <p>Con tu presupuesto actual no podemos armar un combo.<br>
                ¿Quieres explorar el menú completo?</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recommendations.map((rec, idx) => `
        <div class="recommendation-card">
            <span class="recommendation-badge">${idx === 0 ? '⭐ Mejor opción' : `Opción ${idx + 1}`}</span>
            <h3>${rec.title}</h3>
            <div class="combo-items">
                ${rec.items.map(item => `
                    <div class="combo-item">
                        <span>${item.emoji} ${item.name}</span>
                        <span>${item.price.toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
                <span style="font-size: 1.5rem; font-weight: 700; color: #00d4ff;">
                    ${rec.total.toLocaleString()}
                </span>
                <button class="btn-add" onclick="addComboToCart(${idx})">Agregar combo</button>
            </div>
        </div>
    `).join('');
}

function renderMenu() {
    renderProductCategory('burgers-container', menuData.burgers);
    renderProductCategory('salads-container', menuData.salads);
    renderProductCategory('sides-container', menuData.sides);
    renderProductCategory('drinks-container', menuData.drinks);
}

function renderProductCategory(containerId, products) {
    const container = document.getElementById(containerId);
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">${product.emoji}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toLocaleString()}</div>
            </div>
            <p class="product-description">${product.description}</p>
            <div class="product-tags">
                ${product.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <button class="btn-add" onclick="addToCart('${product.id}')">Agregar</button>
        </div>
    `).join('');
}

function renderCart() {
    const container = document.getElementById('cart-items');
    
    if (appState.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        updateCartSummary();
        return;
    }

    container.innerHTML = appState.cart.map((item, idx) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.emoji} ${item.name}</div>
                <div class="cart-item-price">${item.price.toLocaleString()}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${idx})">Quitar</button>
        </div>
    `).join('');

    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = appState.cart.reduce((sum, item) => sum + item.price, 0);
    const taxes = Math.round(subtotal * 0.19);
    const total = subtotal + taxes;

    document.getElementById('subtotal').textContent = `${subtotal.toLocaleString()}`;
    document.getElementById('taxes').textContent = `${taxes.toLocaleString()}`;
    document.getElementById('total').textContent = `${total.toLocaleString()}`;
}

function updateFloatingCart() {
    const count = appState.cart.length;
    document.getElementById('cart-count').textContent = count;
    
    const floatingCart = document.getElementById('floating-cart');
    floatingCart.style.display = count > 0 ? 'flex' : 'none';
}

// ===== ACCIONES DEL CARRITO =====
function addToCart(productId) {
    const allProducts = [
        ...menuData.burgers,
        ...menuData.salads,
        ...menuData.sides,
        ...menuData.drinks
    ];
    
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        appState.cart.push(product);
        updateFloatingCart();
        showNotification(`${product.name} agregado`);
    }
}

function addComboToCart(recommendationIndex) {
    const recommendations = generateRecommendations();
    const combo = recommendations[recommendationIndex];
    
    if (combo) {
        combo.items.forEach(item => {
            appState.cart.push(item);
        });
        updateFloatingCart();
        showNotification('Combo agregado al pedido');
    }
}

function removeFromCart(index) {
    appState.cart.splice(index, 1);
    renderCart();
    updateFloatingCart();
}

// ===== NOTIFICACIONES =====
function showNotification(message) {
    // Simple feedback visual (puedes mejorar esto con toast notifications)
    const floatingCart = document.getElementById('floating-cart');
    floatingCart.style.transform = 'scale(1.1)';
    setTimeout(() => {
        floatingCart.style.transform = 'scale(1)';
    }, 200);
}

// ===== EVENTOS =====
document.addEventListener('DOMContentLoaded', () => {
    // Pantalla 1: Continuar con presupuesto
    document.getElementById('btn-continue').addEventListener('click', () => {
        const budgetInput = document.getElementById('budget');
        const budget = parseInt(budgetInput.value) || 0;
        
        if (budget < 1000) {
            alert('Por favor ingresa un presupuesto válido');
            return;
        }
        
        appState.budget = budget;
        document.getElementById('budget-display').textContent = `${budget.toLocaleString()}`;
        showScreen('screen-preferences');
    });

    // Pantalla 2: Selección de preferencias
    document.querySelectorAll('.preference-card').forEach(card => {
        card.addEventListener('click', () => {
            const pref = card.dataset.pref;
            
            if (appState.preferences.includes(pref)) {
                appState.preferences = appState.preferences.filter(p => p !== pref);
                card.classList.remove('selected');
            } else {
                appState.preferences.push(pref);
                card.classList.add('selected');
            }
        });
    });

    document.getElementById('btn-get-recommendations').addEventListener('click', () => {
        renderRecommendations();
        showScreen('screen-recommendations');
    });

    // Pantalla 3: Ver menú completo
    document.getElementById('btn-see-all').addEventListener('click', () => {
        renderMenu();
        showScreen('screen-menu');
    });

    // Pantalla 4: Ver carrito desde menú
    document.getElementById('btn-view-cart').addEventListener('click', () => {
        renderCart();
        showScreen('screen-cart');
    });

    // Floating cart click
    document.getElementById('floating-cart').addEventListener('click', () => {
        if (appState.cart.length > 0) {
            renderCart();
            showScreen('screen-cart');
        }
    });

    // Pantalla 5: Volver al menú
    document.getElementById('btn-back-to-menu').addEventListener('click', () => {
        showScreen('screen-menu');
    });

    // Confirmar pedido (ahora va a pantalla de pago)
    document.getElementById('btn-confirm-order').addEventListener('click', () => {
        if (appState.cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        renderPaymentSummary();
        showScreen('screen-payment');
        initializePayPal();
    });

    // Volver al carrito desde pantalla de pago
    document.getElementById('btn-back-to-cart').addEventListener('click', () => {
        showScreen('screen-cart');
    });

    // Nuevo pedido
    document.getElementById('btn-new-order').addEventListener('click', () => {
        // Reset state
        appState = {
            budget: 0,
            preferences: [],
            cart: [],
            currentScreen: 'screen-welcome'
        };
        
        // Reset UI
        document.getElementById('budget').value = '';
        document.querySelectorAll('.preference-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        updateFloatingCart();
        showScreen('screen-welcome');
    });

    // Enter key en input de presupuesto
    document.getElementById('budget').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('btn-continue').click();
        }
    });
});

// ===== RESUMEN PRE-PAGO =====
function renderPaymentSummary() {
    // Presupuesto
    document.getElementById('summary-budget').textContent = `${appState.budget.toLocaleString()}`;
    
    // Preferencias
    const prefsContainer = document.getElementById('summary-preferences');
    if (appState.preferences.length === 0) {
        prefsContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">Sin preferencias seleccionadas</p>';
    } else {
        prefsContainer.innerHTML = appState.preferences.map(pref => 
            `<span class="pref-tag">${pref}</span>`
        ).join('');
    }
    
    // Items del carrito
    const itemsContainer = document.getElementById('summary-items');
    itemsContainer.innerHTML = appState.cart.map(item => `
        <div class="summary-item">
            <span class="summary-item-name">${item.emoji} ${item.name}</span>
            <span class="summary-item-price">${item.price.toLocaleString()}</span>
        </div>
    `).join('');
    
    // Total
    const subtotal = appState.cart.reduce((sum, item) => sum + item.price, 0);
    const taxes = Math.round(subtotal * 0.19);
    const total = subtotal + taxes;
    
    document.getElementById('summary-total').textContent = `${total.toLocaleString()}`;
}

// ===== INTEGRACIÓN PAYPAL =====
function initializePayPal() {
    const subtotal = appState.cart.reduce((sum, item) => sum + item.price, 0);
    const taxes = Math.round(subtotal * 0.19);
    const total = subtotal + taxes;
    
    // Convertir de pesos colombianos a dólares (tasa aproximada: 1 USD = 4000 COP)
    const totalUSD = (total / 4000).toFixed(2);
    
    // Limpiar contenedor anterior
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = '';
    
    // Verificar si PayPal SDK está cargado
    if (typeof paypal === 'undefined') {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; background: rgba(255,50,50,0.1); border-radius: 12px; color: #ff5050;">
                <p><strong>⚠️ PayPal no está configurado</strong></p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                    Por favor configura tu Client ID de PayPal en el archivo HTML
                </p>
            </div>
        `;
        return;
    }
    
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
        },
        
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    description: 'Pedido VULTEAT',
                    amount: {
                        currency_code: 'USD',
                        value: totalUSD,
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: (subtotal / 4000).toFixed(2)
                            },
                            tax_total: {
                                currency_code: 'USD',
                                value: (taxes / 4000).toFixed(2)
                            }
                        }
                    },
                    items: appState.cart.map(item => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: 'USD',
                            value: (item.price / 4000).toFixed(2)
                        },
                        quantity: '1'
                    }))
                }]
            });
        },
        
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(orderData) {
                // Pago exitoso
                console.log('Pago completado:', orderData);
                
                // Mostrar pantalla de éxito con detalles
                document.getElementById('transaction-id').textContent = orderData.id;
                document.getElementById('amount-paid').textContent = `${total.toLocaleString()} COP`;
                
                showScreen('screen-success');
            });
        },
        
        onError: function(err) {
            console.error('Error en el pago:', err);
            alert('Hubo un error procesando tu pago. Por favor intenta de nuevo.');
        },
        
        onCancel: function(data) {
            console.log('Pago cancelado:', data);
            alert('Pago cancelado. Puedes intentar de nuevo cuando quieras.');
        }
        
    }).render('#paypal-button-container');
}

// ===== OPCIONAL: INTEGRACIÓN CON THREE.JS =====
// Si tienes three.min.js cargado, puedes agregar efectos 3D sutiles:
/*
if (typeof THREE !== 'undefined') {
    // Ejemplo: Partículas de fondo animadas
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    document.body.appendChild(renderer.domElement);
    
    // Agregar geometría decorativa (ejemplo: partículas)
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 500; i++) {
        vertices.push(
            Math.random() * 2000 - 1000,
            Math.random() * 2000 - 1000,
            Math.random() * 2000 - 1000
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.PointsMaterial({ color: 0x00d4ff, size: 2, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    camera.position.z = 500;
    
    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    animate();
}
*/