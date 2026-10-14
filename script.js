// ========================================================
// 1. CẤU HÌNH LINK KẾT NỐI (DÁN LINK CỦA BẠN VÀO ĐÂY)
// ========================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxEpzGOK3qvtVHwLeZ2OSZvwllwg5fPZSbSyU0SsYVckIPzUpM-f2xVZQ6WoCtfFOcrOg/exec";
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1xKQTDkUKQJnmcNaTko4XzzRjGHlC-QUd6Ljr315iQpo/edit?usp=sharing";

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
// 3. CHUYỂN TAB & GIỎ HÀNG THIẾT BỊ (CÓ SỐ LƯỢNG)
// ==========================================
function chuyenTab(event, tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabId === 'trang-chu') taiDuLieuTrangChu();
    if (tabId === 'ket-qua' || tabId === 'duyet-tb') taiBangDuyetTB();
    if (tabId === 'duyet-phong') taiBangDuyetPhong();
    if (tabId === 'ket-qua-gv') taiKetQuaGiaoVien();
}

let danhSachMuonTB = [];
let danhSachThietBiGoc = [];

function themThietBiVaoDanhSach() {
    let inputTB = document.getElementById('inputTimTB');
    let inputSL = document.getElementById('inputSoLuongTB');
    let val = inputTB.value.trim();
    let sl = parseInt(inputSL ? inputSL.value : 1) || 1;
    if(!val) return;
    
    let existing = danhSachMuonTB.find(item => item.ten === val);
    if(existing) { existing.soLuong += sl; } 
    else { danhSachMuonTB.push({ ten: val, soLuong: sl }); }
    
    inputTB.value = ""; 
    if(inputSL) inputSL.value = "1";
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
        if(maTBInput) maTBInput.value = ""; return;
    }
    let html = '<ul style="padding-left: 0; list-style: none; margin: 0; font-size: 14px;">';
    let dataStringArr = [];
    danhSachMuonTB.forEach((item, i) => {
        dataStringArr.push(`${item.ten} (SL: ${item.soLuong})`);
        html += `<li style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;"><strong>${item.ten}</strong> - SL: <span style="color:#007bff; font-weight:bold;">${item.soLuong}</span> <span style="color: red; cursor: pointer; float: right; font-weight: bold;" onclick="xoaThietBi(${i})">❌ Xóa</span></li>`;
    });
    html += '</ul>';
    if(box) box.innerHTML = html;
    if(maTBInput) maTBInput.value = dataStringArr.join(" | ");
}

// Lọc thiết bị theo phòng/bộ môn chuyên môn
function locThietBiTheoPhong() {
    let phongChon = document.getElementById('chonBoMon').value;
    let dataTBList = document.getElementById('dataTB');
    if (!dataTBList) return;
    dataTBList.innerHTML = '';
    let dsLoc = danhSachThietBiGoc;
    if (phongChon) {
        dsLoc = danhSachThietBiGoc.filter(tb => tb.boMon === phongChon);
    }
    dsLoc.forEach(tb => {
        dataTBList.innerHTML += `<option value="${tb.maTB} - ${tb.tenTB}">`;
    });
}

// ==========================================
// 4. AUTO CẬP NHẬT TRẠNG THÁI & BƠM DỮ LIỆU
// ==========================================
function taiDuLieuTrangChu() {
    const ulPhong = document.getElementById('danh-sach-phong'), ulTB = document.getElementById('danh-sach-tb');
    if (!ulPhong || !ulTB) return; 

    ulPhong.innerHTML = "<li>Đang phân tích lịch đăng ký...</li>";
    ulTB.innerHTML = "<li>Đang kiểm đếm tồn kho...</li>";

    Promise.all([fetch(WEB_APP_URL + "?action=getDashboard").then(res => res.json()), fetch(WEB_APP_URL + "?action=getKetQua").then(res => res.json())])
    .then(([dashboardData, ketQuaData]) => {
        if (!dashboardData.phong) dashboardData.phong = [];
        if (!dashboardData.thietBi) dashboardData.thietBi = [];
        if (!ketQuaData) ketQuaData = [];

        danhSachThietBiGoc = dashboardData.thietBi; // Lưu lại danh sách gốc

        const now = new Date();
        const yyyy = now.getFullYear(), mm = String(now.getMonth() + 1).padStart(2, '0'), dd = String(now.getDate()).padStart(2, '0');
        const todayFormats = [`${yyyy}-${mm}-${dd}`, `${dd}/${mm}/${yyyy}`, `${mm}/${dd}/${yyyy}`, `${dd}-${mm}-${yyyy}`];

        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const t_yyyy = tomorrow.getFullYear(), t_mm = String(tomorrow.getMonth() + 1).padStart(2, '0'), t_dd = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowFormats = [`${t_yyyy}-${t_mm}-${t_dd}`, `${t_dd}/${t_mm}/${t_yyyy}`, `${t_mm}/${t_dd}/${t_yyyy}`, `${t_dd}-${t_mm}-${t_yyyy}`];

        const kiemTraKhopNgay = (chiTiet, mangDinhDang) => {
            if (!chiTiet) return false;
            return mangDinhDang.some(dinhDang => chiTiet.includes(dinhDang));
        };

        const tongPhut = now.getHours() * 60 + now.getMinutes();
        let currentTiet = -1, currentBuoi = "";
        for (let tiet of thoiGianBieu) {
            if (tongPhut >= tiet.batDau && tongPhut <= tiet.ketThuc) {
                currentTiet = parseInt(tiet.ten.match(/\d+/)[0]);
                currentBuoi = tiet.ten.includes("Sáng") ? "Sáng" : "Chiều";
                break;
            }
        }

        const approvedToday = ketQuaData.filter(item => item.trangThai === "Đã Duyệt" && kiemTraKhopNgay(item.chiTiet, todayFormats));

        // Phòng bộ môn
        ulPhong.innerHTML = "";
        if (dashboardData.phong.length === 0) ulPhong.innerHTML = "<li>Chưa có dữ liệu phòng.</li>";
        dashboardData.phong.forEach(p => {
            let status = "Trống", badge = "badge-green", gvInfo = "";
            if (currentTiet !== -1) {
                let dangBan = approvedToday.find(req => {
                    if (req.loaiYeuCau === "Đặt Phòng" && req.chiTiet.includes(p.maPhong) && req.chiTiet.includes(currentBuoi)) {
                        let phanTiet = req.chiTiet.split("Tiết:")[1]; 
                        if (phanTiet) {
                            let numbers = phanTiet.match(/\d+/g); 
                            if (numbers && numbers.length > 0) {
                                let tStart = parseInt(numbers[0]), tEnd = parseInt(numbers[numbers.length - 1]);
                                if (currentTiet >= tStart && currentTiet <= tEnd) return true;
                            }
                        }
                    }
                    return false;
                });
                if (dangBan) { status = "Đang sử dụng"; badge = "badge-red"; gvInfo = ` <span style="font-size: 13px; color: #dc3545; font-style: italic;">(GV: ${dangBan.tenGV})</span>`; }
            }
            ulPhong.innerHTML += `<li><span class="badge ${badge}">${status}</span> <strong>${p.maPhong}</strong>: ${p.tenPhong}${gvInfo}</li>`;
        });

        // Thiết bị (hiện 5 món đầu)
        ulTB.innerHTML = "";
        dashboardData.thietBi.forEach((tb, index) => {
            let status = `${tb.soLuong} ${tb.donVi || 'cái'}`, badge = "badge-green";
            let hiddenClass = index >= 5 ? 'class="tb-hidden" style="display: none;"' : '';
            ulTB.innerHTML += `<li ${hiddenClass}><span class="badge ${badge}">${status}</span> <strong>${tb.maTB}</strong>: ${tb.tenTB}</li>`;
        });
        if (dashboardData.thietBi.length > 5) {
            ulTB.innerHTML += `<li style="justify-content: center; cursor: pointer; color: #0056b3; font-weight: bold; border-bottom: none; background: #f8f9fa; border-radius: 5px; margin-top: 5px;" onclick="toggleXemThemTB(this)">⬇️ Xem thêm (${dashboardData.thietBi.length - 5} thiết bị khác)...</li>`;
        }

        // Bơm Form
        const selectPhong = document.getElementById('maPhong');
        if (selectPhong && selectPhong.tagName === 'SELECT') {
            selectPhong.innerHTML = '<option value="">-- Chọn phòng bộ môn --</option>';
            dashboardData.phong.forEach(p => { selectPhong.innerHTML += `<option value="${p.maPhong}">${p.tenPhong}</option>`; });
        }
        locThietBiTheoPhong(); // Nạp danh sách vào datalist ban đầu

        // Nhắc việc Admin
        const ulNhacViec = document.getElementById('danh-sach-nhac-viec');
        if (ulNhacViec) {
            ulNhacViec.innerHTML = "";
            const pendingReqs = ketQuaData.filter(item => item.trangThai === "Chờ duyệt" || !item.trangThai);
            const todaySchedule = ketQuaData.filter(item => item.trangThai === "Đã Duyệt" && kiemTraKhopNgay(item.chiTiet, todayFormats));
            const tomorrowReqs = ketQuaData.filter(item => item.trangThai === "Đã Duyệt" && kiemTraKhopNgay(item.chiTiet, tomorrowFormats));

            if (pendingReqs.length > 0) ulNhacViec.innerHTML += `<li style="color: #dc3545; font-weight: bold; background: #ffe6e6; padding: 10px; border-radius: 5px;">🚨 BẠN CÓ ${pendingReqs.length} YÊU CẦU MỚI CHỜ DUYỆT!</li>`;
            else ulNhacViec.innerHTML += `<li style="color: #6c757d;">✅ Không có yêu cầu nào đang chờ duyệt.</li>`;

            ulNhacViec.innerHTML += `<li style="margin-top: 15px; font-weight: bold; color: #d32f2f;">🔥 LỊCH SỬ DỤNG HÔM NAY (${dd}/${mm}):</li>`;
            if (todaySchedule.length > 0) todaySchedule.forEach(req => { ulNhacViec.innerHTML += `<li style="border-left: 3px solid #dc3545; margin-left: 10px; padding-left: 10px; margin-bottom: 5px;"><strong>${req.tenGV}</strong> | ${req.loaiYeuCau}: ${req.chiTiet}</li>`; });
            else ulNhacViec.innerHTML += `<li style="color: #28a745; margin-left: 10px;">Hôm nay không có lịch mượn phòng/thiết bị nào.</li>`;

            const t_dd_str = String(tomorrow.getDate()).padStart(2, '0'), t_mm_str = String(tomorrow.getMonth() + 1).padStart(2, '0');
            ulNhacViec.innerHTML += `<li style="margin-top: 15px; font-weight: bold; color: #0056b3;">📅 CẦN CHUẨN BỊ CHO NGÀY MAI (${t_dd_str}/${t_mm_str}):</li>`;
            if (tomorrowReqs.length > 0) tomorrowReqs.forEach(req => { ulNhacViec.innerHTML += `<li style="border-left: 3px solid #007bff; margin-left: 10px; padding-left: 10px; margin-bottom: 5px;"><strong>${req.tenGV}</strong> | ${req.loaiYeuCau}: ${req.chiTiet}</li>`; });
            else ulNhacViec.innerHTML += `<li style="color: #6c757d; margin-left: 10px;">Chưa có lịch đăng ký cho ngày mai.</li>`;
        }
    })
    .catch(err => console.error("Lỗi:", err));
}

function toggleXemThemTB(btn) {
    let hiddenItems = document.querySelectorAll('.tb-hidden');
    if (hiddenItems.length === 0) return;
    let dangAn = hiddenItems[0].style.display === 'none';
    hiddenItems.forEach(item => { item.style.display = dangAn ? '' : 'none'; });
    if (dangAn) btn.innerHTML = "⬆️ Thu gọn danh sách";
    else btn.innerHTML = `⬇️ Xem thêm (${hiddenItems.length} thiết bị khác)...`;
}

// ==========================================
// 5. QUẢN LÝ BẢNG DUYỆT RIÊNG BIỆT (CÓ LỌC THÁNG)
// ==========================================
function taiBangDuyetTB() {
    const tbody = document.getElementById('table-duyet-tb');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Đang tải dữ liệu mượn thiết bị...</td></tr>";
    let filterVal = document.getElementById('filterThangTB') ? document.getElementById('filterThangTB').value : "";

    fetch(WEB_APP_URL + "?action=getKetQua").then(res => res.json()).then(data => {
        tbody.innerHTML = "";
        let dsTB = data.filter(item => item.loaiYeuCau === "Mượn Thiết Bị");
        if (filterVal) {
            let mm_yyyy = filterVal.split('-').reverse().join('/'); // Chuyển 2026-10 thành 10/2026
            dsTB = dsTB.filter(item => item.chiTiet.includes(mm_yyyy) || item.thoiGian.includes(mm_yyyy));
        }
        if(dsTB.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#888;'>Không có yêu cầu mượn thiết bị.</td></tr>";
            return;
        }
        dsTB.forEach(item => {
            let badgeColor = item.trangThai === "Đã Duyệt" || item.trangThai === "Đã Trả" ? "badge-green" : (item.trangThai === "Từ chối" ? "badge-red" : "badge-orange");
            let btnAdmin = "";
            if (item.trangThai === "Chờ duyệt" || !item.trangThai) {
                btnAdmin = `<button class="action-btn btn-duyet" onclick="xuLyAdmin('${item.id}', 'Đã Duyệt')">Duyệt</button><button class="action-btn btn-tuchoi" onclick="xuLyAdmin('${item.id}', 'Từ chối')">Từ chối</button>`;
            } else if (item.trangThai === "Đã Duyệt") {
                btnAdmin = `<button class="action-btn" style="background-color: #17a2b8;" onclick="thuHoiThietBi('${item.id}')">Thu hồi TB</button>`;
            }
            tbody.innerHTML += `<tr><td>${item.id}</td><td>${item.tenGV}</td><td>${item.chiTiet}</td><td><span class="badge ${badgeColor}">${item.trangThai || 'Chờ duyệt'}</span></td><td>${btnAdmin}</td></tr>`;
        });
    });
}

function taiBangDuyetPhong() {
    const tbody = document.getElementById('table-duyet-phong');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Đang tải dữ liệu đặt phòng...</td></tr>";
    let filterVal = document.getElementById('filterThangPhong') ? document.getElementById('filterThangPhong').value : "";

    fetch(WEB_APP_URL + "?action=getKetQua").then(res => res.json()).then(data => {
        tbody.innerHTML = "";
        let dsPhong = data.filter(item => item.loaiYeuCau === "Đặt Phòng");
        if (filterVal) {
            let mm_yyyy = filterVal.split('-').reverse().join('/');
            dsPhong = dsPhong.filter(item => item.chiTiet.includes(mm_yyyy));
        }
        if(dsPhong.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#888;'>Không có yêu cầu đặt phòng.</td></tr>";
            return;
        }
        dsPhong.forEach(item => {
            let badgeColor = item.trangThai === "Đã Duyệt" ? "badge-green" : (item.trangThai === "Từ chối" ? "badge-red" : "badge-orange");
            let btnAdmin = "";
            if (item.trangThai === "Chờ duyệt" || !item.trangThai) {
                btnAdmin = `<button class="action-btn btn-duyet" onclick="xuLyAdmin('${item.id}', 'Đã Duyệt')">Duyệt</button><button class="action-btn btn-tuchoi" onclick="xuLyAdmin('${item.id}', 'Từ chối')">Từ chối</button>`;
            }
            tbody.innerHTML += `<tr><td>${item.id}</td><td>${item.tenGV}</td><td>${item.chiTiet}</td><td><span class="badge ${badgeColor}">${item.trangThai || 'Chờ duyệt'}</span></td><td>${btnAdmin}</td></tr>`;
        });
    });
}

function taiKetQuaGiaoVien() {
    const tbody = document.getElementById('table-ket-qua-gv');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Đang tải dữ liệu...</td></tr>";
    fetch(WEB_APP_URL + "?action=getKetQua").then(res => res.json()).then(data => {
        tbody.innerHTML = "";
        data.forEach(item => {
            let badgeColor = item.trangThai === "Đã Duyệt" || item.trangThai === "Đã Trả" ? "badge-green" : (item.trangThai === "Từ chối" ? "badge-red" : "badge-orange");
            tbody.innerHTML += `<tr><td>${item.thoiGian}</td><td>${item.tenGV}</td><td>${item.loaiYeuCau}</td><td>${item.chiTiet}</td><td><span class="badge ${badgeColor}">${item.trangThai || 'Chờ duyệt'}</span></td></tr>`;
        });
    });
}

// ==========================================
// 6. GỬI YÊU CẦU & XỬ LÝ ADMIN
// ==========================================
function guiYeuCau(loaiHanhDong) {
    let data = { action: loaiHanhDong };
    if (loaiHanhDong === 'muonThietBi') {
        data.tenGV = document.getElementById('gvThietBi').value; 
        data.maTB = document.getElementById('maTB').value; 
        if(!data.maTB) return alert("Vui lòng chọn ít nhất 1 thiết bị!");
        data.ngayMuon = document.getElementById('ngayMuonTB').value;
        data.ngayTra = document.getElementById('ngayTraTB').value;
        data.baiHoc = document.getElementById('baiHocTB').value;
        data.lopDay = document.getElementById('lopDayTB').value;
    } else if (loaiHanhDong === 'datPhong') {
        data.tenGV = document.getElementById('gvPhong').value; 
        data.maPhong = document.getElementById('maPhong').value; 
        data.ngayDat = document.getElementById('ngayDatPhong').value; 
        data.baiDay = document.getElementById('baiDayPhong').value;
        data.lopDay = document.getElementById('lopDayPhong').value;
        let selBuoi = document.getElementById('buoiHoc');
        data.buoiHoc = selBuoi ? selBuoi.value : "Sáng"; 
        data.tietHoc = document.getElementById('tietHoc').value;
    } else if (loaiHanhDong === 'baoHong') {
        data.viTri = document.getElementById('viTriSuCo').value; 
        data.moTa = document.getElementById('moTaSuCo').value;
    } else if (loaiHanhDong === 'muaSam') {
        data.tenTB = document.getElementById('tenTBMuaSam').value; 
        data.soLuong = "Nhiều món"; 
        data.lyDo = document.getElementById('lyDoMuaSam').value;
    }

    fetch(WEB_APP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    .then(() => { 
        alert("Đã gửi yêu cầu thành công!"); 
        document.querySelectorAll('.app-form').forEach(f => f.reset()); 
        danhSachMuonTB = []; renderDanhSachMuon();
    });
}

function xuLyAdmin(id, hanhDong) {
    if(confirm(`Xác nhận ${hanhDong} yêu cầu ID: ${id}?`)) {
        fetch(WEB_APP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: 'adminDuyet', id: id, ketQua: hanhDong }) })
        .then(() => { alert("Đã xử lý! Đang làm mới bảng..."); setTimeout(() => { taiBangDuyetTB(); taiBangDuyetPhong(); taiDuLieuTrangChu(); }, 1500); });
    }
}

function thuHoiThietBi(id) {
    let nowStr = new Date().toLocaleDateString('vi-VN');
    let ngayTra = prompt(`Đang làm thủ tục thu hồi đơn ID: ${id}\nNhập NGÀY TRẢ thực tế:`, nowStr);
    if (!ngayTra) return;
    let tinhTrang = prompt("Nhập TÌNH TRẠNG thiết bị (Bình thường / Thiếu / Hỏng...):", "Bình thường");
    if (!tinhTrang) return;

    if(confirm(`Chốt thu hồi thiết bị?`)) {
        fetch(WEB_APP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: 'adminTraTB', id: id, ngayTra: ngayTra, tinhTrang: tinhTrang }) })
        .then(() => { alert("Đã cập nhật thu hồi thành công!"); setTimeout(() => { taiBangDuyetTB(); taiDuLieuTrangChu(); }, 1500); });
    }
}

// ==========================================
// 7. TIỆN ÍCH
// ==========================================
function moTrangTinh() {
    if (SPREADSHEET_URL.includes("LINK_GOOGLE_SHEETS")) { alert("Vui lòng khai báo link Google Sheets gốc!"); return; }
    window.open(SPREADSHEET_URL, '_blank');
}
function taiDanhMucThietBi() {
    if (SPREADSHEET_URL.includes("LINK_GOOGLE_SHEETS")) { alert("Hệ thống chưa cấu hình Link tải!"); return; }
    try {
        let urlParts = SPREADSHEET_URL.split('/');
        window.location.href = `https://docs.google.com/spreadsheets/d/${urlParts[urlParts.indexOf('d') + 1]}/export?format=xlsx`;
    } catch (error) { alert("Link CSDL không hợp lệ!"); }
}

// ==========================================
// 8. KHỞI CHẠY TỰ ĐỘNG
// ==========================================
window.onload = function() {
    setInterval(capNhatThoiGian, 1000); capNhatThoiGian();
    taiDuLieuTrangChu();
    if (document.getElementById('admin-panel')) {
        taiBangDuyetTB();
        taiBangDuyetPhong();
    }
    if (document.getElementById('ket-qua-gv')) taiKetQuaGiaoVien();
};
