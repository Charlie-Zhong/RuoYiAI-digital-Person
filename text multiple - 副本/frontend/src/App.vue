<script setup>
import { ref } from 'vue';
import axios from 'axios';
import * as mammoth from 'mammoth';

const originalSentence = ref('');
const paraphrasedText = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const fileInput = ref(null);

// 1. 修正：此函数现在只负责读取文件并提取句子
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isLoading.value = true;
  errorMessage.value = '';
  originalSentence.value = '';
  paraphrasedText.value = ''; // 清空旧结果

  try {
    let text = '';
    if (file.name.endsWith('.txt')) {
      text = await file.text();
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      throw new Error('不支持的文件格式，请上传 .txt, .doc, 或 .docx 文件。');
    }
    // 提取第一句话
    const firstSentenceMatch = text.match(/[^.!?。？！\n]+/);
    originalSentence.value = firstSentenceMatch ? firstSentenceMatch[0].trim() : '';
    if (!originalSentence.value) {
      throw new Error('未能在文件中找到有效的句子。');
    }
  } catch (e) {
    errorMessage.value = e.message;
    console.error('File reading error:', e);
  } finally {
    isLoading.value = false;
  }
};

// 2. 新增：这是点击按钮时调用的函数，负责与后端通信
const generateParaphrases = async () => {
  if (!originalSentence.value) {
    errorMessage.value = '请先上传并成功提取句子。';
    return;
  }
  isLoading.value = true;
  errorMessage.value = '';
  paraphrasedText.value = '';

  try {
    // 调用我们自己的后端服务
    const response = await axios.post('http://localhost:3001/api/paraphrase', {
      sentence: originalSentence.value
    });
    paraphrasedText.value = response.data.paraphrases;
  } catch (error) {
    // --- 这里是修改的部分 ---
    // 使用老式JS语法检查属性是否存在，以保证兼容性
    const errorDetails = (error.response && error.response.data && error.response.data.error) || error.message;
    errorMessage.value = '调用后端API失败: ' + errorDetails;
    console.error('API call failed:', error);
    // --- 修改结束 ---
  } finally {
    isLoading.value = false;
  }
};

// 3. 下载功能保持不变
const downloadTxtFile = () => {
  if (!paraphrasedText.value) return;
  const blob = new Blob([paraphrasedText.value], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'paraphrased_sentences.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// 4. 移除：删除了原来在顶层执行的错误代码
</script>
<template>
  <div class="container">
    <header>
      <h1>句子改写 ✍️</h1>
      <p>上传一个包含句子的 .txt 或 .doc 文件，AI 将提供不同的表达方式。</p>
    </header>

    <main>
      <div class="card">
        <h2>1. 上传文件</h2>
        <input type="file" @change="handleFileUpload" accept=".txt,.doc,.docx" ref="fileInput" />
        <div v-if="originalSentence" class="original-sentence">
          <p><strong>已提取的原始句子:</strong></p>
          <blockquote>{{ originalSentence }}</blockquote>
        </div>
      </div>

      <div class="card">
        <h2>2. 生成改写</h2>
        <button @click="generateParaphrases" :disabled="isLoading || !originalSentence">
          <span v-if="isLoading">正在生成中...</span>
          <span v-else>开始生成</span>
        </button>
      </div>

      <div v-if="paraphrasedText || isLoading || errorMessage" class="card result-card">
        <h2>3. 查看并下载结果</h2>
        <div v-if="isLoading" class="loading-spinner"></div>
        <div v-if="errorMessage" class="error-message">
          <p><strong>错误:</strong> {{ errorMessage }}</p>
        </div>
        <div v-if="paraphrasedText" class="result-area">
          <textarea readonly :value="paraphrasedText"></textarea>
          <button @click="downloadTxtFile" class="download-btn">下载为 .txt 文件</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
:root {
  --primary-color: #42b883;
  --secondary-color: #35495e;
  --bg-color: #f0f2f5;
  --card-bg: #ffffff;
  --text-color: #333;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  padding: 2rem;
}
.container {
  max-width: 800px;
  margin: auto;
}
header {
  text-align: center;
  margin-bottom: 2rem;
}
h1 {
  color: var(--secondary-color);
}
.card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  margin-bottom: 1.5rem;
}
button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
button:not(:disabled):hover {
  background-color: #36a071;
}
.download-btn {
  background-color: var(--secondary-color);
  margin-top: 1rem;
}
.download-btn:hover {
  background-color: #2c3e50;
}
input[type="file"] {
  display: block;
  margin-bottom: 1rem;
}
.original-sentence blockquote {
  background-color: #f9f9f9;
  border-left: 5px solid var(--primary-color);
  padding: 10px;
  margin: 10px 0 0 0;
}
.result-area textarea {
  width: 100%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  font-family: monospace;
  resize: vertical;
}
.error-message {
  color: #d9534f;
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  padding: 15px;
  border-radius: var(--border-radius);
}
.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>