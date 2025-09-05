# AI Systematic Review Agent 🤖 - Multi-Model Support

A comprehensive AI-powered systematic review tool supporting multiple AI models including free options like DeepSeek, Claude, Gemini, and local models.

## 🌟 Features

- 🔍 **Multi-Model AI Support** - Choose from 10+ AI models
- 💵 **Free Options** - DeepSeek Chat/Coder (FREE open-source)
- 🔥 **Premium Models** - GPT-4, Claude 3, Gemini Pro
- 🏠 **Local Models** - Ollama integration (Llama 2, CodeLlama)
- 📥 **Complete Export Suite** - Download all results as CSV/JSON/Word
- 🗄️ **Database Integration** - SQLite with full tracking
- 🌐 **Modern UI** - Responsive React interface

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
npm install
```

### 2. Run the Application
```bash
# Backend (Terminal 1)
python main.py

# Frontend (Terminal 2)
npm run dev
```

### 3. Access Application
- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🤖 AI Model Setup

### 📋 Model Selection Guide

| Model | Provider | Cost | Best For | Setup |
|-------|----------|------|----------|-------|
| **GPT-4 Turbo** | OpenAI | 💰 Paid | High performance | API Key Required |
| **GPT-4** | OpenAI | 💰 Paid | Premium quality | API Key Required |
| **Claude 3 Opus** | Anthropic | 💰 Paid | Complex analysis | API Key Required |
| **DeepSeek Chat** | DeepSeek | 🆓 FREE | General tasks | API Key Optional |
| **DeepSeek Coder** | DeepSeek | 🆓 FREE | Code analysis | API Key Optional |
| **Llama 2 7B** | Meta | 🆓 FREE | Local inference | Ollama Required |

### 🔑 API Key Setup

#### Option 1: Environment Variables (.env file)
```bash
# Create .env file
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key  # Optional for free usage
```

#### Option 2: Direct Input
Enter API keys directly in the frontend interface when prompted.

### 🆓 Free AI Options

#### DeepSeek (Recommended for FREE usage)
```bash
# DeepSeek is FREE and doesn't require API key for basic usage
# Select "DeepSeek Chat" or "DeepSeek Coder" from model dropdown
```

#### Ollama (Local Models)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama2
ollama pull codellama

# Select "Llama 2 7B" or "CodeLlama" in the app
```

---

## 📊 Supported AI Models

### 🔥 Premium Models (API Key Required)

#### OpenAI
- **GPT-4 Turbo (Recommended)**: Fast, high-performance
- **GPT-4**: Premium model with excellent reasoning
- **GPT-3.5 Turbo**: Cost-effective for simple tasks

#### Anthropic Claude
- **Claude 3 Opus**: Best for complex systematic reviews
- **Claude 3 Sonnet**: Balanced performance & speed
- **Claude 3 Haiku**: Fast responses for routine tasks

#### Google Gemini
- **Gemini Pro**: Multi-modal understanding
- **Gemini Pro Vision**: Image + text analysis

### 🆓 Free & Open Models

#### DeepSeek
- **DeepSeek Chat**: FREE general-purpose model
- **DeepSeek Coder**: FREE for code and analysis

#### Local Models (Ollama)
- **Llama 2 7B**: Meta's Llama 2 (local, privacy-focused)
- **CodeLlama**: Specialized for programming tasks

---

## 🎯 Model Recommendations

### For Systematic Reviews:
- **Protocol Generation**: Claude 3 Opus or GPT-4
- **Study Screening**: GPT-4 Turbo or DeepSeek Chat
- **Data Extraction**: Claude 3 Sonnet
- **Quality Assessment**: GPT-4 or Gemini Pro
- **Meta-Analysis**: Claude 3 Opus
- **Article Generation**: GPT-4 or Claude 3 Sonnet

### For Budget-Conscious Users:
- **DeepSeek Chat (FREE)**: Excellent for most tasks
- **GPT-3.5 Turbo**: Low cost, good performance
- **Local Ollama**: No cost, maximum privacy

### For Maximum Privacy:
- **Ollama Models**: Completely local, no data sent to cloud
- **DeepSeek**: EU-based, privacy-focused

---

## 📋 Systematic Review Workflow

1. **🎯 Research Question**: Define your PICO framework
2. **🤖 AI Model Selection**: Choose your preferred AI model
3. **📋 Protocol Generation**: AI creates comprehensive protocol
4. **🔍 Literature Search**: Integrated PubMed search
5. **⚖️ Study Screening**: AI-assisted inclusion/exclusion
6. **📊 Data Extraction**: Automated data pulling
7. **⭐ Quality Assessment**: NOS/ROB2/AXIS evaluation
8. **📈 Meta-Analysis**: Statistical pooling and analysis
9. **📝 Article Generation**: Complete manuscript creation
10. **📥 Download Results**: Export all outputs

---

## 🛠️ Advanced Configuration

### Environment Setup
```bash
# Copy example environment file
cp .env.example .env

# Edit with your API keys
nano .env
```

### Model Switching
- Switch models anytime in the interface
- Each step can use different models
- No restart required

### Local Model Setup
```bash
# Start Ollama service
ollama serve

# Models auto-detected by the application
# No API keys required for local models
```

---

## 📥 Export Options

Every step supports multiple download formats:

- **CSV**: Excel-compatible for data analysis
- **JSON**: Structured data for other tools
- **Markdown**: GitHub-ready documentation
- **Word**: Professional document format
- **PDF**: Publication-ready format

---

## 🔄 Troubleshooting

### Common Issues:

#### API Key Errors
```bash
# Check environment variables
echo $OPENAI_API_KEY

# Verify in .env file
cat .env
```

#### Free Model Issues
```bash
# DeepSeek doesn't require API key for basic usage
# If rate limited, get free API key from DeepSeek
```

#### Local Model Issues
```bash
# Check Ollama service
ollama list

# Restart Ollama
ollama serve

# Pull models again
ollama pull llama2
```

---

## 📈 Performance Comparison

| Model | Speed | Quality | Cost | Free Option |
|-------|-------|---------|------|-------------|
| GPT-4 Turbo | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | ❌ |
| Claude 3 Opus | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | ❌ |
| DeepSeek Chat | ⚡⚡ | ⭐⭐⭐⭐ | 🆓 | ✅ |
| GPT-3.5 Turbo | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | ❌ |
| Local Llama 2 | ⚡ | ⭐⭐⭐ | 🆓 | ✅ |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Adding New Models
```python
# In models.py
SUPPORTED_MODELS.update({
    'new-model': {'provider': 'new-provider', 'name': 'model-name'}
})
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

## 🎉 Acknowledgments

- **OpenAI** for GPT models
- **Anthropic** for Claude models
- **Google** for Gemini models
- **DeepSeek** for free open-source models
- **Meta** for Llama models
- **Ollama** for local inference

---

**Your AI Systematic Review Agent is now equipped with the most comprehensive multi-model AI support available! 🚀**

Start conducting world-class systematic reviews with cutting-edge AI models, including FREE options like DeepSeek. The choice is yours! 🎯
