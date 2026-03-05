class MathChatbot {
  constructor() {
    this.conversationHistory = [];
    this.currentAttachment = null;
    this.recognition = null;
    this.isRecording = false;
    this.isProcessingAttachment = false;

    this.maxImageSizeBytes = 5 * 1024 * 1024; // 5MB
    this.maxDocxSizeBytes = 10 * 1024 * 1024; // 10MB
    this.maxTxtSizeBytes = 2 * 1024 * 1024; // 2MB

    this.setupVoiceRecognition();
    this.initializeListeners();
  }

  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "vi-VN";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const input = document.getElementById("chat-input");
      if (input) {
        input.value += (input.value ? " " : "") + transcript;
      }
    };

    this.recognition.onerror = () => {
      this.stopRecording();
      alert("Không thể nhận diện giọng nói. Vui lòng thử lại.");
    };

    this.recognition.onend = () => {
      this.stopRecording();
    };
  }

  toggleRecording() {
    if (!this.recognition) {
      alert("Trình duyệt của bạn không hỗ trợ Speech to Text.");
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.start();
      this.isRecording = true;
      document.getElementById("voice-btn")?.classList.add("recording");
    }
  }

  stopRecording() {
    this.isRecording = false;
    document.getElementById("voice-btn")?.classList.remove("recording");
  }

  async handleFileUpload(file) {
    if (!file) return;

    try {
      this.isProcessingAttachment = true;
      this.showAttachmentPreview(`Đang xử lý: ${file.name}...`, true);

      if (file.type.startsWith("image/")) {
        if (file.size > this.maxImageSizeBytes) {
          alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
          this.removeAttachment();
          return;
        }

        const dataUrl = await this.readFileAsDataURL(file);
        this.currentAttachment = {
          type: "image_url",
          image_url: { url: dataUrl },
          name: file.name
        };
        this.showAttachmentPreview(`🖼️ Ảnh: ${file.name}`);
        return;
      }

      if (file.name.toLowerCase().endsWith(".txt")) {
        if (file.size > this.maxTxtSizeBytes) {
          alert("File TXT quá lớn. Vui lòng chọn file dưới 2MB.");
          this.removeAttachment();
          return;
        }

        const text = await file.text();
        this.currentAttachment = {
          type: "text",
          text: `\n[Nội dung file TXT: ${file.name}]\n${text}`,
          name: file.name
        };
        this.showAttachmentPreview(`📄 Text: ${file.name}`);
        return;
      }

      if (file.name.toLowerCase().endsWith(".docx")) {
        if (file.size > this.maxDocxSizeBytes) {
          alert("File DOCX quá lớn. Vui lòng chọn file dưới 10MB.");
          this.removeAttachment();
          return;
        }

        if (!window.mammoth || typeof window.mammoth.extractRawText !== "function") {
          alert("Thiếu thư viện đọc file DOCX (mammoth). Vui lòng tải lại trang.");
          this.removeAttachment();
          return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        this.currentAttachment = {
          type: "text",
          text: `\n[Nội dung file DOCX: ${file.name}]\n${result.value}`,
          name: file.name
        };
        this.showAttachmentPreview(`📝 Word: ${file.name}`);
        return;
      }

      alert("Định dạng file không được hỗ trợ. Chỉ nhận ảnh, .txt, .docx.");
      this.removeAttachment();
    } catch (error) {
      console.error("File upload error:", error);
      this.removeAttachment();
      alert("Không thể đọc file. Vui lòng thử file khác.");
    } finally {
      this.isProcessingAttachment = false;
    }
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  showAttachmentPreview(text, processing = false) {
    const preview = document.getElementById("attachment-preview");
    if (!preview) return;

    preview.style.display = "flex";
    preview.innerHTML = processing
      ? `<span>${this.escapeHtml(text)}</span>`
      : `
      <span>${this.escapeHtml(text)}</span>
      <span class="remove-attachment" onclick="window.mathChatbot?.removeAttachment()">✕</span>
    `;
  }

  removeAttachment() {
    this.currentAttachment = null;

    const preview = document.getElementById("attachment-preview");
    if (preview) {
      preview.style.display = "none";
      preview.innerHTML = "";
    }

    const upload = document.getElementById("file-upload");
    if (upload) upload.value = "";
  }

  escapeHtml(text = "") {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  formatMessage(text = "") {
    return this.escapeHtml(text)
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.*?)__/g, "<u>$1</u>");
  }

  displayMessage(message, sender) {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message message-${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${this.formatMessage(message)}</div>`;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  showTyping() {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return null;

    const typingDiv = document.createElement("div");
    typingDiv.className = "message message-bot typing";
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
  }

  async sendMessage() {
    const input = document.getElementById("chat-input");
    if (!input || this.isProcessingAttachment) return;

    const userMessage = input.value.trim();
    if (!userMessage && !this.currentAttachment) return;

    const userDisplay = userMessage || "(Đã gửi file đính kèm)";
    const attachmentHint = this.currentAttachment ? "\n(Đã đính kèm file)" : "";
    this.displayMessage(userDisplay + attachmentHint, "user");
    input.value = "";

    let finalMessageFormat = userMessage;

    if (this.currentAttachment?.type === "text") {
      finalMessageFormat = `${userMessage}\n${this.currentAttachment.text}`.trim();
    }

    if (this.currentAttachment?.type === "image_url") {
      finalMessageFormat = [
        { type: "text", text: userMessage || "Hãy giải hoặc mô tả nội dung toán học trong ảnh này." },
        this.currentAttachment
      ];
    }

    this.removeAttachment();

    const typing = this.showTyping();
    const aiResponse = await this.askGroq(finalMessageFormat);
    if (typing) typing.remove();

    this.displayMessage(aiResponse, "bot");
  }

  async askGroq(userMessage) {
    try {
      const GROQ_API_KEY = window.GROQ_API_KEY;
      const GROQ_API_URL = window.GROQ_API_URL;
      const GROQ_MODEL = window.GROQ_MODEL;

      this.conversationHistory.push({
        role: "user",
        content: userMessage
      });

      const requestBody = {
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "Bạn là trợ lý toán học. Luôn trả lời tiếng Việt, rõ ràng, dễ hiểu, có bước giải khi cần."
          },
          ...this.conversationHistory
        ],
        max_tokens: 1024,
        temperature: 0.5
      };

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data?.error?.message || "Lỗi không xác định từ API";

        if (Array.isArray(userMessage) && response.status >= 400) {
          const fallbackText = userMessage.find((item) => item?.type === "text")?.text || "";
          return `Model hiện tại có thể chưa hỗ trợ ảnh. Bạn hãy đổi model Vision hoặc gửi mô tả bằng chữ.\n\nCâu hỏi của bạn: ${fallbackText}`;
        }

        return `Không gọi được AI: ${errorMessage}`;
      }

      const assistantMessage = data?.choices?.[0]?.message?.content || "AI không trả về nội dung.";
      this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      return assistantMessage;
    } catch (error) {
      console.error("askGroq error:", error);
      return `Đã có lỗi khi gửi yêu cầu AI: ${error.message}`;
    }
  }

  initializeListeners() {
    const sendBtn = document.getElementById("send-btn");
    const input = document.getElementById("chat-input");
    const attachBtn = document.getElementById("attach-btn");
    const fileUpload = document.getElementById("file-upload");
    const voiceBtn = document.getElementById("voice-btn");
    const closeBtn = document.getElementById("close-chat");

    if (sendBtn) sendBtn.addEventListener("click", () => this.sendMessage());
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });
    }

    if (attachBtn && fileUpload) {
      attachBtn.addEventListener("click", () => fileUpload.click());
      fileUpload.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleFileUpload(file);
      });
    }

    if (voiceBtn) {
      voiceBtn.addEventListener("click", () => this.toggleRecording());
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        const container = document.getElementById("chatbot-container");
        if (container) container.style.display = "none";
      });
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    chatBox.innerHTML = `
      <div class="message message-bot welcome">
        <div class="message-content">
          Xin chào! Tôi là trợ lý toán học. Bạn cần giúp gì hôm nay?
        </div>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.mathChatbot = new MathChatbot();
});
