// 1. Cài đặt axios để gọi API
// npm install axios

const API_KEY = 'your-openai-api-key';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

async function askAI(userMessage) {
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Bạn là một trợ lý toán học thông minh. Giúp học sinh giải các bài toán.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error);
    return 'Lỗi kết nối AI. Vui lòng thử lại.';
  }
}

// Lắng nghe tin nhắn người dùng
document.getElementById('send-btn').addEventListener('click', async () => {
  const input = document.getElementById('chat-input');
  const userMessage = input.value;
  
  if (!userMessage) return;
  
  // Hiển thị tin nhắn người dùng
  displayMessage(userMessage, 'user');
  input.value = '';
  
  // Lấy phản hồi từ AI
  const aiResponse = await askAI(userMessage);
  displayMessage(aiResponse, 'bot');
});

function displayMessage(message, sender) {
  const chatBox = document.getElementById('chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
