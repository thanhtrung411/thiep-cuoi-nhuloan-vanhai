(() => {
  "use strict";

  /* ============================================================
     1. GATE OPENING MODULE
     ============================================================ */
  const initGate = () => {
    const gate = document.getElementById("invitationGate");
    const secEl = document.getElementById("autoOpenSec");

    if (!gate) return;

    let timeLeft = 5;
    let isOpened = false;

    const triggerFallingFlowers = (count, maxDelay = 2.0) => {
      const container = document.body;

      for (let i = 0; i < count; i++) {
        const petal = document.createElement("div");
        
        // Chọn ngẫu nhiên loại cánh hoa (1: đào, 2: hồng, 3: đốm sáng)
        const type = Math.random() < 0.45 ? 1 : (Math.random() < 0.8 ? 2 : 3);
        petal.className = `falling-petal petal-type-${type}`;

        const left = Math.random() * 100; // Vị trí xuất phát ngẫu nhiên
        const scale = 0.6 + Math.random() * 0.7; // Kích thước ngẫu nhiên từ 0.6x đến 1.3x
        
        let width = 12;
        let height = 14;
        if (type === 3) {
          width = 6;
          height = 6;
        }

        // Tốc độ rơi: Kéo dài từ 6 đến 10 giây cực kỳ uyển chuyển chậm rãi
        const duration = 6.0 + Math.random() * 4.0;
        const delay = Math.random() * maxDelay; // Sử dụng maxDelay để kéo giãn thời gian bắt đầu rơi của mỗi cánh hoa
        const drift = -120 + Math.random() * 240; // Độ bay lệch ngang ngẫu nhiên rộng

        petal.style.left = `${left}%`;
        petal.style.width = `${width * scale}px`;
        petal.style.height = `${height * scale}px`;
        petal.style.animationDuration = `${duration}s`;
        petal.style.animationDelay = `${delay}s`;
        
        // Truyền các biến CSS cho animation
        petal.style.setProperty("--drift", `${drift}px`);
        
        // Tạo góc xoay ban đầu và kết thúc ngẫu nhiên cho hiệu ứng nhào lộn 3D
        const initRot = Math.random() * 360;
        const endRot = initRot + 180 + Math.random() * 360;
        petal.style.setProperty("--init-rot", `${initRot}deg`);
        petal.style.setProperty("--end-rot", `${endRot}deg`);

        container.appendChild(petal);

        // Tự động giải phóng bộ nhớ sau khi cánh hoa đã rơi hết
        setTimeout(() => {
          petal.remove();
        }, (duration + delay) * 1000);
      }
    };

    const openGate = () => {
      if (isOpened) return;
      isOpened = true;

      // Xóa các bộ đếm thời gian
      clearInterval(countdownInterval);
      clearTimeout(autoOpenTimeout);

      document.body.classList.add("gate-open");
      gate.classList.add("is-open");

      // Cố gắng phát nhạc khi mở thiệp
      tryPlayMusic();

      // 1. Kích hoạt đợt rơi cánh hoa chào mừng ban đầu (30 cánh), so le rải rác trong 8 giây đầu
      triggerFallingFlowers(30, 8.0);

      // 2. Duy trì mưa hoa bay liên tục: mỗi 1 giây rơi 2 cánh, so le trong 1 giây
      setInterval(() => {
        triggerFallingFlowers(2, 1.0);
      }, 1000);
    };

    // Mở thủ công bằng cách click
    gate.addEventListener("click", openGate, { once: true });

    // Đếm ngược số giây hiển thị trên giao diện
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (secEl) {
        secEl.textContent = timeLeft;
      }
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Tự động mở sau 5 giây
    const autoOpenTimeout = setTimeout(() => {
      openGate();
    }, 5000);
  };

  /* ============================================================
     2. MUSIC MODULE
     ============================================================ */
  let audioElement = null;

  const tryPlayMusic = () => {
    const audio = document.getElementById("backgroundMusic");
    const musicHint = document.getElementById("musicHint");
    const musicToggle = document.getElementById("musicToggle");

    if (!audio) {
      if (musicHint) musicHint.textContent = "Chưa gắn file nhạc";
      return;
    }

    // Lazy-load source from data-src if not yet set
    if (!audio.src || audio.src === window.location.href) {
      const dataSrc = audio.getAttribute("data-src");
      if (dataSrc) {
        audio.src = dataSrc;
        audio.load();
      } else {
        if (musicHint) musicHint.textContent = "Chưa gắn file nhạc";
        return;
      }
    }

    audioElement = audio;

    audio
      .play()
      .then(() => {
        if (musicHint) musicHint.textContent = "Nhạc đang phát";
        musicToggle?.classList.add("is-active");
      })
      .catch(() => {
        if (musicHint) musicHint.textContent = "Chạm để bật nhạc";
        musicToggle?.classList.remove("is-active");

        // GESTURE FALLBACK: Tự động phát nhạc ở lần đầu chạm, lướt hoặc cuộn trang nếu bị trình duyệt chặn autoplay
        const playMusicFallback = () => {
          if (audio.paused) {
            audio.play().then(() => {
              if (musicHint) musicHint.textContent = "Nhạc đang phát";
              musicToggle?.classList.add("is-active");
              removeFallbackListeners();
            }).catch(() => {});
          } else {
            removeFallbackListeners();
          }
        };

        const removeFallbackListeners = () => {
          const events = ["pointerdown", "pointerup", "touchstart", "touchend", "click", "scroll", "wheel"];
          events.forEach(ev => {
            window.removeEventListener(ev, playMusicFallback);
            document.removeEventListener(ev, playMusicFallback);
          });
        };

        const events = ["pointerdown", "pointerup", "touchstart", "touchend", "click", "scroll", "wheel"];
        events.forEach(ev => {
          window.addEventListener(ev, playMusicFallback, { passive: true });
          document.addEventListener(ev, playMusicFallback, { passive: true });
        });
      });
  };

  const initMusic = () => {
    const musicToggle = document.getElementById("musicToggle");
    const audio = document.getElementById("backgroundMusic");
    const musicHint = document.getElementById("musicHint");

    if (!musicToggle) return;

    // Lazy-load source from data-src on first interaction if needed
    const ensureSource = () => {
      if (audio && (!audio.src || audio.src === window.location.href)) {
        const dataSrc = audio.getAttribute("data-src");
        if (dataSrc) {
          audio.src = dataSrc;
          audio.load();
        }
      }
    };

    musicToggle.addEventListener("click", () => {
      if (!audio) {
        if (musicHint) musicHint.textContent = "Chưa gắn file nhạc";
        return;
      }

      ensureSource();

      if (audio.paused) {
        audio
          .play()
          .then(() => {
            musicToggle.classList.add("is-active");
            if (musicHint) musicHint.textContent = "Nhạc đang phát";
          })
          .catch(() => {
            if (musicHint) musicHint.textContent = "Chạm để bật nhạc";
          });
      } else {
        audio.pause();
        musicToggle.classList.remove("is-active");
        if (musicHint) musicHint.textContent = "Nhạc đã tắt";
      }
    });
  };

  /* ============================================================
     3. SCROLL REVEAL MODULE
     ============================================================ */
  const initScrollReveal = () => {
    const revealElements = document.querySelectorAll(
      ".reveal-up, .reveal-left, .reveal-fade"
    );

    if (!revealElements.length) return;

    if (!("IntersectionObserver" in window)) {
      // Fallback: reveal everything immediately
      revealElements.forEach((el) => el.classList.add("active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));
  };

  /* ============================================================
     4. AUTO-SCROLL MODULE
     ============================================================ */
  const initAutoScroll = () => {
    const scrollToggle = document.getElementById("scrollToggle");
    if (!scrollToggle) return;

    let scrollInterval = null;
    let isAutoScrolling = false;

    const startAutoScroll = () => {
      if (scrollInterval) return;
      isAutoScrolling = true;
      scrollToggle.classList.add("is-active");

      scrollInterval = setInterval(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        // Stop at bottom of page
        if (scrollTop + clientHeight >= scrollHeight - 1) {
          stopAutoScroll();
          return;
        }

        window.scrollBy({ top: 1.1, behavior: "auto" });
      }, 16);
    };

    const stopAutoScroll = () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
      isAutoScrolling = false;
      scrollToggle.classList.remove("is-active");
    };

    // Toggle button
    scrollToggle.addEventListener("click", () => {
      if (isAutoScrolling) {
        stopAutoScroll();
      } else {
        startAutoScroll();
      }
    });

    // Show/hide button based on scroll position
    const handleScrollVisibility = () => {
      if (window.scrollY > 260) {
        scrollToggle.classList.add("is-visible");
      } else {
        scrollToggle.classList.remove("is-visible");
      }
    };

    window.addEventListener("scroll", handleScrollVisibility, {
      passive: true,
    });
    handleScrollVisibility();

    // Stop on user interaction (unless target has data-ignore-autoscroll)
    const userInterruptEvents = ["wheel", "touchmove", "mousedown", "keydown"];

    userInterruptEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        (e) => {
          if (!isAutoScrolling) return;
          if (e.target?.closest?.("[data-ignore-autoscroll]")) return;
          stopAutoScroll();
        },
        { passive: true }
      );
    });
  };

  /* ============================================================
     5. COUNTDOWN TIMER MODULE
     ============================================================ */
  const initCountdown = () => {
    const daysEl = document.getElementById("countDays");
    const hoursEl = document.getElementById("countHours");
    const minutesEl = document.getElementById("countMinutes");
    const secondsEl = document.getElementById("countSeconds");

    if (!daysEl && !hoursEl && !minutesEl && !secondsEl) return;

    // July 19, 2026, 08:30 AM Vietnam time (UTC+7)
    // In UTC that is July 19, 2026, 01:30:00
    const weddingDateUTC = Date.UTC(2026, 6, 19, 1, 30, 0); // month is 0-indexed

    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

    const updateCountdown = () => {
      const now = Date.now();
      let diff = weddingDateUTC - now;

      if (diff <= 0) {
        // Wedding time has passed
        if (daysEl) daysEl.textContent = "00";
        if (hoursEl) hoursEl.textContent = "00";
        if (minutesEl) minutesEl.textContent = "00";
        if (secondsEl) secondsEl.textContent = "00";

        // Optionally display an expired message
        const countdownContainer =
          daysEl?.closest(".countdown") ||
          daysEl?.closest("[class*='countdown']");
        if (countdownContainer) {
          let msg = countdownContainer.querySelector(".countdown-expired");
          if (!msg) {
            msg = document.createElement("p");
            msg.className = "countdown-expired";
            msg.textContent = "🎉 Đã đến ngày trọng đại! 🎉";
            countdownContainer.appendChild(msg);
          }
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (daysEl) daysEl.textContent = pad(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minutesEl) minutesEl.textContent = pad(minutes);
      if (secondsEl) secondsEl.textContent = pad(seconds);
    };

    // Run immediately, then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
  };

  /* ============================================================
     6. RSVP FORM MODULE
     ============================================================ */
  const initRSVP = () => {
    const form = document.getElementById("rsvpForm");
    const thankYou = document.getElementById("rsvpThankYou");
    const animOverlay = document.getElementById("rsvpAnimOverlay");
    const envContainer = document.getElementById("envContainer");
    const letterGuestName = document.getElementById("letterGuestName");
    const letterGuestMessage = document.getElementById("letterGuestMessage");

    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const guestName = formData.get("guestName") || "Khách mời";
      const guestMessage = formData.get("guestMessage") || "Chúc hai bạn trăm năm hạnh phúc, bạc đầu nghĩa phu thê! ❤️";
      const attendance = formData.get("attendance") || "Sẽ tham dự";
      const guestParty = formData.get("guestParty") || "Tiệc Cưới Nhà Gái";
      const guestCount = formData.get("guestCount") || "1";

      const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyZ8MYvg7-DJfcgSXSuXdMJMfFpd-AW1TDU13kVkhFkInsbDEpDxyVGWREzA0i6ZEvC/exec";

      // Chuyển dữ liệu sang URLSearchParams để tương thích hoàn toàn với chế độ no-cors trên GitHub Pages
      const params = new URLSearchParams({
        guestName: guestName,
        guestMessage: guestMessage,
        attendance: attendance,
        guestParty: guestParty,
        guestCount: guestCount
      });

      fetch(GOOGLE_SHEET_URL + "?" + params.toString(), {
        method: "GET",
        mode: "no-cors"
      }).catch(err => console.error("Lỗi gửi Google Sheet:", err));

      if (animOverlay && envContainer) {
        // Set letter text
        if (letterGuestName) letterGuestName.textContent = guestName;
        if (letterGuestMessage) letterGuestMessage.textContent = guestMessage;

        // Reset animation classes
        envContainer.className = "envelope-container";
        animOverlay.classList.add("is-active");

        // Step 1: Fold letter (slide down into envelope)
        setTimeout(() => {
          envContainer.classList.add("step-fold");
        }, 1000);

        // Step 2: Close flap
        setTimeout(() => {
          envContainer.classList.add("step-flap");
        }, 3100);

        // Step 2.5: Stamp heart seal
        setTimeout(() => {
          envContainer.classList.add("step-heart");
        }, 3700);

        // Step 3: Fly away
        setTimeout(() => {
          envContainer.classList.add("step-fly");
        }, 4200);

        // Step 4: Hide animation, show thank you message
        setTimeout(() => {
          animOverlay.classList.remove("is-active");
          form.style.display = "none";
          if (thankYou) {
            thankYou.removeAttribute("hidden");
            thankYou.style.display = "block";
            thankYou.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 5600);
      } else {
        // Fallback if elements don't exist
        form.style.display = "none";
        if (thankYou) {
          thankYou.removeAttribute("hidden");
          thankYou.style.display = "block";
          thankYou.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  };

  /* ============================================================
     7. LIGHTBOX GALLERY MODULE
     ============================================================ */
  const initLightbox = () => {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const galleryImages = document.querySelectorAll(".gallery-photo img");

    if (!lightbox || !lightboxImg || !galleryImages.length) return;

    const openLightbox = (src) => {
      lightboxImg.src = src;
      lightbox.classList.add("is-active");
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      lightbox.classList.remove("is-active");
      document.body.style.overflow = "";
      lightboxImg.src = "";
    };

    // Click on gallery image to open
    galleryImages.forEach((img) => {
      img.addEventListener("click", () => {
        openLightbox(img.src);
      });
      img.style.cursor = "pointer";
    });

    // Click on lightbox background to close
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.classList.contains("lightbox-close")) {
        closeLightbox();
      }
    });

    // Escape key closes lightbox
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-active")) {
        closeLightbox();
      }
    });
  };

  /* ============================================================
     8. CALENDAR HIGHLIGHT MODULE
     ============================================================ */
  const initCalendarHighlight = () => {
    const calendarDays = document.querySelectorAll(".calendar-day[data-day]");

    calendarDays.forEach((dayEl) => {
      const day = parseInt(dayEl.getAttribute("data-day"), 10);
      if (day === 19 || day === 20) {
        dayEl.classList.add("calendar-highlight");
      }
    });
  };

  /* ============================================================
     INITIALISE ALL MODULES ON DOM READY
     ============================================================ */
  const init = () => {
    initGate();
    initMusic();
    initScrollReveal();
    initAutoScroll();
    initCountdown();
    initRSVP();
    initLightbox();
    // initCalendarHighlight();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// Hàm sao chép số tài khoản nhanh dành cho khách mời (Global Scope)
window.copyAccountNumber = (number, btn) => {
  navigator.clipboard.writeText(number).then(() => {
    const originalText = btn.innerHTML;
    // Thay nút bằng dấu tích xanh báo thành công
    btn.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Copied
    `;
    btn.classList.add("copied");
    
    // Khôi phục lại sau 2 giây
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove("copied");
    }, 2000);
  }).catch(err => {
    console.error("Lỗi khi sao chép STK:", err);
  });
};
