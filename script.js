// Game State & Data
const INGREDIENTS = {
    'bottom-bun': { name: 'Seed Bun', cost: 0.50, unlocked: true },
    'top-bun': { name: 'Seed Bun Top', cost: 0.50, unlocked: true },
    'patty': { name: 'Lentil Patty', cost: 2.00, unlocked: true },
    'cheese': { name: 'Vegan Cheddar', cost: 1.00, unlockPrice: 50, unlocked: false },
    'lettuce': { name: 'Spinach', cost: 0.50, unlockPrice: 50, unlocked: false },
    'tomato': { name: 'Tomato', cost: 0.75, unlockPrice: 75, unlocked: false },
    'onion': { name: 'Red Onion', cost: 0.50, unlockPrice: 75, unlocked: false },
    'pickles': { name: 'Pickles', cost: 0.50, unlockPrice: 100, unlocked: false },
    'bacon': { name: 'Seitan Bacon', cost: 2.50, unlockPrice: 150, unlocked: false }
};

const SECRET_RECIPES = [
    { name: "THE EARTH SHAKER", items: ['bottom-bun', 'patty', 'cheese', 'patty', 'cheese', 'bacon', 'top-bun'], bonus: 50 },
    { name: "FOREST GIANT", items: ['bottom-bun', 'lettuce', 'tomato', 'onion', 'pickles', 'lettuce', 'top-bun'], bonus: 40 },
    { name: "THE GREEN MAMMOTH", items: ['bottom-bun', 'patty', 'bacon', 'cheese', 'lettuce', 'tomato', 'onion', 'top-bun'], bonus: 75 }
];

let currentBurger = [];
let activeOrders = [];
let money = 50.00;
let ordersServed = 0;
let restaurantRating = 1.0;
let secretMenuUnlocked = false;
const MAX_ORDERS = 4;
let orderCounter = 1;

// DOM Elements
const moneyEl = document.getElementById('money');
const ordersServedEl = document.getElementById('orders-served');
const ratingEl = document.getElementById('rating-value');
const currentBurgerEl = document.getElementById('current-burger');
const ticketsContainer = document.getElementById('tickets-container');
const currentCostEl = document.getElementById('current-cost');
const messageOverlayEl = document.getElementById('message-overlay');
const messageTextEl = document.getElementById('message-text');
const upgradesContainer = document.getElementById('upgrades-container');
const controlsContainer = document.getElementById('controls');
const managementDrawer = document.getElementById('management-drawer');

function init() {
    renderIngredientBins();
    updateStats();
    renderUpgrades();
    
    for(let i=0; i<3; i++) {
        generateNewOrder();
    }
    
    // Core Buttons
    document.getElementById('serve-btn').onclick = serveBurger;
    document.getElementById('trash-btn').onclick = trashFood;
    
    // Management Drawer Toggles
    document.getElementById('open-management-btn').onclick = () => {
        managementDrawer.classList.remove('hidden');
        renderUpgrades(); // Refresh state
    };
    document.getElementById('close-management-btn').onclick = () => {
        managementDrawer.classList.add('hidden');
    };
}

function renderIngredientBins() {
    controlsContainer.innerHTML = '';
    Object.keys(INGREDIENTS).forEach(key => {
        const ing = INGREDIENTS[key];
        const bin = document.createElement('div');
        bin.className = `ingredient-bin ${ing.unlocked ? '' : 'locked'}`;
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'bin-icon';
        const icon = document.createElement('div');
        icon.className = `ingredient ${key}`;
        iconContainer.appendChild(icon);

        const nameLabel = document.createElement('span');
        nameLabel.className = 'bin-name';
        nameLabel.textContent = ing.name;

        const costLabel = document.createElement('span');
        costLabel.className = 'bin-cost';
        costLabel.textContent = `$${ing.cost.toFixed(2)}`;

        bin.appendChild(iconContainer);
        bin.appendChild(nameLabel);
        bin.appendChild(costLabel);

        bin.onclick = () => {
            if (INGREDIENTS[key].unlocked) {
                addIngredient(key);
            } else {
                showMessage('Ingredient Locked!', 'error');
            }
        };
        controlsContainer.appendChild(bin);
    });
}

function generateNewOrder() {
    if (activeOrders.length >= MAX_ORDERS) return;

    let orderItems = [];
    let orderName = `Order #${orderCounter++}`;
    let isSecret = false;
    let revenueBonus = 0;

    if (secretMenuUnlocked && Math.random() < 0.25) {
        const secret = SECRET_RECIPES[Math.floor(Math.random() * SECRET_RECIPES.length)];
        orderItems = [...secret.items];
        orderName = secret.name;
        isSecret = true;
        revenueBonus = secret.bonus;
    } else {
        orderItems = ['bottom-bun'];
        const availableMiddles = Object.keys(INGREDIENTS).filter(k => k !== 'bottom-bun' && k !== 'top-bun' && INGREDIENTS[k].unlocked);
        const numIngredients = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < numIngredients; i++) {
            orderItems.push(availableMiddles[Math.floor(Math.random() * availableMiddles.length)]);
        }
        orderItems.push('top-bun');
    }
    
    activeOrders.push({
        id: orderName,
        items: orderItems,
        revenue: calculateRevenue(orderItems) + revenueBonus,
        isSecret: isSecret
    });
    renderTickets();
}

function renderTickets() {
    ticketsContainer.innerHTML = '';
    activeOrders.forEach(order => {
        const ticket = document.createElement('div');
        ticket.className = `ticket ${order.isSecret ? 'secret-ticket' : ''}`;
        
        const header = document.createElement('div');
        header.className = 'ticket-header';
        header.textContent = order.id;
        
        const itemsList = document.createElement('div');
        itemsList.className = 'ticket-items';
        // Keeps the Bottom-to-Top ticket order
        order.items.forEach(item => {
            const span = document.createElement('span');
            span.textContent = INGREDIENTS[item].name;
            itemsList.appendChild(span);
        });

        const price = document.createElement('div');
        price.className = 'ticket-price';
        price.textContent = `$${order.revenue.toFixed(2)}`;

        ticket.appendChild(header);
        ticket.appendChild(itemsList);
        ticket.appendChild(price);
        ticketsContainer.appendChild(ticket);
    });
}

function addIngredient(ingredient) {
    currentBurger.push(ingredient);
    renderBurger();
}

function renderBurger() {
    currentBurgerEl.innerHTML = '';
    currentBurger.forEach((ing, index) => {
        const el = document.createElement('div');
        el.className = `ingredient ${ing}`;
        el.style.zIndex = index + 10; // Ensure subsequent items are visually on top
        currentBurgerEl.appendChild(el);
    });
    currentCostEl.textContent = `$${calculateCost(currentBurger).toFixed(2)}`;
}

function serveBurger() {
    if (currentBurger.length === 0) return;

    let matchedOrderIndex = -1;
    for(let i=0; i<activeOrders.length; i++) {
        if(arraysMatch(currentBurger, activeOrders[i].items)) {
            matchedOrderIndex = i;
            break;
        }
    }

    const cost = calculateCost(currentBurger);

    if (matchedOrderIndex !== -1) {
        const order = activeOrders[matchedOrderIndex];
        const profit = order.revenue - cost;
        money += profit;
        ordersServed++;
        restaurantRating = Math.min(5.0, restaurantRating + 0.1);
        
        showMessage(order.isSecret ? `LEGENDARY! +$${profit.toFixed(2)}` : `Perfect! +$${profit.toFixed(2)}`, 'success');
        activeOrders.splice(matchedOrderIndex, 1);
        renderTickets();
        trashBurger();
        updateStats();
        setTimeout(generateNewOrder, 1000);
    } else {
        money -= cost;
        restaurantRating = Math.max(1.0, restaurantRating - 0.2);
        showMessage(`Wrong order! -$${cost.toFixed(2)}`, 'error');
        updateStats();
        trashBurger();
    }
}

function trashFood() {
    const cost = calculateCost(currentBurger);
    if (cost > 0) {
        money -= cost;
        showMessage(`Food trashed! -$${cost.toFixed(2)}`, 'error');
        updateStats();
    }
    trashBurger();
}

function trashBurger() {
    currentBurger = [];
    renderBurger();
}

function arraysMatch(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) if (arr1[i] !== arr2[i]) return false;
    return true;
}

function calculateCost(arr) {
    return arr.reduce((sum, item) => sum + INGREDIENTS[item].cost, 0);
}

function calculateRevenue(arr) {
    return calculateCost(arr) * (2.0 + (restaurantRating * 0.2)); 
}

function updateStats() {
    moneyEl.textContent = `$${money.toFixed(2)}`;
    ratingEl.textContent = restaurantRating.toFixed(1);
}

function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    
    // Secret Menu
    const secretCard = createUpgradeCard("SECRET PERMIT", "Unlock legendary recipes.", secretMenuUnlocked ? 0 : 300, secretMenuUnlocked, () => {
        if (money >= 300) {
            money -= 300;
            secretMenuUnlocked = true;
            updateStats();
            renderUpgrades();
            showMessage('SECRET MENU UNLOCKED!', 'success');
        }
    });
    upgradesContainer.appendChild(secretCard);

    // Ingredients
    Object.keys(INGREDIENTS).forEach(key => {
        const ing = INGREDIENTS[key];
        if (ing.unlockPrice) {
            const card = createUpgradeCard(ing.name, "New ingredient.", ing.unlocked ? 0 : ing.unlockPrice, ing.unlocked, () => {
                if (money >= ing.unlockPrice) {
                    money -= ing.unlockPrice;
                    ing.unlocked = true;
                    updateStats();
                    renderUpgrades();
                    renderIngredientBins();
                    showMessage(`Unlocked ${ing.name}!`, 'success');
                }
            });
            upgradesContainer.appendChild(card);
        }
    });
}

function createUpgradeCard(name, desc, price, isPurchased, onBuy) {
    const card = document.createElement('div');
    card.className = `upgrade-card ${isPurchased ? 'purchased' : ''}`;
    card.innerHTML = `
        <h3>${name.toUpperCase()}</h3>
        <p>${desc}</p>
        <button class="buy-btn" ${isPurchased ? 'disabled' : ''}>
            ${isPurchased ? 'Purchased' : `Buy for $${price}`}
        </button>
    `;
    if (!isPurchased) card.querySelector('button').onclick = onBuy;
    return card;
}

function showMessage(text, type) {
    messageTextEl.textContent = text;
    messageOverlayEl.className = `message-${type}`;
    messageOverlayEl.style.animation = 'none';
    messageOverlayEl.offsetHeight; 
    messageOverlayEl.style.animation = null;
    setTimeout(() => { messageOverlayEl.classList.add('hidden'); }, 2000);
}

init();
