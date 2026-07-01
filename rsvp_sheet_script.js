/**
 * Google Apps Script - RSVP Handler
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
 * 8. Bấm Triển khai, cấp quyền truy cập cho tài khoản và copy URL Web App thu được dán vào script.js trên website.
 */

// Xử lý các yêu cầu GET (dùng phương thức GET gửi dữ liệu qua URL để tránh lỗi chuyển hướng của POST trên HTTPS)
function doGet(e) {
  return doPost(e);
}

function doPost(e) {
  // Cài đặt Headers hỗ trợ CORS trong trường hợp gọi fetch thông thường
  var corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };

  try {
    // 1. Lấy dữ liệu gửi từ Website
    var data = e.parameter;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var startRow = 2; // Bắt đầu quét từ dòng thứ 2
    var lastRow = sheet.getLastRow();
    var nextRow = startRow;
    
    // 2. Tìm dòng trống kế tiếp chưa có số STT (quét từ dòng 2 đi xuống)
    if (lastRow >= startRow) {
      var values = sheet.getRange(1, 1, lastRow, 1).getValues(); // Quét cột A (STT)
      for (var i = startRow - 1; i < lastRow; i++) {
        if (values[i][0] === "" || values[i][0] === null || values[i][0] === undefined) {
          nextRow = i + 1;
          break;
        }
      }
      // Nếu duyệt hết từ dòng 2 đến dòng cuối cùng mà dòng nào cũng có STT, thì lấy dòng kế tiếp sau dòng cuối cùng
      if (nextRow === startRow && values[startRow - 1][0] !== "") {
        nextRow = lastRow + 1;
      }
    }
    
    // 3. Tính số thứ tự (STT) dựa trên dòng điền dữ liệu
    var stt = nextRow - 1; 
    var timestamp = new Date();
    
    // 4. Ghi thông tin vào dòng được chọn
    // Cột A: STT, Cột B: Họ và tên, Cột C: Lời chúc, Cột D: Tham dự?, Cột E: Nơi tham dự, Cột F: Số người, Cột G: Thời gian gửi
    sheet.getRange(nextRow, 1).setValue(stt);
    sheet.getRange(nextRow, 2).setValue(data.guestName || "Khách mời");
    sheet.getRange(nextRow, 3).setValue(data.guestMessage || "");
    sheet.getRange(nextRow, 4).setValue(data.attendance || "Sẽ tham dự");
    sheet.getRange(nextRow, 5).setValue(data.guestParty || "Tiệc Cưới Nhà Gái");
    sheet.getRange(nextRow, 6).setValue(data.guestCount || "1");
    sheet.getRange(nextRow, 7).setValue(Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "HH:mm:ss dd/MM/yyyy"));
    
    // Trả về kết quả JSON thành công
    var response = {
      "status": "success",
      "row": nextRow,
      "stt": stt
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(corsHeaders);
      
  } catch (error) {
    // Trả về lỗi nếu có
    var errorResponse = {
      "status": "error",
      "message": error.toString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(corsHeaders);
  }
}

// Xử lý các yêu cầu preflight OPTIONS để tránh lỗi CORS trên các trình duyệt khắt khe
function doOptions(e) {
  var corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(corsHeaders);
}
