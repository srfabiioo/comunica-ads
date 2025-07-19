const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend do Painel do Facebook Ads está no ar!');
});

app.get('/api/campaigns', async (req, res) => {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const { since, until } = req.query; // Captura as datas da query string
  const apiVersion = 'v20.0';
  const insightFields = 'spend,impressions,reach,cpm,purchase_roas,actions,cost_per_action_type';
  
  // Constrói o período de tempo para a API
  let timeRange = { 'date_preset': 'maximum' };
  if (since && until) {
    timeRange = { 'since': since, 'until': until };
  }

  const fields = `name,status,objective,insights.time_range(${JSON.stringify(timeRange)}){${insightFields}}`;
  
  if (!accessToken) {
    return res.status(400).json({ error: 'O token de acesso do Facebook não está configurado no arquivo .env' });
  }

  try {
    // 1. Buscar as contas de anúncio associadas ao token
    const adAccountsResponse = await axios.get(`https://graph.facebook.com/${apiVersion}/me/adaccounts`, {
        params: { access_token: accessToken, fields: 'id,name' }
    });
    const adAccounts = adAccountsResponse.data.data;

    if (!adAccounts || adAccounts.length === 0) {
      return res.json([]);
    }

    // 2. Preparar as requisições em lote para buscar campanhas de todas as contas
    const batch = adAccounts.map(account => ({
      method: 'GET',
      relative_url: `${account.id}/campaigns?limit=500&fields=${fields}`
    }));

    // 3. Executar a requisição em lote
    const batchResponse = await axios.post(`https://graph.facebook.com/${apiVersion}`, {
      access_token: accessToken,
      batch: JSON.stringify(batch),
    });

    // 4. Processar e unificar os resultados
    const allCampaigns = batchResponse.data
      .filter(response => response.code === 200) 
      .flatMap((response, index) => {
          const body = JSON.parse(response.body);
          const account = adAccounts[index];
          // Adiciona o nome da conta a cada campanha e formata os insights
          return body.data.map(campaign => {
              let insightsData = {};
              if (campaign.insights && campaign.insights.data.length > 0) {
                  insightsData = campaign.insights.data[0];
              }

              const getRoasValue = (roasArray) => {
                  if (!roasArray || roasArray.length === 0) return '0.00';
                  const roasAction = roasArray.find(r => r.action_type.includes('purchase'));
                  return roasAction ? roasAction.value : '0.00';
              };

              const getConversationCount = (actions) => {
                if (!actions || actions.length === 0) return 0;
                const conversationAction = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
                return conversationAction ? parseInt(conversationAction.value) : 0;
              };

              const getCostPerConversation = (costPerAction) => {
                if (!costPerAction || costPerAction.length === 0) return '0.00';
                const conversationAction = costPerAction.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
                return conversationAction ? conversationAction.value : '0.00';
              };

              // Simplifica o objeto de insights para facilitar o uso no frontend
              campaign.insights = {
                  spend: insightsData.spend || '0.00',
                  impressions: insightsData.impressions || '0',
                  reach: insightsData.reach || '0',
                  cpm: insightsData.cpm || '0.00',
                  cost_per_conversation: getCostPerConversation(insightsData.cost_per_action_type),
                  conversation_count: getConversationCount(insightsData.actions),
                  roas: getRoasValue(insightsData.purchase_roas),
              };
              
              campaign.account_name = account.name; // Adiciona o nome da conta
              return campaign;
          });
      });

    res.json(allCampaigns);
  } catch (error) {
    const fbError = error.response ? error.response.data.error : { message: error.message };
    console.error('Erro ao buscar dados da API do Facebook:', JSON.stringify(fbError, null, 2));
    res.status(500).json({ 
        message: 'Falha ao buscar dados da API do Facebook.',
        error: fbError
    });
  }
});


app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
