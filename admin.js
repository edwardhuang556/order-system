// 1. 初始化 Supabase 連線（請確認這裡已經替換成你真正的金鑰）
const SUPABASE_URL = "https://kuroqdvyzzsgqhnegici.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cm9xZHZ5enpzZ3FobmVnaWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MjY5MTUsImV4cCI6MjA5ODMwMjkxNX0.6Vb11w3WMJYWdwry_F5D35VLzzic_oodm8nyINlVvP0";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const orderGrid = document.getElementById('order-grid');

// 2. 從資料庫撈取所有訂單，並畫在畫面上
async function fetchOrders() {
    try {
        // 從 orders 資料表抓取資料，依建立時間從新到舊排序
        const { data: orders, error } = await db
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 清空原本的畫面
        orderGrid.innerHTML = "";

        if (orders.length === 0) {
            orderGrid.innerHTML = "<p>目前沒有任何訂單。</p>";
            return;
        }

        // 逐筆把訂單渲染成卡片
        orders.forEach(order => {
            const card = document.createElement('div');
            // 如果已經出餐，加上 completed 的樣式
            card.className = `order-card ${order.status === '已出餐' ? 'completed' : ''}`;

            // 組合訂單內部的餐點清單 HTML
            let itemsHtml = "";
            order.items.forEach(item => {
                itemsHtml += `<li>${item.name} x ${item.quantity}</li>`;
            });

            // 設定卡片內容
            card.innerHTML = `
                <div class="order-header">
                    <span>桌號：${order.table_number} 桌</span>
                    <span>狀態：${order.status}</span>
                </div>
                <ul class="order-items">
                    ${itemsHtml}
                </ul>
                ${
                    order.status === '未製作' 
                    ? `<button class="status-btn" onclick="updateStatus(${order.id}, '已出餐')">確認出餐</button>`
                    : `<button class="status-btn done" disabled>已送達</button>`
                }
            `;
            orderGrid.appendChild(card);
        });

    } catch (error) {
        console.error("抓取訂單失敗:", error);
    }
}

// 3. 修改訂單狀態的功能
async function updateStatus(orderId, newStatus) {
    try {
        const { error } = await db
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId); // 找到對應 id 的那筆訂單

        if (error) throw error;

        // 更新成功後，重新整理畫面
        fetchOrders();
    } catch (error) {
        console.error("更新狀態失敗:", error);
        alert("更新失敗！");
    }
}

// 4. 初始化：網頁打開時立刻撈一次資料
fetchOrders();

// 5. 【大魔王功能】開啟「即時監聽 (Realtime)」
// 只要資料庫有任何變動（有人點餐或修改），不用重新整理，後台畫面就會自動更新！
db.channel('custom-all-channel')
  .on('postgres_changes', { event: '*', pattern: 'public', table: 'orders' }, (payload) => {
      console.log('資料庫有變動！自動刷新...', payload);
      fetchOrders(); // 自動重新撈取最新資料
  })
  .subscribe();