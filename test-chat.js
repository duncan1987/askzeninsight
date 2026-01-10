// Test script for chat API
// Using native fetch (Node.js 18+)

async function testChat() {
  const url = 'http://localhost:3000/api/chat';

  const testMessage = {
    messages: [
      {
        role: 'user',
        parts: [
          {
            type: 'text',
            text: '你好，我最近感到很焦虑，希望能得到一些指导。'
          }
        ]
      }
    ]
  };

  try {
    console.log('发送测试消息到聊天API...');
    console.log('消息内容:', testMessage.messages[0].parts[0].text);
    console.log('\n--- 开始流式响应 ---\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 请求失败:', response.status, response.statusText);
      console.error('错误详情:', errorText);
      return;
    }

    console.log('✅ 连接成功，开始接收响应...\n');

    // 读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      process.stdout.write(chunk);
    }

    console.log('\n\n--- 响应完成 ---');
    console.log('✅ 测试成功！');
    console.log('总响应长度:', fullResponse.length, '字符');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testChat();
