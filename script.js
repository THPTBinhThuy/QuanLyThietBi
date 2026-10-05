// Thay link Google Web App của bạn vào đây!
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwEZuJai2Fik6poHkc_Ef7UtN67vAFKpBdvnFdopWVLM8J6rdheVw4msrlUbUTrJA1m2A/exec";
// KHAI BÁO LINK FILE GOOGLE SHEETS GỐC CỦA BẠN VÀO ĐÂY:
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/10Q6A2YD9AgJn3AdbBrpdhg-cDIvMK04JoJJv4Cf3fGo/edit?usp=sharing";

// ==========================================
// 1. ĐỒNG HỒ & THỜI GIAN BIỂU
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
    let trangThaiTietHoc = "Ngoài giờ học";
    let dangTrongTiet = false;

    for (let tiet of thoiGianBieu) {
        if (tongPhut >= tiet.batDau && tongPhut <= tiet.ketThuc) {
            trangThaiTietHoc = "Đang diễn ra: " + tiet.ten;
            dangTrongTiet = true; break;
        }
    }
    
    if (!dangTrongTiet) {
        if ((tongPhut > 420 && tongPhut < 695) || (tongPhut > 810 && tongPhut < 1020)) {
            trangThaiTietHoc = "Giờ chuyển tiết / Giải lao";
        }
    }
    clock.innerHTML = `${dateString} <br> <span style="color: #ffeb3b; font-size: 1.1em;">[ ${trangThaiTietHoc} ]</span>`;
}

// ==========================================
// 2. CHUYỂN TAB 
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

// ==========================================
// 3. AUTO CẬP NHẬT TRẠNG THÁI (TRANG CHỦ)
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
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`; 

        const tongPhut = now.getHours() * 60 + now.getMinutes();
        let currentTiet = -1;
        let currentBuoi = "";

        // Xác định tiết hiện tại
        for (let tiet of thoiGianBieu) {
            if (tongPhut >= tiet.batDau && tongPhut <= tiet.ketThuc) {
                currentTiet = parseInt(tiet.ten.match(/\d+/)[0]);
                currentBuoi = tiet.ten.includes("Sáng") ? "Sáng" : "Chiều";
                break;
            }
        }

        // Lọc yêu cầu ĐÃ DUYỆT trong HÔM NAY
        const approvedToday = ketQuaData.filter(item => 
            item.trangThai === "Đã Duyệt" && (item.chiTiet || "").includes(todayStr)
        );

        // AUTO CẬP NHẬT TRẠNG THÁI PHÒNG
        ulPhong.innerHTML = "";
        dashboardData.phong.forEach(p => {
            let status = "Trống";
            let badge = "badge-green";
            let gvInfo = "";

            if (currentTiet !== -1) {
                let dangBan = approvedToday.find(req => {
                    // Kiểm tra đúng loại yêu cầu, đúng phòng, đúng buổi
                    if (req.loaiYeuCau === "Đặt Phòng" && req.chiTiet.includes(p.maPhong) && req.chiTiet.includes(currentBuoi)) {
                        // FIX LỖI Ở ĐÂY: Cắt chuỗi chính xác từ chữ "Tiết:" thay vì dấu "|"
                        let phanTiet = req.chiTiet.split("Tiết:")[1]; 
                        if (phanTiet) {
                            let numbers = phanTiet.match(/\d+/g); 
                            if (numbers && numbers.length > 0) {
                                let tStart = parseInt(numbers[0]);
                                let tEnd = parseInt(numbers[numbers.length - 1]);
                                if (currentTiet >= tStart && currentTiet <= tEnd) return true;
                            }
                        }
                    }
                    return false;
                });

                if (dangBan) {
                    status = "Đang sử dụng";
                    badge = "badge-red";
                    gvInfo = ` <span style="font-size: 13px; color: #dc3545; font-style: italic;">(GV: ${dangBan.tenGV})</span>`;
                }
            }
            ulPhong.innerHTML += `<li><span class="badge ${badge}">${status}</span> <strong>${p.maPhong}</strong>: ${p.tenPhong}${gvInfo}</li>`;
        });

        // AUTO CẬP NHẬT TỒN KHO THIẾT BỊ
        ulTB.innerHTML = "";
        dashboardData.thietBi.forEach(tb => {
            let slBanDau = parseInt(tb.soLuong) || 0; // Nếu file gõ sai (chữ thay vì số), nó sẽ là 0
            let slDaMuon = 0;
            
            approvedToday.forEach(req => {
                if (req.loaiYeuCau === "Mượn Thiết Bị" && req.chiTiet.includes(tb.maTB)) {
                    slDaMuon += 1; 
                }
            });

            let slConLai = slBanDau - slDaMuon;
            let donVi = tb.donVi ? tb.donVi : ''; 
            let status = slConLai > 0 ? slConLai + ' ' + donVi : 'Hết / Đang mượn';
            let badge = slConLai > 0 ? "badge-green" : "badge-red";
            ulTB.innerHTML += `<li><span class="badge ${badge}">${status}</span> <strong>${tb.maTB}</strong>: ${tb.tenTB}</li>`;
        });
    })
    .catch(err => {
        console.error("Lỗi:", err);
        ulPhong.innerHTML = "<li style='color:red;'>Lỗi tải dữ liệu.</li>";
        ulTB.innerHTML = "<li style='color:red;'>Lỗi tải dữ liệu.</li>";
    });
}
// ==========================================
// 4. TẢI BẢNG KẾT QUẢ
// ==========================================
function taiKetQuaTuSheets() {
    const tbody = document.getElementById('table-ket-qua-dang-ky');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Đang tải dữ liệu...</td></tr>";

    fetch(WEB_APP_URL + "?action=getKetQua").then(res => res.json()).then(data => {
        tbody.innerHTML = "";
        data.forEach(item => {
            let badgeColor = item.trangThai === "Đã Duyệt" ? "badge-green" : (item.trangThai === "Từ chối" ? "badge-red" : "badge-orange");
            let btnAdmin = (item.trangThai === "Chờ duyệt") ? `
                <button class="action-btn btn-duyet" onclick="xuLyAdmin('${item.id}', 'Đã Duyệt')">Duyệt</button>
                <button class="action-btn btn-tuchoi" onclick="xuLyAdmin('${item.id}', 'Từ chối')">Từ chối</button>` : "";

            tbody.innerHTML += `<tr><td>${item.id}</td><td>${item.tenGV}</td><td>${item.loaiYeuCau}</td><td>${item.chiTiet}</td>
                                <td><span class="badge ${badgeColor}">${item.trangThai}</span></td><td>${btnAdmin}</td></tr>`;
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
            let badgeColor = item.trangThai === "Đã Duyệt" ? "badge-green" : (item.trangThai === "Từ chối" ? "badge-red" : "badge-orange");
            tbody.innerHTML += `<tr><td>${item.thoiGian}</td><td>${item.tenGV}</td><td>${item.loaiYeuCau}</td>
                                <td>${item.chiTiet}</td><td><span class="badge ${badgeColor}">${item.trangThai}</span></td></tr>`;
        });
    });
}

// ==========================================
// 5. GỬI & DUYỆT YÊU CẦU
// ==========================================
function guiYeuCau(loaiHanhDong) {
    let data = { action: loaiHanhDong };
    if (loaiHanhDong === 'muonThietBi') {
        data.tenGV = document.getElementById('gvThietBi').value; 
        data.maTB = document.getElementById('maTB').value; 
        data.ngayMuon = document.getElementById('ngayMuonTB').value;
    } else if (loaiHanhDong === 'datPhong') {
        data.tenGV = document.getElementById('gvPhong').value; 
        data.maPhong = document.getElementById('maPhong').value; 
        data.ngayDat = document.getElementById('ngayDatPhong').value; 
        
        let buoiHoc = document.getElementById('buoiHoc') ? document.getElementById('buoiHoc').value : "Buổi Sáng";
        data.tietHoc = buoiHoc + " | Tiết: " + document.getElementById('tietHoc').value;
    } else if (loaiHanhDong === 'baoHong') {
        data.viTri = document.getElementById('viTriSuCo').value; 
        data.moTa = document.getElementById('moTaSuCo').value;
    } else if (loaiHanhDong === 'muaSam') {
        data.tenTB = document.getElementById('tenTBMuaSam').value; 
        data.soLuong = document.getElementById('soLuongMuaSam').value; 
        data.lyDo = document.getElementById('lyDoMuaSam').value;
    }

    fetch(WEB_APP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    .then(() => { alert("Đã gửi yêu cầu thành công!"); document.querySelectorAll('.app-form').forEach(f => f.reset()); });
}

function xuLyAdmin(id, hanhDong) {
    if(confirm(`Xác nhận ${hanhDong} yêu cầu ID: ${id}?`)) {
        fetch(WEB_APP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: 'adminDuyet', id: id, ketQua: hanhDong }) })
        .then(() => { alert("Đã xử lý! Đang làm mới bảng..."); setTimeout(taiKetQuaTuSheets, 1500); });
    }
}

// ==========================================
// 6. KHỞI CHẠY TỰ ĐỘNG
// ==========================================
window.onload = function() {
    setInterval(capNhatThoiGian, 1000); capNhatThoiGian();
    taiDuLieuTrangChu();
    if (document.getElementById('admin-panel')) taiKetQuaTuSheets();
    if (document.getElementById('ket-qua-gv') && document.getElementById('ket-qua-gv').classList.contains('active')) taiKetQuaGiaoVien();
};
// ==========================================
// 7. XUẤT FILE WORD ĐỂ IN PHIẾU
// ==========================================
function xuatFileWord(loaiPhieu) {
    let title = "";
    let content = "";
    const today = new Date();
    const ngayIn = `Cần Thơ, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    if (loaiPhieu === 'baoHong') {
        let viTri = document.getElementById('viTriSuCo').value;
        let moTa = document.getElementById('moTaSuCo').value;
        if(!viTri || !moTa) return alert("Vui lòng nhập đủ thông tin báo hỏng trước khi xuất file in!");

        title = "PHIẾU BÁO HỎNG THIẾT BỊ / SỰ CỐ PHÒNG HỌC";
        content = `
            <p style="font-size: 14pt;"><strong>Vị trí / Mã thiết bị sự cố:</strong> ${viTri}</p>
            <p style="font-size: 14pt;"><strong>Chi tiết tình trạng lỗi hiện tại:</strong> ${moTa}</p>
            <p style="font-size: 14pt;">Kính đề nghị Ban Giám Hiệu và Quản trị viên bộ môn xem xét, có phương án sửa chữa hoặc thay thế kịp thời để đảm bảo công tác giảng dạy.</p>
        `;
    } 
    else if (loaiPhieu === 'muaSam') {
        let tenTB = document.getElementById('tenTBMuaSam').value;
        let soLuong = document.getElementById('soLuongMuaSam').value;
        let lyDo = document.getElementById('lyDoMuaSam').value;
        if(!tenTB || !soLuong || !lyDo) return alert("Vui lòng nhập đủ thông tin đề xuất trước khi xuất file in!");

        title = "PHIẾU ĐỀ XUẤT MUA SẮM THIẾT BỊ / VẬT TƯ DẠY HỌC";
        content = `
            <p style="font-size: 14pt;"><strong>Tên thiết bị / Hóa chất đề xuất mua:</strong> ${tenTB}</p>
            <p style="font-size: 14pt;"><strong>Số lượng cần thiết:</strong> ${soLuong}</p>
            <p style="font-size: 14pt;"><strong>Lý do / Mục đích sử dụng:</strong> ${lyDo}</p>
            <p style="font-size: 14pt;">Kính đề nghị Ban Giám Hiệu phê duyệt mua sắm để phục vụ tốt cho công tác thực hành của học sinh.</p>
        `;
    }

    // Tạo cấu trúc chuẩn của MS Word bằng HTML
    let htmlString = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'></head>
        <body style="font-family: 'Times New Roman', serif;">
            <table width="100%" style="text-align: center; font-size: 13pt;">
                <tr>
                    <td width="40%">SỞ GIÁO DỤC VÀ ĐÀO TẠO<br><strong>TRƯỜNG THPT BÌNH THỦY</strong><br><hr style="width: 50%;"></td>
                    <td width="60%"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</strong><br><hr style="width: 40%;"></td>
                </tr>
            </table>
            <br>
            <h2 style="text-align: center; font-size: 18pt;">${title}</h2>
            <div style="line-height: 1.5;">
                ${content}
            </div>
            <br><br>
            <table width="100%" style="text-align: center; font-size: 14pt;">
                <tr>
                    <td width="50%"></td>
                    <td width="50%"><em>${ngayIn}</em></td>
                </tr>
                <tr>
                    <td width="50%"><strong>NGƯỜI LẬP PHIẾU</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
                    <td width="50%"><strong>HIỆU TRƯỞNG PHÊ DUYỆT</strong><br><em>(Ký, đóng dấu)</em></td>
                </tr>
            </table>
        </body>
        </html>
    `;

    // Đóng gói thành file .doc và tải xuống
    let blob = new Blob(['\ufeff', htmlString], { type: 'application/msword' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.href = url;
    link.download = `Phieu_${loaiPhieu}_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// ==========================================
// 8. TẢI VÀ MỞ DANH MỤC THIẾT BỊ
// ==========================================
function moTrangTinh() {
    if (SPREADSHEET_URL.includes("LINK_GOOGLE_SHEETS")) {
        alert("Admin ơi, bạn chưa dán link Google Sheets vào dòng số 5 của file script.js kìa!");
        return;
    }
    window.open(SPREADSHEET_URL, '_blank');
}

function taiDanhMucThietBi() {
    if (SPREADSHEET_URL.includes("LINK_GOOGLE_SHEETS")) {
        alert("Hệ thống chưa được cấu hình Link tải. Vui lòng báo cho Quản trị viên!");
        return;
    }
    // Tự động phân tích Link Google Sheets để tạo link tải file Excel (.xlsx)
    try {
        let urlParts = SPREADSHEET_URL.split('/');
        let idIndex = urlParts.indexOf('d') + 1;
        let sheetId = urlParts[idIndex];
        
        let downloadUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
        
        // Tự động kích hoạt tải xuống
        window.location.href = downloadUrl;
    } catch (error) {
        alert("Link CSDL không hợp lệ. Vui lòng báo cho Quản trị viên!");
    }
}