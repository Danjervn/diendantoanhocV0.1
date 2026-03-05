class MathChatbot {
  constructor() {
    this.conversationHistory = [];
    this.currentAttachment = null; // Lưu trữ file/text đính kèm tạm thời
    this.recognition = null;
    this.isRecording = false;
    
    this.setupVoiceRecognition();
    this.initializeListeners();
    console.log('🚀 MathChatbot initialized with Voice & File support');
  }

  // --- TÍNH NĂNG 1: GHI ÂM (VOICE-TO-TEXT) ---
  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'vi-VN'; // Nhận diện tiếng Việt
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('chat-input');
        input.value += (input.value ? ' ' : '') + transcript;
        console.log('🎤 Nhận diện giọng nói:', transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('❌ Lỗi ghi âm:', event.error);
        this.stopRecording();
      };

      this.recognition.onend = () => {
        this.stopRecording();
      };
    } else {
      console.warn('⚠️ Trình duyệt không hỗ trợ Web Speech API');
    }
  }

  toggleRecording() {
    if (!this.recognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }
    
    const voiceBtn = document.getElementById('voice-btn');
    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.start();
      this.isRecording = true;
      voiceBtn.classList.add('recording');
      console.log('🎙️ Bắt đầu ghi âm...');
    }
  }

  stopRecording() {
    this.isRecording = false;
    document.getElementById('voice-btn')?.classList.remove('recording');
  }

  // --- TÍNH NĂNG 2 & 3: XỬ LÝ FILE (ẢNH, TXT, DOCX) ---
  async handleFileUpload(file) {
    const previewArea = document.getElementById('attachment-preview');
    
    try {
      if (file.type.startsWith('image/')) {
        // Đọc ảnh thành chuỗi Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          this.currentAttachment = {
            type: 'image_url',
            image_url: { url: e.target.result }
          };
          this.showAttachmentPreview(`🖼️ Ảnh: ${file.name}`);
        };
        reader.readAsDataURL(file);
      } 
      else if (file.name.endsWith('.txt')) {
        // Đọc file .txt
        const text = await file.text();
        this.currentAttachment = { type: 'text', text: `\n[Nội dung file đính kèm]:\n${text}` };
        this.showAttachmentPreview(`📄 Text: ${file.name}`);
      }
      else if (file.name.endsWith('.docx')) {
        // Đọc file Word bằng mammoth.js
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        this.currentAttachment = { type: 'text', text: `\n[Nội dung file Word]:\n${result.value}` };
        this.showAttachmentPreview(`📝 Word: ${file.name}`);
      } 
      else {
        alert('Định dạng file không được hỗ trợ. Vui lòng tải ảnh, .txt hoặc .docx');
      }
    } catch (error) {
      console.error('❌ Lỗi đọc file:', error);
      alert('Không thể đọc file. Vui lòng thử lại.');
    }
  }

  showAttachmentPreview(text) {
    const preview = document.getElementById('attachment-preview');
    preview.style.display = 'flex';
    preview.innerHTML = `
      <span>${text}</span>
      <span class="remove-attachment" onclick="window.mathChatbot.removeAttachment()">✕</span>
    `;
  }

  removeAttachment() {
    this.currentAttachment = null;
    document.getElementById('attachment-preview').style.display = 'none';
    document.getElementById('file-upload').value = ''; // Reset input file
  }

  // --- CẬP NHẬT HÀM GỬI TIN NHẮN ---
  async sendMessage() {
    const input = document.getElementById('chat-input');
    let userMessage = input.value.trim();

    if (!userMessage && !this.currentAttachment) {
      return; // Không gửi nếu trống cả chữ và file
    }

    // Hiển thị tin nhắn UI
    let displayMsg = userMessage;
    if (this.currentAttachment) {
      displayMsg += (userMessage ? '<br>' : '') + `<em>(Đã đính kèm file)</em>`;
    }
    this.displayMessage(displayMsg, 'user');
    input.value = '';

    // Tạo payload gửi cho API
    let messageContent = userMessage;
    
    // Nếu có file text đính kèm, ghép vào câu hỏi
    if (this.currentAttachment && this.currentAttachment.type === 'text') {
      messageContent += this.currentAttachment.text;
    }

    // Xử lý gửi ảnh (Lưu ý: Model API phải hỗ trợ Vision)
    let finalMessageFormat;
    if (this.currentAttachment && this.currentAttachment.type === 'image_url') {
      finalMessageFormat = [
        { type: "text", text: userMessage || "Hãy giải bài toán trong ảnh này." },
        this.current  // Truyền URL base64 của ảnh
      ];
    } else {
      finalMessageFormat = messageContent;
    }

    this.removeAttachment(); // Xóa đính kèm sau khi gửi

    // Hiển thị "đang gõ..."
    const chatBox = document.getElementById('chat-box');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message message-bot typing';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatBox.appendChild(typingDiv);

    // Gọi API
    const aiResponse = await this.askGroq(finalMessageFormat); // Truyền format mới vào askGroq
    
    typingDiv.remove();
    this.displayMessage(aiResponse, 'bot');
  }

  // Cập nhật hàm initializeListeners để nhận diện các nút mới
  initializeListeners() {
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');
    const attachBtn = document.getElementById('attach-btn');
    const fileUpload = document.getElementById('file-upload');
    const voiceBtn = document.getElementById('voice-btn');

    if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
    
    // Nút đính kèm kích hoạt input file ẩn
    if (attachBtn && fileUpload) {
      attachBtn.addEventListener('click', () => fileUpload.click());
      fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) this.handleFileUpload(e.target.files[0]);
      });
    }

    // Nút ghi âm
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.toggleRecording());
    }

    const closeBtn = document.getElementById('close-chat');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      document.getElementById('chatbot-container').style.display = 'none';
    });
  }

  // Kết nối Groq API - với DEBUG chi tiết
  async askGroq(userMessage) {
    try {
      const GROQ_API_KEY = window.GROQ_API_KEY;
      const GROQ_API_URL = window.GROQ_API_URL;
      const GROQ_MODEL = window.GROQ_MODEL;

      console.log('📤 Sending request to Groq API...');
      console.log('API URL:', GROQ_API_URL);
      console.log('Model:', GROQ_MODEL);
      console.log('User Message:', userMessage);

      // Thêm tin nhắn người dùng vào lịch sử
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      const requestBody = {
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
      };

      console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('✅ Response Status:', response.status);
      console.log('📝 Response Headers:', {
        'Content-Type': response.headers.get('content-type'),
        'Content-Length': response.headers.get('content-length')
      });

      // Lấy text từ response trước
      const responseText = await response.text();
      console.log('📥 Raw Response Text:', responseText);

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed JSON:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('Response Text:', responseText);
        return `❌ Lỗi parse response từ API: ${parseError.message}`;
      }

      // Kiểm tra response status
      if (!response.ok) {
        console.error('❌ API Error Response:', data);
        const errorMessage = data.error?.message || data.message || 'Unknown error';
        return `❌ Lỗi API: ${response.status} - ${errorMessage}`;
      }

      // Kiểm tra structure của response
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Unexpected Response Structure:', data);
        return `❌ Lỗi: Response structure không đúng. ${JSON.stringify(data)}`;
      }

      const assistantMessage = data.choices[0].message.content;
      console.log('🤖 AI Response:', assistantMessage);

      // Thêm phản hồi AI vào lịch sử
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      console.log('✅ Conversation History Updated:', this.conversationHistory);
      return assistantMessage;

    } catch (error) {
      console.error('❌ Full Error Object:', error);
      console.error('Error Stack:', error.stack);
      console.error('Error Message:', error.message);
      return `❌ Lỗi: ${error.message}\n\nVui lòng mở Console (F12) để xem chi tiết lỗi.`;
    }
  }

  // Hiển thị tin nhắn
  displayMessage(message, sender) {
    console.log(`📢 Displaying message from ${sender}:`, message.substring(0, 50) + '...');
    
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) {
      console.error('❌ Error: chat-box element not found!');
      return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${sender}`;
    messageDiv.innerHTML = `
      <div class="message-content">${this.formatMessage(message)}</div>
    `;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    console.log('✅ Message displayed');
  }

  formatMessage(text) {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<u>$1</u>');
  }

  async sendMessage() {
    console.log('📨 Send message triggered');
    
    const input = document.getElementById('chat-input');
    if (!input) {
      console.error('❌ Error: chat-input element not found!');
      return;
    }

    const userMessage = input.value.trim();
    if (!userMessage) {
      console.warn('⚠️ Empty message');
      return;
    }

    console.log('👤 User message:', userMessage);

    // Hiển thị tin nhắn người dùng
    this.displayMessage(userMessage, 'user');
    input.value = '';

    // Hiển thị "đang gõ..."
    const chatBox = document.getElementById('chat-box');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message message-bot typing';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatBox.appendChild(typingDiv);
    console.log('⏳ Typing indicator shown');

    // Lấy phản hồi từ Groq
    console.log('🔄 Calling askGroq...');
    const aiResponse = await this.askGroq(userMessage);
    console.log('🎯 Got AI response:', aiResponse.substring(0, 50) + '...');
    
    typingDiv.remove();
    this.displayMessage(aiResponse, 'bot');
  }

  initializeListeners() {
    console.log('🔗 Initializing listeners...');
    
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        console.log('🔘 Send button clicked');
        this.sendMessage();
      });
      console.log('✅ Send button listener added');
    } else {
      console.warn('⚠️ Send button not found');
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('⌨️ Enter key pressed');
          this.sendMessage();
        }
      });
      console.log('✅ Input listener added');
    } else {
      console.warn('⚠️ Input element not found');
    }

    const closeBtn = document.getElementById('close-chat');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('❌ Close button clicked');
        const chatbot = document.getElementById('chatbot-container');
        if (chatbot) chatbot.style.display = 'none';
      });
      console.log('✅ Close button listener added');
    }
  }

  clearHistory() {
    console.log('🗑️ Clearing conversation history');
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
      console.log('✅ History cleared and UI reset');
    }
  }
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 DOM Content Loaded');
  window.mathChatbot = new MathChatbot();
  console.log('✨ MathChatbot created and attached to window');
});
