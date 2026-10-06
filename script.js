// Thay link Google Web App của bạn vào đây!
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwEZuJai2Fik6poHkc_Ef7UtN67vAFKpBdvnFdopWVLM8J6rdheVw4msrlUbUTrJA1m2A/exec";
// KHAI BÁO LINK FILE GOOGLE SHEETS GỐC CỦA BẠN VÀO ĐÂY:
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
// 3. CHUYỂN TAB 
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
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`; 

        const tongPhut = now.getHours() * 60 + now.getMinutes();
        let currentTiet = -1;
        let currentBuoi = "";

        for (let tiet of thoiGianBieu) {
            if (tongPhut >= tiet.batDau && tongPhut <= tiet.ketThuc) {
                currentTiet = parseInt(tiet.ten.match(/\d+/)[0]);
                currentBuoi = tiet.ten.includes("Sáng") ? "Sáng" : "Chiều";
                break;
            }
        }

        const approvedToday = ketQuaData.filter(item => 
            item.trangThai === "Đã Duyệt" && (item.chiTiet || "").includes(todayStr)
        );

        // A. CẬP NHẬT TRẠNG THÁI PHÒNG
        ulPhong.innerHTML = "";
        dashboardData.phong.forEach(p => {
            let status = "Trống";
            let badge = "badge-green";
            let gvInfo = "";

            if (currentTiet !== -1) {
                let dangBan = approvedToday.find(req => {
                    if (req.loaiYeuCau === "Đặt Phòng" && req.chiTiet.includes(p.maPhong) && req.chiTiet.includes(currentBuoi)) {
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

        // B. CẬP NHẬT TỒN KHO THIẾT BỊ
        ulTB.innerHTML = "";
        dashboardData.thietBi.forEach(tb => {
            let slBanDau = parseInt(tb.soLuong) || 0;
            let slDaMuon = 0;
            approvedToday.forEach(req => {
                if (req.loaiYeuCau === "Mượn Thiết Bị" && req.chiTiet.includes(tb.maTB)) slDaMuon += 1; 
            });

            let slConLai = slBanDau - slDaMuon;
            let donVi = tb.donVi ? tb.donVi : '';
            let status = slConLai > 0 ? slConLai + ' ' + donVi : 'Hết / Đang mượn';
            let badge = slConLai > 0 ? "badge-green" : "badge-red";
            ulTB.innerHTML += `<li><span class="badge ${badge}">${status}</span> <strong>${tb.maTB}</strong>: ${tb.tenTB}</li>`;
        });

        // C. TỰ ĐỘNG BƠM DỮ LIỆU VÀO FORM ĐĂNG KÝ
        const selectPhong = document.getElementById('maPhong');
        if (selectPhong) {
            selectPhong.innerHTML = '<option value="">-- Chọn phòng bộ môn --</option>';
            dashboardData.phong.forEach(p => {
                selectPhong.innerHTML += `<option value="${p.maPhong}">${p.tenPhong}</option>`;
            });
        }

        const selectTB = document.getElementById('maTB');
        if (selectTB && selectTB.tagName === 'SELECT') {
            selectTB.innerHTML = '<option value="">-- Chọn thiết bị cần mượn --</option>';
            dashboardData.thietBi.forEach(tb => {
                selectTB.innerHTML += `<option value="${tb.maTB}">${tb.maTB} - ${tb.tenTB}</option>`;
            });
        }

        // D. KHU VỰC NHẮC VIỆC TRÊN TRANG ADMIN
        const ulNhacViec = document.getElementById('danh-sach-nhac-viec');
        if (ulNhacViec) {
            ulNhacViec.innerHTML = "";
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const t_yyyy = tomorrow.getFullYear();
            const t_mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const t_dd = String(tomorrow.getDate()).padStart(2, '0');
            const tomorrowStr = `${t_yyyy}-${t_mm}-${t_dd}`; 

            const pendingReqs = ketQuaData.filter(item => item.trangThai === "Chờ duyệt" || !item.trangThai);
            const tomorrowReqs = ketQuaData.filter(item => item.trangThai === "Đã Duyệt" && (item.chiTiet || "").includes(tomorrowStr));

            if (pendingReqs.length > 0) {
                ulNhacViec.innerHTML += `<li style="color: #dc3545; font-weight: bold; background: #ffe6e6; padding: 10px; border-radius: 5px;">🚨 BẠN CÓ ${pendingReqs.length} YÊU CẦU MỚI CHỜ DUYỆT! (Vui lòng qua tab Duyệt Yêu Cầu)</li>`;
            } else {
                ulNhacViec.innerHTML += `<li style="color: #6c757d;">✅ Không có yêu cầu nào đang chờ duyệt.</li>`;
            }

            ulNhacViec.innerHTML += `<li style="margin-top: 15px; font-weight: bold; color: #0056b3;">📅 CÔNG VIỆC CẦN CHUẨN BỊ CHO NGÀY MAI (${t_dd}/${t_mm}):</li>`;
            if (tomorrowReqs.length > 0) {
                tomorrowReqs.forEach(req => {
                    ulNhacViec.innerHTML += `<li style="border-left: 3px solid #007bff; margin-left: 10px; padding-left: 10px; margin-bottom: 5px;"><strong>${req.tenGV}</strong> | ${req.loaiYeuCau}: ${req.chiTiet}</li>`;
                });
            } else {
                ulNhacViec.innerHTML += `<li style="color: #28a745; margin-left: 10px;">Ngày mai chưa có lịch mượn phòng/thiết bị nào. Bạn có thể nghỉ ngơi!</li>`;
            }
        }
    })
    .catch(err => {
        console.error("Lỗi:", err);
        ulPhong.innerHTML = "<li style='color:red;'>Lỗi kết nối CSDL Google.</li>";
        ulTB.innerHTML = "<li style='color:red;'>Lỗi kết nối CSDL Google.</li>";
    });
}

// ==========================================
// 5. TẢI BẢNG KẾT QUẢ
// ==========================================
function taiKetQuaTuSheets() {
    const tbody = document.getElementById('table-ket-qua-dang-ky');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Đang tải dữ liệu...</td></tr>";

    fetch(WEB_APP_URL + "?action=getKetQua").then(res => res.json()).then(data => {
        tbody.innerHTML = "";
        data.forEach(item => {
            let badgeColor = item.trangThai === "Đã Duyệt" ? "badge-green" : (item.trangThai === "Từ chối" ? "badge-red" : "badge-orange");
            let btnAdmin = (item.trangThai === "Chờ duyệt" || !item.trangThai) ? `
                <button class="action-btn btn-duyet" onclick="xuLyAdmin('${item.id}', 'Đã Duyệt')">Duyệt</button>
                <button class="action-btn btn-tuchoi" onclick="xuLyAdmin('${item.id}', 'Từ chối')">Từ chối</button>` : "";

            tbody.innerHTML += `<tr><td>${item.id || 'N/A'}</td><td>${item.tenGV}</td><td>${item.loaiYeuCau}</td><td>${item.chiTiet}</td>
                                <td><span class="badge ${badgeColor}">${item.trangThai || 'Chờ duyệt'}</span></td><td>${btnAdmin}</td></tr>`;
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
                                <td>${item.chiTiet}</td><td><span class="badge ${badgeColor}">${item.trangThai || 'Chờ duyệt'}</span></td></tr>`;
        });
    });
}

// ==========================================
// 6. GỬI & DUYỆT YÊU CẦU
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
        .then(() => { alert("Đã xử lý! Đang làm mới bảng..."); setTimeout(taiKetQuaTuSheets, 1500); taiDuLieuTrangChu(); });
    }
}

// ==========================================
// 7. KHỞI CHẠY TỰ ĐỘNG
// ==========================================
window.onload = function() {
    setInterval(capNhatThoiGian, 1000); capNhatThoiGian();
    taiDuLieuTrangChu();
    if (document.getElementById('admin-panel')) taiKetQuaTuSheets();
    if (document.getElementById('ket-qua-gv') && document.getElementById('ket-qua-gv').classList.contains('active')) taiKetQuaGiaoVien();
};

// ==========================================
// 8. TIỆN ÍCH: TẢI DANH MỤC VÀ XUẤT WORD
// ==========================================
function moTrangTinh() {
    if (SPREADSHEET_URL.includes("LINK_GOOGLE_SHEETS")) {
        alert("Vui lòng khai báo link Google Sheets gốc ở đầu file script.js!"); return;
    }
    window.open(SPREADSHEET_URL, '_blank');
}

function taiDanhMucThietBi() {
    if (SPREADSHEET_URL.includes("LINK_GOOGLE_SHEETS")) {
        alert("Hệ thống chưa được cấu hình Link tải!"); return;
    }
    try {
        let urlParts = SPREADSHEET_URL.split('/');
        let idIndex = urlParts.indexOf('d') + 1;
        let sheetId = urlParts[idIndex];
        window.location.href = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    } catch (error) { alert("Link CSDL không hợp lệ!"); }
}

function xuatFileWord(loaiPhieu) {
    let title = "", content = "";
    const today = new Date();
    const ngayIn = `Cần Thơ, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    if (loaiPhieu === 'baoHong') {
        let viTri = document.getElementById('viTriSuCo').value;
        let moTa = document.getElementById('moTaSuCo').value;
        if(!viTri || !moTa) return alert("Vui lòng nhập đủ thông tin báo hỏng!");
        title = "PHIẾU BÁO HỎNG THIẾT BỊ / SỰ CỐ PHÒNG HỌC";
        content = `<p style="font-size: 14pt;"><strong>Vị trí / Mã thiết bị sự cố:</strong> ${viTri}</p>
                   <p style="font-size: 14pt;"><strong>Chi tiết lỗi:</strong> ${moTa}</p>
                   <p style="font-size: 14pt;">Kính đề nghị BGH và Quản trị viên xem xét, sửa chữa hoặc thay thế kịp thời.</p>`;
    } 
    else if (loaiPhieu === 'muaSam') {
        let tenTB = document.getElementById('tenTBMuaSam').value;
        let soLuong = document.getElementById('soLuongMuaSam').value;
        let lyDo = document.getElementById('lyDoMuaSam').value;
        if(!tenTB || !soLuong || !lyDo) return alert("Vui lòng nhập đủ thông tin đề xuất!");
        title = "PHIẾU ĐỀ XUẤT MUA SẮM THIẾT BỊ";
        content = `<p style="font-size: 14pt;"><strong>Tên thiết bị đề xuất mua:</strong> ${tenTB}</p>
                   <p style="font-size: 14pt;"><strong>Số lượng:</strong> ${soLuong}</p>
                   <p style="font-size: 14pt;"><strong>Lý do sử dụng:</strong> ${lyDo}</p>
                   <p style="font-size: 14pt;">Kính đề nghị BGH phê duyệt mua sắm để phục vụ giảng dạy.</p>`;
    }

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
            <br><h2 style="text-align: center; font-size: 18pt;">${title}</h2>
            <div style="line-height: 1.5;">${content}</div><br><br>
            <table width="100%" style="text-align: center; font-size: 14pt;">
                <tr><td width="50%"></td><td width="50%"><em>${ngayIn}</em></td></tr>
                <tr><td width="50%"><strong>NGƯỜI LẬP PHIẾU</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
                    <td width="50%"><strong>HIỆU TRƯỞNG PHÊ DUYỆT</strong><br><em>(Ký, đóng dấu)</em></td></tr>
            </table>
        </body>
        </html>`;
    let blob = new Blob(['\ufeff', htmlString], { type: 'application/msword' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.href = url; link.download = `Phieu_${loaiPhieu}_${Date.now()}.doc`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}
