// LẤY DANH SÁCH BÀI VIẾT
let posts = JSON.parse(localStorage.getItem("posts"));
if (posts === null) posts = [];

// LẤY ID
let params = new URLSearchParams(window.location.search);
let id = params.get("id");

// RENDER POST
function renderPost() {
    if (id === null || posts[id] === undefined) {
        document.getElementById("post-title").innerText = "Bài viết không tồn tại";
        return;
    }

    let post = posts[id];
    document.getElementById("post-title").innerText = post.title || "";
    document.getElementById("post-author").innerText = post.author || "";

    let categoryText = "";
    if (post.category === "algebra") categoryText = "Đại số";
    if (post.category === "geometry") categoryText = "Hình học";
    if (post.category === "calculus") categoryText = "Giải tích";
    document.getElementById("post-category").innerText = categoryText;

    document.getElementById("post-content").innerText = post.content || "";

    // HIỂN THỊ ẢNH: hỗ trợ cả mảng hoặc string
    let imageBox = document.getElementById("image-container");
    imageBox.innerHTML = "";

    if (post.image) {
        // nếu post.image là chuỗi (bản cũ) -> chuyển thành mảng 1 phần tử
        let imagesArray = Array.isArray(post.image) ? post.image : [post.image];

        // nếu nhiều ảnh, thêm class để CSS tự chia kích thước
        if (imagesArray.length > 1) {
            imageBox.classList.add("multiple-images");
        } else {
            imageBox.classList.remove("multiple-images");
        }

        for (let i = 0; i < imagesArray.length; i++) {
            let img = document.createElement("img");
            img.src = imagesArray[i];
            img.alt = post.title || ("Hình " + (i+1));
            img.loading = "lazy";
            imageBox.appendChild(img);
        }
    }

    if (!post.feedback) post.feedback = [];
    renderFeedback();
}

// FEEDBACK như trước
function renderFeedback() {
    let list = document.getElementById("feedback-list");
    list.innerHTML = "";

    let post = posts[id];
    if (!post || !post.feedback || post.feedback.length === 0) {
        list.innerText = "Chưa có feedback.";
        return;
    }

    for (let i = 0; i < post.feedback.length; i++) {
        let fb = post.feedback[i];
        let div = document.createElement("div");
        div.className = "post";
        div.innerHTML = "<b>" + (fb.name || "Khách") + "</b><br>" + (fb.content || "");
        list.appendChild(div);
    }
}

function addFeedback() {
    let nameElem = document.getElementById("fb-name");
    let contentElem = document.getElementById("fb-content");
    let name = nameElem.value.trim();
    let content = contentElem.value.trim();
    if (name === "" || content === "") {
        alert("Vui lòng nhập đầy đủ tên và nội dung feedback.");
        return;
    }
    if (id === null || posts[id] === undefined) {
        alert("Bài viết không tồn tại.");
        return;
    }
    let post = posts[id];
    if (!post.feedback) post.feedback = [];
    post.feedback.push({ name: name, content: content });
    posts[id] = post;
    localStorage.setItem("posts", JSON.stringify(posts));
    nameElem.value = "";
    contentElem.value = "";
    renderFeedback();
}

renderPost();
window.addFeedback = addFeedback;
