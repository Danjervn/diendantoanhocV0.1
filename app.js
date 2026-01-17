// ====== LẤY DỮ LIỆU TỪ LOCAL STORAGE ======
let posts = JSON.parse(localStorage.getItem("posts"));
if (posts === null) {
    posts = [];
}

// ====== HIỂN THỊ DANH SÁCH BÀI VIẾT ======
function showPosts() {
    let list = document.getElementById("post-list");
    if (!list) return;

    list.innerHTML = "";

    for (let i = 0; i < posts.length; i++) {
        list.innerHTML += `
            <div class="post">
                <div class="post-title">
                    <a href="post.html?id=${i}">
                        ${posts[i].title}
                    </a>
                </div>
                <div class="post-info">
                    Người đăng: ${posts[i].author}
                </div>
            </div>
        `;
    }
}

// ====== THÊM BÀI VIẾT ======
function addPost() {
    let title = document.getElementById("title").value;
    let content = document.getElementById("content").value;
    let author = document.getElementById("author").value;

    if (title === "" || content === "" || author === "") {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    let post = {
        title: title,
        content: content,
        author: author
    };

    posts.push(post);
    localStorage.setItem("posts", JSON.stringify(posts));

    alert("Đăng bài thành công");
    window.location.href = "index.html";
}
function filterPosts(category) {
    let list = document.getElementById("post-list");
    list.innerHTML = "";

    for (let i = 0; i < posts.length; i++) {
        if (posts[i].category === category) {
            list.innerHTML += `
                <div class="post">
                    <div class="post-title">
                        <a href="post.html?id=${i}">
                            ${posts[i].title}
                        </a>
                    </div>
                    <div class="post-info">
                        ${posts[i].author}
                    </div>
                </div>
            `;
        }
    }
}

// ====== HIỂN THỊ CHI TIẾT BÀI VIẾT ======
function showPostDetail() {
    let params = new URLSearchParams(window.location.search);
    let id = params.get("id");

    if (id === null) return;

    let post = posts[id];
    if (!post) return;

    document.getElementById("post-title").innerText = post.title;
    document.getElementById("post-author").innerText = post.author;
    document.getElementById("post-content").innerText = post.content;
}

// ====== GỌI HÀM ======
showPosts();
showPostDetail();
