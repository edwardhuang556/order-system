// 1. 初始化 Supabase 連線（注意：右手邊的 S 要大寫）
const SUPABASE_URL = "https://kuroqdvyzzsgqhnegici.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cm9xZHZ5enpzZ3FobmVnaWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MjY5MTUsImV4cCI6MjA5ODMwMjkxNX0.6Vb11w3WMJYWdwry_F5D35VLzzic_oodm8nyINlVvP0";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. 菜單資料
const menuProducts = [
    { id: 1, name: "寶鼻餐1", price: 120, image: "images/bb1.jpg" },
    { id: 2, name: "寶鼻餐2", price: 50, image: "images/bb2.jpg" },
    { id: 3, name: "寶鼻飲料", price: 60, image: "images/bb3.jpg" },
    { id: 4, name: "寶鼻點心", price: 45, image: "images/bb4.jpg" },
    { id: 5, name: "寶鼻抹茶蛋糕", price: 85, image: "images/bb5.jpg" }
];

// 3. 購物車狀態
let cart = [];

// 4. 畫面初始化：渲染菜單
const menuGrid = document.getElementById('menu-grid');

function renderMenu() {
    menuGrid.innerHTML = ""; 
    menuProducts.forEach(product => {
        const itemHtml = `
            <div class="menu-item">
                <img src="${product.image}" alt="${product.name}" class="product-img">
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
                <button class="add-btn" onclick="addToCart(${product.id})">加入購物車</button>
            </div>
        `;
        menuGrid.innerHTML += itemHtml;
    });
}

// 5. 加入購物車
function addToCart(productId) {
    const product = menuProducts.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);
    
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
}

// 6. 更新購物車 UI
function updateCartUI() {
    const cartList = document.getElementById('cart-list');
    const totalPriceEl = document.getElementById('total-price');
    
    if (cart.length === 0) {
        cartList.innerHTML = `<p class="empty-msg">購物車是空的</p>`;
        totalPriceEl.innerText = "$0";
        return;
    }
    
    cartList.innerHTML = "";
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        const li = document.createElement('li');
        li.className = "cart-item";
        li.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>$${item.price * item.quantity}</span>
        `;
        cartList.appendChild(li);
    });
    
    totalPriceEl.innerText = `$${total}`;
}

// 7. 送出訂單到雲端
async function submitOrder() {
    const tableNum = document.getElementById('table-num').value;
    
    if (!tableNum) {
        alert("請輸入桌號！");
        return;
    }
    if (cart.length === 0) {
        alert("購物車還是空的喔！");
        return;
    }
    
    const orderItems = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
    }));

    try {
        // ⭐ 關鍵修正：這裡一定要用 db.from，而不是 supabase.from
        const { data, error } = await db
            .from('orders')
            .insert([
                { table_number: tableNum, items: orderItems, status: '未製作' }
            ]);

        if (error) throw error;

        alert(`桌號 ${tableNum} 點餐成功！訂單已傳送到廚房。`);
        
        cart = [];
        document.getElementById('table-num').value = "";
        updateCartUI();

    } catch (error) {
        console.error("送出訂單失敗:", error);
        alert("送出訂單失敗，請稍後再試！");
    }
}

// 執行初始渲染
renderMenu();