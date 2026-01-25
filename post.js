function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let currentPostId = null;

// Load khi mở trang
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  currentPostId = params.get("id");
  renderPost();
});

async function renderPost() {
  const titleEl = document.getElementById("post-title");

  if (!currentPostId) {
    titleEl.innerText = "Bài viết không tồn tại";
    return;
  }

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", Number(currentPostId))
    .single();

  if (error || !post) {
    console.error(error);
    titleEl.innerText = "Bài viết không tồn tại";
    return;
  }

  document.getElementById("post-title").innerText = post.title || "";
  document.getElementById("post-author").innerText = post.author || "";
  document.getElementById("post-category").innerText = post.category || "";
  document.getElementById("post-content").innerText = post.content || "";

  // ảnh
  const imageBox = document.getElementById("image-container");
  imageBox.innerHTML = "";
  if (Array.isArray(post.images)) {
    post.images.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      imageBox.appendChild(img);
    });
  }

  renderFeedback(post.feedback || []);
}

// Vẽ feedback
function renderFeedback(list) {
  const box = document.getElementById("feedback-list");
  box.innerHTML = "";

  if (list.length === 0) {
    box.innerHTML = "<i>Chưa có feedback</i>";
    return;
  }

  list.forEach(fb => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <b>${escapeHtml(fb.name)}</b> (${escapeHtml(fb.email)})<br>
      <small>${new Date(fb.created_at).toLocaleString()}</small>
      <p>${escapeHtml(fb.message)}</p>
      <hr>
    `;
    box.appendChild(div);
  });
}

// Gửi feedback
async function addFeedback() {
  const name = document.getElementById("fb-name").value.trim();
  const email = document.getElementById("fb-email").value.trim();
  const message = document.getElementById("fb-content").value.trim();

  if (!name || !email || !message) {
    alert("Nhập đầy đủ thông tin");
    return;
  }

  if (!email.endsWith("@gmail.com")) {
    alert("Chỉ chấp nhận Gmail");
    return;
  }

  const comment = {
    id: crypto.randomUUID(),
    name,
    email,
    message,
    created_at: new Date().toISOString()
  };

  // Lấy feedback hiện tại
  const { data: post } = await supabase
    .from("posts")
    .select("feedback")
    .eq("id", Number(currentPostId))
    .single();

  const current = Array.isArray(post.feedback) ? post.feedback : [];
  const updated = [...current, comment];

  // Update lại DB
  const { error } = await supabase
    .from("posts")
    .update({ feedback: updated })
    .eq("id", Number(currentPostId));

  if (error) {
    console.error(error);
    alert("Lỗi khi gửi feedback (RLS?)");
    return;
  }

  document.getElementById("fb-content").value = "";
  renderFeedback(updated);
}

window.addFeedback = addFeedback;
