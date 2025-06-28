// server.js
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001; // 或者你选择的其他端口

// 初始化 OpenAI 客户端
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 中间件配置
app.use(cors()); // 允许来自前端的跨域请求
app.use(express.json()); // 解析 JSON 请求体

// 定义 API 路由
app.post('/api/paraphrase', async (req, res) => {
    try {
        const { sentence } = req.body;

        if (!sentence) {
            return res.status(400).json({ error: 'Sentence is required' });
        }

        // --- 这是关键的 Prompt 工程 ---
        // 指示大模型执行特定任务
        const prompt = `请将以下句子用20种以上不同但含义相近的表达方式重写。
请确保每种表达方式都是一个完整的句子，并以换行分隔。
不要添加任何额外的解释或标题。

原始句子: "${sentence}"

重写结果:`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // 或者使用 "gpt-4" 等更强大的模型
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7, // 调整创造性，0.7 是一个不错的平衡点
            n: 1, // 我们只需要一个回答
        });

        const resultText = completion.choices[0].message.content;
        res.json({ paraphrases: resultText });

    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: 'Failed to communicate with OpenAI API' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});