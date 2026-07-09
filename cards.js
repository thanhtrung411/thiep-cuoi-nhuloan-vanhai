/**
 * Hộp Thư Lời Chúc - Cards Interaction Script
 */

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyZ8MYvg7-DJfcgSXSuXdMJMfFpd-AW1TDU13kVkhFkInsbDEpDxyVGWREzA0i6ZEvC/exec";

// Danh sách chứa RSVP nhận được
let allRsvps = [];
let cardElements = []; // Bộ nhớ cache lưu trữ các phần tử DOM để tăng hiệu năng trên điện thoại
let currentIndex = 0;
let isAnimating = false;

/**
 * 1. XỬ LÝ ĐĂNG NHẬP MỞ KHÓA HỘP THƯ
 */
const handleAuthSubmit = async () => {
  const passwordInput = document.getElementById("passwordInput");
  const authBtn = document.getElementById("authBtn");
  const authError = document.getElementById("authError");
  
  const password = passwordInput.value.trim();
  if (!password) return;
  
  // Thiết lập trạng thái chờ (loading)
  authBtn.disabled = true;
  authBtn.innerText = "Đang kiểm tra...";
  authError.innerText = "";
  
  try {
    // Gọi API Apps Script với tham số read & password
    const url = `${GOOGLE_SHEET_URL}?action=read&password=${encodeURIComponent(password)}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.status === "success") {
      // Đảo ngược mảng để quét từ trên bảng xuống (hàng đầu tiên = lá bài đầu tiên)
      allRsvps = (result.data || []).reverse();
      
      // Chuyển sang màn hình hiển thị bộ bài
      document.getElementById("authSection").classList.add("is-hidden");
      document.getElementById("deckSection").classList.remove("is-hidden");
      
      // Render danh sách các lá bài
      initDeck();
    } else {
      // Báo lỗi mật khẩu
      authError.innerText = result.message || "Có lỗi xảy ra, vui lòng thử lại!";
      authBtn.disabled = false;
      authBtn.innerText = "Mở khóa hộp thư";
    }
  } catch (err) {
    console.error("Lỗi xác thực:", err);
    authError.innerText = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng!";
    authBtn.disabled = false;
    authBtn.innerText = "Mở khóa hộp thư";
  }
};

/**
 * 2. KÍCH HOẠT VÀ DỰNG BỘ BÀI RSVP
 */
const initDeck = () => {
  const deckWrapper = document.getElementById("deckWrapper");
  const deckCounter = document.getElementById("deckCounter");
  const deckControls = document.getElementById("deckControls");
  
  // Dọn dẹp màn hình và cache cũ
  deckWrapper.innerHTML = "";
  cardElements = [];
  currentIndex = 0;
  
  if (allRsvps.length === 0) {
    // Trường hợp chưa có ai xác nhận tham dự
    deckWrapper.innerHTML = `
      <div class="rsvp-card end-card">
        <div class="end-icon">💌</div>
        <h2 class="end-title">Hộp thư còn trống</h2>
        <p class="end-desc">Hiện tại chưa có khách mời nào gửi lời chúc hoặc xác nhận tham dự cưới.</p>
        <a href="index.html" class="restart-btn" style="text-decoration: none; border-color: var(--wine-dark);">Quay lại trang chính</a>
      </div>
    `;
    deckCounter.innerText = "0/0";
    return;
  }
  
  // Dựng các lá bài RSVP
  // Do các phần tử được vẽ sau cùng sẽ nằm trên cùng trong DOM, chúng ta vẽ đảo ngược:
  // 1. Vẽ lá bài đặc biệt Kết thúc dưới cùng (End Card)
  const endCard = document.createElement("div");
  endCard.className = "rsvp-card end-card";
  endCard.innerHTML = `
    <div class="end-icon">💖</div>
    <h2 class="end-title">Hết thư rồi nhe!</h2>
    <p class="end-desc">Bạn đã đọc hết tất cả các lời chúc dễ thương của mọi người gửi tới cô dâu chú rể rồi.</p>
    <button class="restart-btn" onclick="resetDeck()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      Xem lại từ đầu
    </button>
  `;
  deckWrapper.appendChild(endCard);
  
  // 2. Vẽ các lá bài chúc mừng từ cuối mảng đến đầu mảng
  // Lá bài được append sau cùng sẽ nằm trên cùng trong DOM
  // => Duyệt ngược từ cuối mảng lên đầu để lá bài index 0 nằm trên cùng
  for (let i = allRsvps.length - 1; i >= 0; i--) {
    const rsvp = allRsvps[i];
    const card = document.createElement("div");
    card.className = "rsvp-card";
    card.id = `card-${i}`;
    
    // Hiển thị đầy đủ ngày giờ phút giây
    const displayTime = rsvp.time || "";
    
    // Xác định badge trạng thái tham dự
    const isYes = rsvp.attendance.toLowerCase().includes("sẽ tham dự") || rsvp.attendance.toLowerCase().includes("yes");
    const statusText = isYes ? "Sẽ tham dự" : "Tiếc quá...";
    const statusClass = isYes ? "status-yes" : "status-no";
    
    card.innerHTML = `
      <div class="card-header">
        <span class="card-num">#${i + 1}</span>
        <h2 class="card-guest-name">${escapeHtml(rsvp.name)}</h2>
        <div class="badge-group">
          <span class="status-badge ${statusClass}">${statusText}</span>
          <span class="party-badge">${escapeHtml(rsvp.party || "Tiệc cưới")}</span>
        </div>
      </div>
      
      <div class="card-body">
        <p class="guest-wish">${escapeHtml(rsvp.message || "Chúc hai bạn trăm năm hạnh phúc, bạc đầu nghĩa phu thê! ❤️")}</p>
      </div>
      
      <div class="card-footer">
        <div class="guest-count-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Đi cùng: <strong>${escapeHtml(rsvp.guests || "1")} người</strong></span>
        </div>
        <span>${escapeHtml(displayTime)}</span>
      </div>
    `;
    
    // Đăng ký sự kiện Click/Touch để vuốt lá bài trên cùng
    card.addEventListener("click", () => swipeCard(i));
    
    deckWrapper.appendChild(card);
    cardElements[i] = card; // Lưu cache DOM tham chiếu
  }
  
  // Hiển thị bộ đếm và bảng điều khiển nút ở dưới
  updateCounter();
  updateStack();
  deckControls.classList.remove("is-hidden");
};

/**
 * 2.5 CẬP NHẬT HIỆU ỨNG XẾP BÀI (STACK VISUAL)
 * Chỉ hiện tối đa 3 lá bài, các lá phía dưới lệch phải-xuống
 */
const MAX_VISIBLE = 3;

const updateStack = () => {
  // Chỉ lặp qua khoảng hoạt động nhỏ xung quanh lá bài hiện tại (Tăng tốc độ render cực lớn trên di động)
  const start = currentIndex;
  const end = Math.min(allRsvps.length, currentIndex + MAX_VISIBLE + 1);
  
  // Ẩn lá bài vừa bị vuốt đi ngay lập tức
  if (currentIndex > 0) {
    const prevCard = cardElements[currentIndex - 1];
    if (prevCard) {
      prevCard.style.visibility = "hidden";
      prevCard.style.opacity = "0";
    }
  }

  for (let i = start; i < end; i++) {
    const card = cardElements[i];
    if (!card) continue;
    
    // Bỏ qua các lá bài đã bị vuốt
    if (card.classList.contains("swiped-left") || card.classList.contains("swiped-right")) continue;
    
    const stackPos = i - currentIndex; // Vị trí trong xấp bài (0 = trên cùng)
    
    if (stackPos >= MAX_VISIBLE) {
      card.style.visibility = "hidden";
      card.style.opacity = "0";
      card.removeAttribute("data-stack");
      continue;
    }
    
    // Hiện lá bài trong stack
    card.style.visibility = "visible";
    card.style.opacity = stackPos === 0 ? "1" : `${1 - stackPos * 0.05}`;
    card.setAttribute("data-stack", stackPos);
    
    // Hiệu ứng lệch phải-xuống cho các lá bài phía dưới (lộ cạnh bài rõ)
    const offsetX = stackPos * 8;   // Lệch phải (px)
    const offsetY = stackPos * 6;   // Lệch xuống (px)
    const scale = 1 - stackPos * 0.02; // Thu nhỏ nhẹ
    const zIndex = MAX_VISIBLE - stackPos;
    
    card.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`;
    card.style.zIndex = zIndex;
  }
};

/**
 * 3. HIỆU ỨNG VUỐT/BAY LÁ BÀI (SWIPE CARD)
 */
const swipeCard = (index) => {
  if (isAnimating || index !== currentIndex) return;
  
  const card = cardElements[index];
  if (!card) return;
  
  isAnimating = true;
  
  // So le hướng vuốt: chỉ số chẵn vuốt phải (Right), chỉ số lẻ vuốt trái (Left)
  const directionClass = index % 2 === 0 ? "swiped-right" : "swiped-left";
  card.style.transition = "none";
  card.classList.add(directionClass);
  
  currentIndex++;
  updateCounter();
  
  // Cập nhật stack ngay lập tức để các lá bài phía dưới trượt lên
  updateStack();
  
  // Đợi animation hoàn thành sau 550ms
  setTimeout(() => {
    card.style.display = "none";
    isAnimating = false;
  }, 550);
};

// Đăng ký click cho nút điều khiển bên dưới
document.getElementById("btnLeft").addEventListener("click", () => {
  if (currentIndex < allRsvps.length) {
    swipeCard(currentIndex);
  }
});

document.getElementById("btnRight").addEventListener("click", () => {
  if (currentIndex < allRsvps.length) {
    swipeCard(currentIndex);
  }
});

/**
 * 4. CẬP NHẬT BỘ ĐẾM SỐ THIỆP
 */
const updateCounter = () => {
  const deckCounter = document.getElementById("deckCounter");
  const displayIndex = Math.min(currentIndex + 1, allRsvps.length);
  deckCounter.innerText = `${displayIndex}/${allRsvps.length}`;
};

/**
 * 5. KHÔI PHỤC LẠI BỘ BÀI TỪ ĐẦU (RESET DECK)
 */
const resetDeck = () => {
  if (isAnimating) return;
  isAnimating = true;
  
  currentIndex = 0;
  updateCounter();
  
  // Khôi phục hiển thị và tạo hiệu ứng fly-back cho tất cả lá bài
  for (let i = allRsvps.length - 1; i >= 0; i--) {
    const card = cardElements[i];
    if (card) {
      card.style.display = "flex";
      card.classList.remove("swiped-left", "swiped-right");
      card.style.transition = "";
      card.className = "rsvp-card card-resetting";
      
      // Xóa class reset sau khi animation kết thúc
      setTimeout(() => {
        card.classList.remove("card-resetting");
      }, 450);
    }
  }
  
  // Cập nhật stack sau khi reset
  setTimeout(() => {
    // Ẩn trước những card nằm ngoài tầm nhìn ban đầu để tránh chớp nháy
    for (let i = MAX_VISIBLE; i < allRsvps.length; i++) {
      const card = cardElements[i];
      if (card) {
        card.style.visibility = "hidden";
        card.style.opacity = "0";
      }
    }
    updateStack();
    isAnimating = false;
  }, 500);
};

// Hàm escape ký tự đặc biệt tránh tấn công XSS
const escapeHtml = (text) => {
  if (!text) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, (m) => map[m]);
};
