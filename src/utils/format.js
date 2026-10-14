export const money = n => Number(n || 0).toFixed(2)
export const fmtTime = t => { const d = new Date(t); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }
export const salesText = n => (n >= 10000 ? (n / 10000).toFixed(1) + '万+' : n)
export const STATUS_COLOR = { 待付款: '#FF5000', 待发货: '#FF5000', 待收货: '#FF5000', 已完成: '#999999', 已取消: '#999999' }
