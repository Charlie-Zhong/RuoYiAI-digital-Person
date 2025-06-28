// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // 1. 新增：必须导入 axios 才能使用
require('dotenv').config();

const app = express();
const port = 3001;

// 中间件配置
app.use(cors());
app.use(express.json());

// 定义 API 路由
app.post('/api/paraphrase', async (req, res) => {
    try {
        const { sentence } = req.body;
        if (!sentence) {
            return res.status(400).json({ error: 'Sentence is required' });
        }

        // 2. 使用环境变量中的 SiliconFlow API Key
        const apiKey = process.env.SILICONFLOW_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server is missing SILICONFLOW_API_KEY' });
        }

        const response = await axios.post(
            'https://api.siliconflow.cn/v1/chat/completions',
            {
                model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
                messages: [
                    {
                        role: "user",
                        content: `请将下面的句子用20种不同的表达方式进行改写，每一种方式占一行，不要带序号：\n\n"${sentence}"`
                    }
                ],
                stream: false,
                max_tokens: 1024,
                temperature: 0.8,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const paraphrasedContent = response.data.choices[0].message.content;
        res.json({ paraphrases: paraphrasedContent });

    } catch (error) {
        // 3. 改进：添加了详细的错误处理
        console.error('Error calling SiliconFlow API:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to call SiliconFlow API',
            details: error.response?.data
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});