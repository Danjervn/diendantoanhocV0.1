// Hiển thị chi tiết bài và xử lý feedback qua Supabase

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function renderPost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const titleEl = document.getElementById("post-title");
  if (!id) {
    if (titleEl) titleEl.innerText = "Bài viết không tồn tại";
    return;
  }

  try {
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !post) {
      console.error("fetch post error:", error);
      if (titleEl) titleEl.innerText = "Bài viết không tồn tại";
      return;
    }

    if (titleEl) titleEl.innerText = post.title || "";
    const authorEl = document.getElementById("post-author");
    if (authorEl) authorEl.innerText = post.author || "";

    let categoryText = "";
    if (post.category === "algebra") categoryText = "Đại số";
    if (post.category === "geometry") categoryText = "Hình học";
    if (post.category === "calculus") categoryText = "Giải tích";
    const categoryEl = document.getElementById("post-category");
    if (categoryEl) categoryEl.innerText = categoryText;

    const contentEl = document.getElementById("post-content");
    if (contentEl) contentEl.innerText = post.content || "";

    // Hiển thị ảnh (post.images expected array of URLs)
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

    renderFeedback(post);
  } catch (err) {
    console.error("renderPost error:", err);
  }
}

function renderFeedback(post) {
  const list = document.getElementById("feedback-list");
  if (!list) return;
  list.innerHTML = "";

  if (!post || !post.feedback || post.feedback.length === 0) {
    list.innerText = "Chưa có feedback.";
    return;
  }

  post.feedback.forEach(fb => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `<b>${escapeHtml(fb.name || "Khách")}</b><br>${escapeHtml(fb.content || "")}`;
    list.appendChild(div);
  });
}

async function addFeedback() {
  const nameElem = document.getElementById("fb-name");
  const contentElem = document.getElementById("fb-content");
  const name = nameElem ? nameElem.value.trim() : "";
  const content = contentElem ? contentElem.value.trim() : "";
  if (!name || !content) {
    alert("Vui lòng nhập đầy đủ tên và nội dung feedback.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) { alert("Bài viết không tồn tại."); return; }

  try {
    // Lấy feedback hiện tại
    const { data: post, error: fetchErr } = await supabase
      .from("posts")
      .select("feedback")
      .eq("id", Number(id))
      .single();

    if (fetchErr) throw fetchErr;

    const feedback = Array.isArray(post.feedback) ? post.feedback : [];
    feedback.push({ name, content });

    const { error: updateErr } = await supabase
      .from("posts")
      .update({ feedback })
      .eq("id", Number(id));

    if (updateErr) throw updateErr;

    if (nameElem) nameElem.value = "";
    if (contentElem) contentElem.value = "";
    // reload post data
    await renderPost();
  } catch (err) {
    console.error("addFeedback error:", err);
    alert("Gửi feedback thất bại.");
  }
}
function renderFeedback(feedbackList) {
  const box = document.getElementById("feedback-list");
  box.innerHTML = "";

  feedbackList.forEach(fb => {
    const div = document.createElement("div");
    div.className = "feedback-item";
    div.innerHTML = `
      <b>${fb.name}</b> (${fb.email})<br>
      <small>${new Date(fb.created_at).toLocaleString()}</small>
      <p>${fb.message}</p>
      <hr>
    `;
    box.appendChild(div);
  });
}

window.addFeedback = addFeedback;

document.addEventListener("DOMContentLoaded", () => {
  renderPost();
});

