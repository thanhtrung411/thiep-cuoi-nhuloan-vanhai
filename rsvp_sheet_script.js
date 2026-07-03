/**
 * Google Apps Script - RSVP Handler (Upgraded & Fixed Version)
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Mở file Google Sheet của bạn.
 * 2. Chọn Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Copy toàn bộ nội dung file này dán đè vào trình soạn thảo code.
 * 4. Nhấn Save (Lưu).
 * 5. Bấm Triển khai (Deploy) -> Triển khai mới (New deployment).
 * 6. Chọn cấu hình là "Ứng dụng web" (Web app).
 * 7. Cài đặt cấu hình:
 *    - Thực thi dưới danh nghĩa: "Tôi (Email của bạn)"
 *    - Ai có quyền truy cập: "Bất kỳ ai (Anyone)"
 * 8. Bấm Triển khai, cấp quyền truy cập cho tài khoản và copy URL Web App mới dán vào website.
 */

// Xử lý các yêu cầu GET (Hỗ trợ cả Ghi RSVP và Đọc bộ bài RSVP)
function doGet(e) {
  var params = e.parameter;
  var action = params.action;
  
  // NẾU LÀ YÊU CẦU ĐỌC DỮ LIỆU ĐỂ HIỂN THỊ THIỆP XÁC NHẬN
  if (action === "read") {
    var password = params.password;
    if (password !== "19072026") {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Mật khẩu xác thực không chính xác!" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var rsvps = [];
      
      // Quét từ dòng thứ 2 (bỏ qua dòng tiêu đề)
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row[1]) { // Nếu cột B (Tên khách mời) có dữ liệu
          rsvps.push({
            name: row[1],
            message: row[2] || "",
            attendance: row[3] || "Sẽ tham dự",
            party: row[4] || "",
            guests: row[5] || "1",
            time: row[6] || ""
          });
        }
      }
      
      // Đảo ngược thứ tự để thiệp mới gửi xếp lên trên cùng bộ bài
      rsvps.reverse();
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: rsvps }))
                           .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // MẶC ĐỊNH: Chuyển hướng sang ghi dữ liệu RSVP
  return doPost(e);
}

function doPost(e) {
  try {
    // Lấy dữ liệu gửi từ Website
    var data = e.parameter;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var startRow = 2; // Bắt đầu quét từ dòng thứ 2
    var lastRow = sheet.getLastRow();
    var nextRow = startRow;
    
    // Tìm dòng trống kế tiếp chưa có số STT
    if (lastRow >= startRow) {
      var values = sheet.getRange(1, 1, lastRow, 1).getValues(); // Quét cột A
      for (var i = startRow - 1; i < lastRow; i++) {
        if (values[i][0] === "" || values[i][0] === null || values[i][0] === undefined) {
          nextRow = i + 1;
          break;
        }
      }
      if (nextRow === startRow && values[startRow - 1][0] !== "") {
        nextRow = lastRow + 1;
      }
    }
    
    var stt = nextRow - 1; 
    var timestamp = new Date();
    
    // Ghi thông tin vào dòng được chọn
    sheet.getRange(nextRow, 1).setValue(stt);
    sheet.getRange(nextRow, 2).setValue(data.guestName || "Khách mời");
    sheet.getRange(nextRow, 3).setValue(data.guestMessage || "");
    sheet.getRange(nextRow, 4).setValue(data.attendance || "Sẽ tham dự");
    sheet.getRange(nextRow, 5).setValue(data.guestParty || "Tiệc Cưới Nhà Gái");
    sheet.getRange(nextRow, 6).setValue(data.guestCount || "1");
    sheet.getRange(nextRow, 7).setValue(Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "HH:mm:ss dd/MM/yyyy"));
    
    var response = {
      "status": "success",
      "row": nextRow,
      "stt": stt
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    var errorResponse = {
      "status": "error",
      "message": error.toString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
