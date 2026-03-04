class MathChatbot {
  constructor() {
    this.conversationHistory = [];
    this.initializeListeners();
  }

  // Kết nối Groq API
  async askGroq(userMessage) {
    try {
      // Lấy config từ window object
      const GROQ_API_KEY = window.GROQ_API_KEY;
      const GROQ_API_URL = window.GROQ_API_URL;
      const GROQ_MODEL = window.GROQ_MODEL;

      // Thêm tin nhắn người dùng vào lịch sử
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Gọi Groq API
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: `Bạn là một trợ lý toán học thông minh và vui vẻ. 
              Hãy giúp học sinh:
              1. Giải các bài toán
              2. Giải thích các khái niệm toán học
              3. Cung cấp lời khuyên học tập
              
              Luôn trả lời bằng tiếng Việt. Sử dụng công thức toán học khi cần thiết.
              Hãy rõ ràng, ngắn gọn và dễ hiểu.`
            },
            ...this.conversationHistory
          ],
          max_tokens: 1024,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${response.status} - ${error.error?.message}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Thêm phản hồi AI vào lịch sử
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      console.error('Groq API Error:', error);
      return '❌ Lỗi: Không thể kết nối AI. Vui lòng thử lại sau.';
    }
  }

  // Hiển thị tin nhắn
  displayMessage(message, sender) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${sender}`;
    messageDiv.innerHTML = `
      <div class="message-content">${this.formatMessage(message)}</div>
    `;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Định dạng tin nhắn (hỗ trợ Markdown cơ bản)
  formatMessage(text) {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<u>$1</u>');
  }

  // Sự kiện gửi tin nhắn
  async sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const userMessage = input.value.trim();
    if (!userMessage) return;

    // Hiển thị tin nhắn người dùng
    this.displayMessage(userMessage, 'user');
    input.value = '';

    // Hiển thị "đang gõ..."
    const chatBox = document.getElementById('chat-box');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message message-bot typing';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatBox.appendChild(typingDiv);

    // Lấy phản hồi từ Groq
    const aiResponse = await this.askGroq(userMessage);
    typingDiv.remove();
    this.displayMessage(aiResponse, 'bot');
  }

  // Khởi tạo sự kiện
  initializeListeners() {
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    // Nút đóng chatbox
    const closeBtn = document.getElementById('close-chat');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const chatbot = document.getElementById('chatbot-container');
        if (chatbot) chatbot.style.display = 'none';
      });
    }
  }

  // Xóa lịch sử trò chuyện
  clearHistory() {
    this.conversationHistory = [];
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
      chatBox.innerHTML = `
        <div class="message message-bot welcome">
          <div class="message-content">
            👋 <strong>Xin chào!</strong> Tôi là trợ lý toán học. 
            <br>Bạn có câu hỏi gì về toán học không?
          </div>
        </div>
      `;
    }
  }
}

// Khởi chạy chatbot khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window.mathChatbot = new MathChatbot();
});
