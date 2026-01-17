// LẤY DỮ LIỆU
let posts = JSON.parse(localStorage.getItem("posts"));
if (posts === null) posts = [];

// HIỂN THỊ DANH SÁCH BÀI
function showAdminPosts() {
    let list = document.getElementById("admin-post-list");
    list.innerHTML = "";

    for (let i = 0; i < posts.length; i++) {
        let thumbHtml = "";
        if (posts[i].image) {
            // hiển thị ảnh nhỏ
            thumbHtml = `<div style="margin-top:6px;"><img src="${posts[i].image}" alt="thumb" style="height:60px;"></div>`;
        }
        list.innerHTML += `
            <div class="post">
                <b>${posts[i].title}</b><br>
                <small>${posts[i].author} • ${posts[i].category}</small>
                ${thumbHtml}
                <div style="margin-top:6px;">
                    <button onclick="deletePost(${i})">Xóa</button>
                </div>
            </div>
        `;
    }
    if (posts.length === 0) list.innerHTML = "Chưa có bài viết.";
}

// ĐĂNG BÀI (với ảnh)
// ... (lấy posts từ localStorage như trước)

function addPost() {
    let title = document.getElementById("title").value.trim();
    let author = document.getElementById("author").value.trim();
    let content = document.getElementById("content").value.trim();
    let category = document.getElementById("category").value;
    let fileInput = document.getElementById("image");
    let files = fileInput.files; // FileList (có thể nhiều file)

    if (title === "" || author === "" || content === "") {
        alert("Vui lòng nhập đầy đủ thông tin (tiêu đề, tác giả, nội dung).");
        return;
    }

    // Hàm lưu bài (nhận imagesArray là mảng dataURL hoặc null)
    function savePost(imagesArray) {
        let post = {
            title: title,
            author: author,
            content: content,
            category: category,
            image: imagesArray && imagesArray.length ? imagesArray : null,
            feedback: []
        };
        posts.push(post);
        localStorage.setItem("posts", JSON.stringify(posts));
        alert("Đăng bài thành công.");
        document.getElementById("post-form").reset();
        showAdminPosts();
    }

    // Nếu không có file -> lưu luôn
    if (!files || files.length === 0) {
        savePost(null);
        return;
    }

    // Nếu có file -> đọc từng file bằng FileReader, gom vào mảng
    const maxSize = 1 * 1024 * 1024; // 1MB
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif"];

    // validate tất cả file trước
    for (let i = 0; i < files.length; i++) {
        if (!allowed.includes(files[i].type)) {
            alert("Chỉ chấp nhận file ảnh (png / jpg / gif).");
            return;
        }
        if (files[i].size > maxSize) {
            alert("Một trong các ảnh quá lớn. Vui lòng chọn ảnh ≤ 1MB mỗi ảnh.");
            return;
        }
    }

    // đọc tất cả file
    let images = [];
    let count = 0;

    for (let i = 0; i < files.length; i++) {
        let reader = new FileReader();
        // dùng closure để giữ thứ tự nếu cần
        reader.onload = (function(index) {
            return function(e) {
                images[index] = e.target.result;
                count++;
                if (count === files.length) {
                    // tất cả đã đọc xong
                    // loại bỏ bất kỳ vị trí undefined (nếu có)
                    images = images.filter(x => x);
                    savePost(images);
                }
            };
        })(i);

        reader.onerror = function() {
            alert("Không thể đọc file ảnh. Thử lại.");
            return;
        };

        reader.readAsDataURL(files[i]);
    }
}


// XÓA BÀI
function deletePost(index) {
    if (confirm("Bạn có chắc muốn xóa bài này?")) {
        posts.splice(index, 1);
        localStorage.setItem("posts", JSON.stringify(posts));
        showAdminPosts();
    }
}

// GỌI HÀM khi mở trang
showAdminPosts();
