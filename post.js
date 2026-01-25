// post.js - Hiển thị chi tiết bài và xử lý feedback (theo phong cách giống admin)

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let currentPostId = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  currentPostId = params.get("id");
  if (!currentPostId) {
    const titleEl = document.getElementById("post-title");
    if (titleEl) titleEl.innerText = "Bài viết không tồn tại";
    return;
  }
  // Hiển thị bài
  renderPost();
});

async function renderPost() {
  const titleEl = document.getElementById("post-title");
  try {
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", Number(currentPostId))
      .single();

    if (error || !post) {
      console.error("fetch post error:", error);
      if (titleEl) titleEl.innerText = "Bài viết không tồn tại";
      return;
    }

    // Hiển thị thông tin bài
    if (titleEl) titleEl.innerText = post.title || "";
    const authorEl = document.getElementById("post-author");
    if (authorEl) authorEl.innerText = post.author || "";
    const categoryEl = document.getElementById("post-category");
    if (categoryEl) categoryEl.innerText = (post.category || "");
    const contentEl = document.getElementById("post-content");
    if (contentEl) contentEl.innerHTML = post.content || "";

    // Ảnh
    const imageBox = document.getElementById("image-container");
    if (imageBox) {
      imageBox.innerHTML = "";
      if (Array.isArray(post.images) && post.images.length) {
        if (post.images.length > 1) imageBox.classList.add("multiple-images");
        else imageBox.classList.remove("multiple-images");

        post.images.forEach((src, i) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = post.title || ("Hình " + (i + 1));
          img.loading = "lazy";
          imageBox.appendChild(img);
        });
      }
    }

    // Feedback
    const feedbackArr = Array.isArray(post.feedback) ? post.feedback : [];
    renderFeedback(feedbackArr);
  } catch (err) {
    console.error("renderPost error:", err);
    if (titleEl) titleEl.innerText = "Lỗi khi tải bài viết";
  }
}

function renderFeedback(list) {
  const listEl = document.getElementById("feedback-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!list || list.length === 0) {
    listEl.innerHTML = "<i>Chưa có feedback.</i>";
    return;
  }

  // Hiển thị từ mới nhất xuống (tuỳ bạn muốn đảo chiều)
  // const toShow = [...list].reverse();
  const toShow = list;

  toShow.forEach(fb => {
    const div = document.createElement("div");
    div.className = "feedback-item";
    const name = escapeHtml(fb.name || "Khách");
    const email = escapeHtml(fb.email || "");
    const when = fb.created_at ? new Date(fb.created_at).toLocaleString() : "";
    const msg = escapeHtml(fb.message || fb.content || ""); // hỗ trợ cả 2 key cũ/new
    div.innerHTML = `
      <b>${name}</b> ${email ? `(${email})` : ""} <br>
      <small>${when}</small>
      <p>${msg}</p>
      <hr>
    `;
    listEl.appendChild(div);
  });
}

// Gửi feedback (theo phong cách admin: gửi rồi fetch lại toàn bộ bài để hiển thị online)
async function addFeedback() {
  try {
    if (!currentPostId) {
      alert("Không tìm thấy bài viết.");
      return;
    }

    const name = (document.getElementById("fb-name")?.value || "").trim();
    const email = (document.getElementById("fb-email")?.value || "").trim();
    const message = (document.getElementById("fb-content")?.value || "").trim();

    if (!name || !email || !message) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (!email.endsWith("@gmail.com")) {
      alert("Chỉ chấp nhận email Gmail");
      return;
    }

    const comment = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*1e6)}`,
      name,
      email,
      message,
      created_at: new Date().toISOString()
    };

    // Lấy feedback hiện tại
    const { data: post, error: e1 } = await supabase
      .from("posts")
      .select("feedback")
      .eq("id", Number(currentPostId))
      .single();

    if (e1) {
      console.error("Lỗi lấy feedback hiện tại:", e1);
      alert("Không thể gửi feedback (lỗi lấy bài).");
      return;
    }

    const current = Array.isArray(post.feedback) ? post.feedback : [];
    const updated = [...current, comment];

    // Update lại posts.feedback
    const { error: e2 } = await supabase
      .from("posts")
      .update({ feedback: updated })
      .eq("id", Number(currentPostId));

    if (e2) {
      console.error("Lỗi update feedback:", e2);
      alert("Lỗi khi gửi feedback (có thể do quyền RLS).");
      return;
    }

    // Xoá form & fetch lại bài (như admin)
    document.getElementById("fb-content").value = "";
    document.getElementById("fb-name").value = "";
    document.getElementById("fb-email").value = "";

    // Gọi lại renderPost để chắc chắn dữ liệu đồng bộ với DB (hiển thị online)
    await renderPost();
  } catch (err) {
    console.error("addFeedback unexpected error:", err);
    alert("Đã xảy ra lỗi khi gửi feedback.");
  }
}

window.addFeedback = addFeedback;
