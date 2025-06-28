const axios = require('axios');

async function testAPI() {
    try {
        const response = await axios.post(
            'https://api.siliconflow.cn/v1/chat/completions',
            {
                model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
                messages: [
                    {
                        role: "user",
                        content: "What opportunities and challenges will the Chinese large model industry face in 2025?"
                    }
                ]
            },
            {
                headers: {
                    'Authorization': 'Bearer sk-dmfcuviulbvsfvmucoakzwlmzgvwyiwrfaqfmwszqaxfclqn', // Replace with actual key
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('API响应:', response.data);
    } catch (error) {
        console.error('API测试失败:', error.response?.data || error.message);
    }
}

testAPI();