# Comunica ADS - Painel de Campanhas Facebook

Um painel responsivo para visualizar e analisar campanhas do Facebook Ads com métricas essenciais e gráficos interativos.

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js instalado
- Token de acesso do Facebook Marketing API

### 1. Configurar o Backend
```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend` com:
```
FACEBOOK_ACCESS_TOKEN=seu_token_aqui
```

### 2. Configurar o Frontend
```bash
cd frontend
npm install
```

### 3. Executar a Aplicação
```bash
# Terminal 1 - Backend
cd backend
node index.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse: `http://localhost:5173`

## 🌐 Hospedagem no GitHub Pages

### 1. Criar Repositório no GitHub
- Crie um novo repositório no GitHub
- Faça upload dos arquivos ou use git push

### 2. Configurar GitHub Pages
```bash
cd frontend
npm install gh-pages --save-dev
npm run deploy
```

### 3. Configurar no GitHub
- Vá em Settings > Pages
- Source: Deploy from a branch
- Branch: gh-pages
- Save

### 4. Configurar Backend (Alternativas)
Para o backend funcionar online, você pode usar:

**Opção A: Render.com (Gratuito)**
- Conecte seu repositório
- Configure como Node.js app
- Adicione as variáveis de ambiente

**Opção B: Railway.app (Gratuito)**
- Conecte seu repositório
- Configure as variáveis de ambiente

**Opção C: Vercel (Gratuito)**
- Conecte seu repositório
- Configure como Node.js app

### 5. Atualizar URL do Backend
Após hospedar o backend, atualize a URL no frontend:

```javascript
// Em frontend/src/App.jsx, linha ~15
const API_BASE_URL = 'https://seu-backend.onrender.com'; // ou sua URL
```

## 📱 Funcionalidades

- ✅ Filtros por conta, data, status e objetivo
- ✅ Métricas: Custo por conversa, CPM, Gastos, ROI, Alcance, Impressões
- ✅ Gráficos interativos (Barras, Pizza, Linha)
- ✅ Busca por nome de campanha
- ✅ Design responsivo para mobile
- ✅ Totais e médias na tabela
- ✅ Estilização condicional

## 🔧 Tecnologias

- **Frontend**: React, Vite, Chart.js
- **Backend**: Node.js, Express
- **API**: Facebook Marketing API
- **Estilização**: CSS puro com media queries

## 📝 Notas Importantes

1. **Token do Facebook**: Você precisa de um token de acesso válido do Facebook Marketing API
2. **Contas de Anúncio**: O token deve ter acesso às contas de anúncio que deseja visualizar
3. **Rate Limits**: A API do Facebook tem limites de requisições, o painel usa batch requests para otimizar

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se o token do Facebook está válido
2. Confirme se tem acesso às contas de anúncio
3. Verifique os logs do console para erros
4. Certifique-se de que todas as dependências estão instaladas 