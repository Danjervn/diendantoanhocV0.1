// feedback.js
// Yêu cầu: supabase client đã được khởi tạo (supabase được nạp trước file này)

const Actions = {};

Actions.sendFeedback = async function (ev) {
  try {
    if (ev && ev.preventDefault) ev.preventDefault();

    const nameEl = document.getElementById("fb-name");
    const emailEl = document.getElementById("fb-email");
    const msgEl = document.getElementById("fb-msg");

    const name = nameEl ? nameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim().toLowerCase() : "";
    const message = msgEl ? msgEl.value.trim() : "";

    // Basic validation
    if (!name || !email || !message) {
      alert("Vui lòng điền đầy đủ họ tên, gmail và nội dung.");
      return;
    }

    // Only accept gmail addresses as requested
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      alert("Vui lòng sử dụng địa chỉ Gmail (đuôi @gmail.com).");
      return;
    }

    // Optional: disable button while sending
    const submitBtn = (ev && ev.target && ev.target.querySelector('button[type="submit"]')) || document.querySelector('#fb-send');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.origText = submitBtn.innerText;
      submitBtn.innerText = "Đang gửi...";
    }

    // Insert into Supabase table "feedback"
    const { data, error } = await supabase
      .from("feedback")
      .insert([{
        name,
        email,
        message,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Supabase insert error:", error);
      // Friendly message + hint if it's likely RLS
      if (String(error.message || "").toLowerCase().includes("row-level security") ||
          String(error.message || "").toLowerCase().includes("violates row-level security")) {
        alert("Gửi thất bại do chính sách RLS trên cơ sở dữ liệu. Kiểm tra policy bảng `feedback` (xem console để biết chi tiết).");
      } else {
        alert("Gửi thất bại: " + (error.message || JSON.stringify(error)));
      }
      return;
    }

    // Success - clear form and show message
    if (nameEl) nameEl.value = "";
    if (emailEl) emailEl.value = "";
    if (msgEl) msgEl.value = "";

    alert("Cảm ơn bạn — ý kiến đã được gửi.");
  } catch (err) {
    console.error("sendFeedback unexpected error:", err);
    alert("Đã xảy ra lỗi khi gửi. Xem console để biết chi tiết.");
  } finally {
    // restore button
    const submitBtn2 = document.querySelector('#fb-send') || (ev && ev.target && ev.target.querySelector('button[type="submit"]'));
    if (submitBtn2) {
      submitBtn2.disabled = false;
      if (submitBtn2.dataset && submitBtn2.dataset.origText) submitBtn2.innerText = submitBtn2.dataset.origText;
      else submitBtn2.innerText = "GỬI Ý KIẾN";
    }
  }
};

// Gắn Actions vào window để form onsubmit gọi được
window.Actions = Actions;
