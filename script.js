// ========================================================
// 1. CẤU HÌNH LINK KẾT NỐI (DÁN LINK CỦA BẠN VÀO ĐÂY)
// ========================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwEZuJai2Fik6poHkc_Ef7UtN67vAFKpBdvnFdopWVLM8J6rdheVw4msrlUbUTrJA1m2A/exec";
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/10Q6A2YD9AgJn3AdbBrpdhg-cDIvMK04JoJJv4Cf3fGo/edit?usp=sharing";

// ==========================================
// 2. ĐỒNG HỒ & THỜI GIAN BIỂU
// ==========================================
const thoiGianBieu = [
    { ten: "Tiết 1 (Sáng)", batDau: 7*60+0, ketThuc: 7*60+45 },
    { ten: "Tiết 2 (Sáng)", batDau: 8*60+15, ketThuc: 9*60+0 },
    { ten: "Tiết 3 (Sáng)", batDau: 9*60+5, ketThuc: 9*60+50 },
    { ten: "Tiết 4 (Sáng)", batDau: 10*60+0, ketThuc: 10*60+45 },
    { ten: "Tiết 5 (Sáng)", batDau: 10*60+50, ketThuc: 11*60+35 },
    { ten: "Tiết 1 (Chiều)", batDau: 13*60+30, ketThuc: 14*60+15 },
    { ten: "Tiết 2 (Chiều)", batDau: 14*60+20, ketThuc: 15*60+5 },
    { ten: "Tiết 3 (Chiều)", batDau: 15*60+25, ketThuc: 16*60+10 },
    { ten: "Tiết 4 (Chiều)", batDau: 16*60+15, ketThuc: 17*60+0 }
];

function capNhatThoiGian() {
    const clock = document.getElementById('real-time-clock');
    if(!clock) return; 

    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateString = now.toLocaleDateString('vi-VN', options);
    const tongPhut = now.getHours() * 60 + now.getMinutes();
    let trangThaiTietHoc = "Ngoài giờ học", dangTrongTiet = false;

    for (let tiet of thoiGianBieu) {
        if (tongPhut >= tiet.batDau && tongPhut <= tiet.ketThuc) {
            trangThaiTietHoc = "Đang diễn ra: " + tiet.ten;
            dangTrongTiet = true; break;
        }
    }
    if (!dangTrongTiet) {
        if ((tongPhut > 420 && tongPhut < 695) || (tongPhut > 810 && tongPhut < 1020)) trangThaiTietHoc = "Giờ chuyển tiết / Giải lao";
    }
    clock.innerHTML = `${dateString} <br> <span style="color: #ffeb3b; font-size: 1.1em;">[ ${trangThaiTietHoc} ]</span>`;
}

// ==========================================
// 3. CHUYỂN TAB & GIỎ HÀNG THIẾT BỊ
// ==========================================
function chuyenTab(event, tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabId === 'trang-chu') taiDuLieuTrangChu();
    if (tabId === 'ket-qua') taiKetQuaTuSheets();
    if (tabId === 'ket-qua-gv') taiKetQuaGiaoVien();
}

let danhSachMuonTB = [];

function themThietBiVaoDanhSach() {
    let inputTB = document.getElementById('inputTimTB');
    let val = inputTB.value.trim();
    if(!val) return;
    
    if(!danhSachMuonTB.includes(val)) danhSachMuonTB.push(val);
    inputTB.value = ""; 
    renderDanhSachMuon();
}

function xoaThietBi(index) {
    danhSachMuonTB.splice(index, 1);
    renderDanhSachMuon();
}

function renderDanhSachMuon() {
    let box = document.getElementById('boxDanhSachTB');
    let maTBInput = document.getElementById('maTB'); 
    
    if(danhSachMuonTB.length === 0) {
        if(box) box.innerHTML = '<em style="color: #888; font-size: 13px;">Chưa chọn thiết bị nào...</em>';
        if(maTBInput) maTBInput.value = "";
        return;
    }
    
    let html = '<ul style="padding-left: 0; list-style: none; margin: 0; font-size: 14px;">';
    danhSachMuonTB.forEach((tb, i) => {
        html += `<li style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
                 ${tb} <span style="color: red; cursor: pointer; float: right; font-weight: bold;" onclick="xoaThietBi(${i})">❌ Xóa</span>
                 </li>`;
    });
    html += '</ul>';
    if(box) box.innerHTML = html;
    if(maTBInput) maTBInput.value = danhSachMuonTB.join(", ");
}

// ==========================================
// 4. AUTO CẬP NHẬT TRẠNG THÁI & BƠM DỮ LIỆU & NHẮC VIỆC
// ==========================================
function taiDuLieuTrangChu() {
    const ulPhong = document.getElementById('danh-sach-phong');
    const ulTB = document.getElementById('danh-sach-tb');
    if (!ulPhong || !ulTB) return; 

    ulPhong.innerHTML = "<li>Đang phân tích lịch đăng ký...</li>";
    ulTB.innerHTML = "<li>Đang kiểm đếm tồn kho...</li>";

    Promise.all([
        fetch(WEB_APP_URL + "?action=getDashboard").then(res => res.json()),
        fetch(WEB_APP_URL + "?action=getKetQua").then(res => res.json())
    ])
    .then(([dashboardData, ketQuaData]) => {
        if (!dashboardData.phong) dashboardData.phong = [];
        if (!dashboardData.thietBi) dashboardData.thietBi = [];
        if (!ketQuaData) ketQuaData = [];

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now
