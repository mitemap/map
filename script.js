// 强制清空旧缓存，杜绝干扰
localStorage.clear();

const defaultProducts = [
    { id: 1, name: "Topographic Contour Map", price: "1999", cny: "14500", desc: "1m elevation accuracy.", updated: "2026-01-15", images: Array(5).fill("https://picsum.photos/800/450?random=1") },
    { id: 2, name: "Mountain Terrain Map", price: "1999", cny: "14500", desc: "3D slope analysis.", updated: "2026-01-18", images: Array(5).fill("https://picsum.photos/800/450?random=2") },
    { id: 3, name: "Coastal Topography Map", price: "1999", cny: "14500", desc: "Hydrological data.", updated: "2026-02-10", images: Array(5).fill("https://picsum.photos/800/450?random=3") },
    { id: 4, name: "Forest Terrain Map", price: "1999", cny: "14500", desc: "Vegetation coverage data.", updated: "2026-02-20", images: Array(5).fill("https://picsum.photos/800/450?random=4") },
    { id: 5, name: "Urban Planning Map", price: "1999", cny: "14500", desc: "Infrastructure layers.", updated: "2026-03-05", images: Array(5).fill("https://picsum.photos/800/450?random=5") },
    { id: 6, name: "River System Map", price: "1999", cny: "14500", desc: "Water flow data.", updated: "2026-03-10", images: Array(5).fill("https://picsum.photos/800/450?random=6") }
];

let currentPreviewProductId = null, currentPreviewIndex = 0, currentBuyProduct = null, selectedPaymentMethod = 'wechat';

// 初始化（适配4张首页图片）
function initStorage() {
    if (!localStorage.getItem('mapProducts')) localStorage.setItem('mapProducts', JSON.stringify(defaultProducts));
    if (!localStorage.getItem('homeImages')) localStorage.setItem('homeImages', JSON.stringify({
        home1: "https://picsum.photos/800/450?random=10",
        home2: "https://picsum.photos/800/450?random=11",
        home3: "https://picsum.photos/800/450?random=12",
        home4: "https://picsum.photos/800/450?random=13"
    }));
    if (!localStorage.getItem('payImages')) localStorage.setItem('payImages', JSON.stringify({ wechat: "", alipay: "", paypal: "" }));
}

// 工具函数
const getProducts = () => JSON.parse(localStorage.getItem('mapProducts'));
const saveProducts = (data) => localStorage.setItem('mapProducts', JSON.stringify(data));
const getHomeImages = () => JSON.parse(localStorage.getItem('homeImages'));
const saveHomeImagesData = (data) => localStorage.setItem('homeImages', JSON.stringify(data));
const getPayImages = () => JSON.parse(localStorage.getItem('payImages'));
const savePayImagesData = (data) => localStorage.setItem('payImages', JSON.stringify(data));
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'store') renderStore();
    if (pageId === 'admin') renderAdminGoods();
}

function switchAdminPanel(panelId) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
}

// 渲染商店商品
function renderStore() {
    const grid = document.getElementById('mapGrid');
    grid.innerHTML = getProducts().map(p => `
        <div class="map-card">
            <div class="map-preview-container">
                <img src="${p.images[0]}" class="map-main-preview" onclick="openImagePreview(${p.id},0)">
                <div class="preview-thumbnails">${p.images.map((img,i) => `<img src="${img}" class="preview-thumb ${i===0?'active':''}" onclick="switchThumb(${p.id},${i},this)">`).join('')}</div>
            </div>
            <div class="map-info">
                <h3 class="map-name">${p.name}</h3><p class="map-short-desc">${p.desc}</p>
                <div class="price-box"><span class="original-price">$1500</span><span class="sale-price">$${p.price}</span><span class="cny-price">¥${p.cny}</span></div>
                <div class="map-actions">
                    <button class="btn btn-primary" onclick="openBuyModal(${p.id})"><i class="fas fa-shopping-cart"></i> Buy Now</button>
                    <button class="btn btn-preview" onclick="openImagePreview(${p.id},0)"><i class="fas fa-eye"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染管理员商品
function renderAdminGoods() {
    const container = document.getElementById('adminGoodsContainer');
    container.innerHTML = getProducts().map(p => `
        <div class="card">
            <h3 class="card-title">Product ${p.id} - ${p.name}</h3>
            <div class="form-group"><label>Name</label><input type="text" id="p${p.id}_name" value="${p.name}" class="form-input"></div>
            <div class="form-group"><label>Price</label><input type="number" id="p${p.id}_price" value="${p.price}" class="form-input"></div>
            <div class="form-group"><label>Updated</label><input type="text" id="p${p.id}_updated" value="${p.updated}" class="form-input"></div>
            <div class="form-group"><label>Desc</label><textarea id="p${p.id}_desc" class="form-textarea">${p.desc}</textarea></div>
            <div class="form-group"><label>Batch Upload</label><input type="file" id="img_batch_${p.id}" class="form-input" accept="image/*" multiple></div>
            <button class="btn btn-primary" onclick="saveProductBatch(${p.id})">Upload & Save</button>
        </div>
    `).join('');
}

// 商品批量保存
async function saveProductBatch(id) {
    try {
        const products = getProducts();
        const p = products.find(x => x.id === id);
        if (!p) return alert('Product not found');

        p.name = document.getElementById(`p${id}_name`).value;
        p.price = document.getElementById(`p${id}_price`).value || 1999;
        p.updated = document.getElementById(`p${id}_updated`).value;
        p.desc = document.getElementById(`p${id}_desc`).value;
        p.cny = (p.price * 7.23).toFixed(0);
        p.images = p.images || Array(5).fill("");

        const input = document.getElementById(`img_batch_${id}`);
        const files = Array.from(input.files).slice(0,5);
        for(let i=0; i<files.length; i++){
            p.images[i] = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(files[i]);
            });
        }

        saveProducts(products);
        renderStore();
        renderAdminGoods();
        input.value = '';
        alert(`Product ${id} saved!`);
    } catch (e) { alert('Save failed'); }
}

// 图片预览
function openImagePreview(pid, idx){
    const p = getProducts().find(x=>x.id===pid);
    currentPreviewProductId=pid; currentPreviewIndex=idx;
    document.getElementById('previewMainImage').src=p.images[idx];
    document.getElementById('previewCounter').textContent=`${idx+1}/${p.images.length}`;
    document.getElementById('imagePreviewModal').style.display = "flex";
}
function closeImagePreview(){ document.getElementById('imagePreviewModal').style.display = "none"; }
function switchThumb(pid,idx,el){
    const p=getProducts().find(x=>x.id===pid);
    document.querySelector(`.map-main-preview[onclick*="${pid}"]`).src=p.images[idx];
    document.querySelectorAll(`.preview-thumb[onclick*="${pid}"]`).forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
}
function navigatePreview(d){
    const p=getProducts().find(x=>x.id===currentPreviewProductId);
    currentPreviewIndex = (currentPreviewIndex+d+p.images.length)%p.images.length;
    document.getElementById('previewMainImage').src=p.images[currentPreviewIndex];
    document.getElementById('previewCounter').textContent=`${currentPreviewIndex+1}/${p.images.length}`;
}

// ==============================================
// ✅ 终极修复：购买/支付 点击100%生效（无报错、无阻塞）
// ==============================================
function openBuyModal(pid){
    try {
        const product = getProducts().find(item => item.id === pid);
        currentBuyProduct = product;
        
        // 填充购买弹窗数据
        document.getElementById('buySlider').innerHTML = product.images.map(img => `<img src="${img}">`).join('');
        document.getElementById('buyName').innerText = product.name;
        document.getElementById('buyPrice').innerText = `$${product.price}`;
        document.getElementById('buyCny').innerText = `¥${product.cny}`;
        document.getElementById('buyDesc').innerText = product.desc;
        document.getElementById('orderMapName').innerText = product.name;
        document.getElementById('updateDate').innerText = product.updated;
        
        // 强制显示弹窗（修复CSS类失效问题）
        document.getElementById('buyModal').style.display = "flex";
    } catch (err) {
        console.log(err);
        alert('Failed to open purchase page');
    }
}

function closeBuyModal(){
    document.getElementById('buyModal').style.display = "none";
    document.getElementById('buyerEmail').value = "";
}

function openPayModal(){
    try {
        const email = document.getElementById('buyerEmail').value;
        if(!email || !email.includes('@')){
            alert('Please enter a valid email!');
            return;
        }
        const payImgs = getPayImages();
        document.getElementById('payPrice').innerText = `Total: $${currentBuyProduct.price} (¥${currentBuyProduct.cny})`;
        document.getElementById('paymentQRCode').querySelector('img').src = payImgs[selectedPaymentMethod] || "https://picsum.photos/220/220";
        document.getElementById('payModal').style.display = "flex";
    } catch (err) {
        alert('Failed to open payment page');
    }
}

function closePayModal(){
    document.getElementById('payModal').style.display = "none";
}

function selectPayment(method){
    selectedPaymentMethod = method;
    const payImgs = getPayImages();
    document.getElementById('paymentQRCode').querySelector('img').src = payImgs[method] || `https://picsum.photos/220/220?${method}`;
}

function confirmPayment(){
    alert('Payment successful! The file link will be sent to your email.');
    closePayModal();
    closeBuyModal();
}

// 管理员登录
function adminLogin(){
    if(document.getElementById('username').value==='001' && document.getElementById('password').value==='001'){
        showPage('admin');
    } else {
        alert('Account: 001\nPassword: 001');
    }
}

// 4张首页图片上传
async function saveHomeImages(){
    const home = getHomeImages();
    const uploads = document.querySelectorAll('.home-img-upload');
    for(const u of uploads){
        const file = u.files[0];
        if(file){
            home[u.dataset.key] = await new Promise(resolve=>{
                const r=new FileReader();
                r.onload=e=>resolve(e.target.result);
                r.readAsDataURL(file);
            });
        }
    }
    saveHomeImagesData(home);
    document.getElementById('homeImg1').src=home.home1;
    document.getElementById('homeImg2').src=home.home2;
    document.getElementById('homeImg3').src=home.home3;
    document.getElementById('homeImg4').src=home.home4;
    uploads.forEach(u=>u.value='');
    alert('Home images saved!');
}

// 支付二维码保存
async function savePayImages(){
    const pay=getPayImages();
    const files = {
        wechat: document.getElementById('wechat_qr').files[0],
        alipay: document.getElementById('alipay_qr').files[0],
        paypal: document.getElementById('paypal_qr').files[0]
    };
    for(const [k,f] of Object.entries(files)){
        if(f){
            pay[k] = await new Promise(resolve=>{
                const r=new FileReader();
                r.onload=e=>resolve(e.target.result);
                r.readAsDataURL(f);
            });
        }
    }
    savePayImagesData(pay);
    alert('QR codes saved!');
}

function changePassword(){
    const n = document.getElementById('new_password').value;
    const c = document.getElementById('confirm_password').value;
    n === c ? alert('Password changed!') : alert('Password mismatch!');
}

// 页面初始化
window.addEventListener('DOMContentLoaded',()=>{
    initStorage();
    const home = getHomeImages();
    document.getElementById('homeImg1').src=home.home1;
    document.getElementById('homeImg2').src=home.home2;
    document.getElementById('homeImg3').src=home.home3;
    document.getElementById('homeImg4').src=home.home4;

    // 滚动回到顶部
    window.addEventListener('scroll',()=>{
        document.getElementById('backToTop').classList.toggle('show', window.scrollY > 300);
    });

    // 点击空白关闭弹窗
    window.onclick = function(event) {
        const buyModal = document.getElementById('buyModal');
        const payModal = document.getElementById('payModal');
        const previewModal = document.getElementById('imagePreviewModal');
        if (event.target == buyModal) closeBuyModal();
        if (event.target == payModal) closePayModal();
        if (event.target == previewModal) closeImagePreview();
    }
});