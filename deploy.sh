#!/bin/bash

echo "🚀 Iniciando deploy do Comunica ADS..."

# Verificar se estamos no diretório correto
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto"
    exit 1
fi

# Deploy do frontend (GitHub Pages)
echo "📦 Fazendo build do frontend..."
cd frontend
npm run build

echo "🌐 Deployando para GitHub Pages..."
npm run deploy

cd ..

echo "✅ Frontend deployado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Vá para https://render.com"
echo "2. Conecte seu repositório GitHub"
echo "3. Configure como 'Web Service'"
echo "4. Adicione a variável FACEBOOK_ACCESS_TOKEN"
echo "5. Deploy!"
echo ""
echo "🔗 URLs esperadas:"
echo "- Frontend: https://seu-usuario.github.io/seu-repositorio"
echo "- Backend: https://comunica-ads-backend.onrender.com"
echo ""
echo "💡 Não esqueça de atualizar a URL do backend no frontend/src/App.jsx" 