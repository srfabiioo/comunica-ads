import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedObjective, setSelectedObjective] = useState('all');
  const [showCharts, setShowCharts] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Define as datas padrão para os últimos 30 dias
  const getInitialDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0],
    };
  };

  const [dates, setDates] = useState(getInitialDates());

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true); // Inicia o loading ao buscar novos dados
      try {
        const params = {
          since: dates.since,
          until: dates.until,
        };
        const response = await axios.get('https://comunica-ads-backend.onrender.com/api/campaigns', { params });
        setCampaigns(response.data);
        
        if (adAccounts.length === 0) {
            const uniqueAccounts = [...new Set(response.data.map(c => c.account_name))];
            setAdAccounts(uniqueAccounts);
        }

      } catch (err) {
        setError('Falha ao carregar os dados. Verifique se o backend está rodando.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [dates]); // <<-- Adiciona 'dates' como dependência para refazer a busca

  const handleDateChange = (e) => {
    setDates(prevDates => ({
      ...prevDates,
      [e.target.name]: e.target.value
    }));
  };

  // Filtros aplicados
  const filteredCampaigns = campaigns
    .filter(campaign => selectedAccount === 'all' || campaign.account_name === selectedAccount)
    .filter(campaign => parseFloat(campaign.insights.spend) > 0)
    .filter(campaign => 
      searchTerm === '' || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(campaign => 
      selectedStatus === 'all' || 
      campaign.status === selectedStatus
    )
    .filter(campaign => 
      selectedObjective === 'all' || 
      campaign.objective === selectedObjective
    );

  // Calcula os totais e médias
  const totalSpend = filteredCampaigns.reduce((sum, campaign) => 
    sum + parseFloat(campaign.insights.spend), 0
  );
  
  const totalImpressions = filteredCampaigns.reduce((sum, campaign) => 
    sum + parseInt(campaign.insights.impressions), 0
  );
  
  const totalConversations = filteredCampaigns.reduce((sum, campaign) => 
    sum + parseInt(campaign.insights.conversation_count || 0), 0
  );

  const averageCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const averageCostPerConversation = totalConversations > 0 ? 
    totalSpend / totalConversations : 0;

  // Dados para gráficos
  const chartData = {
    // Gráfico de barras - Top 10 campanhas por gasto
    bar: {
      labels: filteredCampaigns
        .sort((a, b) => parseFloat(b.insights.spend) - parseFloat(a.insights.spend))
        .slice(0, 10)
        .map(c => c.name.substring(0, 20) + '...'),
      datasets: [{
        label: 'Valor Gasto (R$)',
        data: filteredCampaigns
          .sort((a, b) => parseFloat(b.insights.spend) - parseFloat(a.insights.spend))
          .slice(0, 10)
          .map(c => parseFloat(c.insights.spend)),
        backgroundColor: 'rgba(220, 53, 69, 0.8)',
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 1,
      }]
    },
    // Gráfico de pizza - Distribuição por conta
    pie: {
      labels: [...new Set(filteredCampaigns.map(c => c.account_name))],
      datasets: [{
        data: [...new Set(filteredCampaigns.map(c => c.account_name))].map(account => 
          filteredCampaigns
            .filter(c => c.account_name === account)
            .reduce((sum, c) => sum + parseFloat(c.insights.spend), 0)
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderWidth: 2,
      }]
    },
    // Gráfico de linha - CPM por campanha
    line: {
      labels: filteredCampaigns
        .sort((a, b) => parseFloat(b.insights.cpm) - parseFloat(a.insights.cpm))
        .slice(0, 15)
        .map(c => c.name.substring(0, 15) + '...'),
      datasets: [{
        label: 'CPM (R$)',
        data: filteredCampaigns
          .sort((a, b) => parseFloat(b.insights.cpm) - parseFloat(a.insights.cpm))
          .slice(0, 15)
          .map(c => parseFloat(c.insights.cpm)),
        borderColor: 'rgba(111, 66, 193, 1)',
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        tension: 0.1,
      }]
    }
  };

  // Debug: verificar se há dados para os gráficos
  console.log('Dados dos gráficos:', {
    filteredCampaigns: filteredCampaigns.length,
    barLabels: chartData.bar.labels.length,
    pieLabels: chartData.pie.labels.length,
    lineLabels: chartData.line.labels.length
  });

  const styles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0f2f5;
      color: #1c1e21;
      margin: 0;
      padding: 10px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background-color: #fff;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #dddfe2;
      padding-bottom: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }
    h1 {
      font-size: 24px;
      color: #1877f2;
      margin: 0;
      flex-shrink: 0;
    }
    .filters {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: flex-end;
      flex: 1;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 120px;
    }
    label {
      font-weight: 600;
      font-size: 14px;
      color: #606770;
    }
    select, input[type="date"], input[type="text"] {
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #ccd0d5;
      font-size: 14px;
      transition: border-color 0.2s ease;
      min-width: 120px;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    select {
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 16px;
      padding-right: 30px;
    }
    select:focus, input[type="date"]:focus, input[type="text"]:focus {
      outline: none;
      border-color: #1877f2;
      box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
    }
    .search-input {
      min-width: 200px;
    }
    .charts-toggle {
      background-color: #1877f2;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.2s ease;
      white-space: nowrap;
      min-height: 44px;
    }
    .charts-toggle:hover {
      background-color: #166fe5;
    }
    .charts-toggle:active {
      transform: scale(0.98);
    }
    .charts-section {
      margin: 30px 0;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .chart-container {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      height: 350px;
      display: flex;
      flex-direction: column;
    }
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #495057;
      margin-bottom: 15px;
      text-align: center;
    }
    .chart-wrapper {
      flex: 1;
      position: relative;
    }
    
    /* Tabela responsiva */
    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      min-width: 800px;
    }
    th, td {
      border: 1px solid #dddfe2;
      padding: 12px 8px;
      text-align: left;
      transition: background-color 0.2s ease;
      white-space: nowrap;
    }
    th {
      background-color: #f5f6f7;
      font-weight: 600;
      color: #495057;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #e3f2fd;
      transform: scale(1.001);
      transition: all 0.2s ease;
    }
    .loading, .error {
      text-align: center;
      font-size: 18px;
      padding: 50px;
    }
    .status {
      padding: 4px 8px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      display: inline-block;
    }
    .status-ACTIVE { background-color: #42b72a; }
    .status-PAUSED { background-color: #f0ad4e; }
    .status-ARCHIVED { background-color: #606770; }
    .status-IN_PROCESS { background-color: #1877f2; }
    .no-data {
      text-align: center;
      font-size: 16px;
      padding: 40px;
      color: #606770;
    }
    .table-footer {
      background-color: #f8f9fa;
      font-weight: bold;
      border-top: 2px solid #dee2e6;
    }
    .table-footer td {
      padding: 15px 8px;
      color: #495057;
    }
    .cost-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    .cost-good {
      color: #28a745;
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
    }
    .cost-warning {
      color: #dc3545;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
    }
    .cost-icon {
      font-size: 16px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    .metric-value {
      font-weight: 600;
      color: #495057;
    }
    .spend-value {
      color: #dc3545;
      font-weight: 700;
    }
    .cpm-value {
      color: #6f42c1;
      font-weight: 600;
    }
    .roas-value {
      color: #28a745;
      font-weight: 600;
    }
    
    /* Responsividade melhorada */
    @media (max-width: 1200px) {
      .charts-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
      .chart-container {
        height: 300px;
      }
    }
    
    @media (max-width: 768px) {
      body {
        padding: 5px;
      }
      .container {
        padding: 10px;
        margin: 5px;
        border-radius: 6px;
      }
      .header {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }
      h1 {
        font-size: 20px;
        text-align: center;
      }
      .filters {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      .filter-group {
        flex-direction: column;
        min-width: auto;
      }
      .filter-group label {
        margin-bottom: 4px;
      }
      select, input[type="date"], input[type="text"] {
        min-width: auto;
        width: 100%;
        padding: 12px;
        font-size: 16px; /* Evita zoom no iOS */
      }
      .search-input {
        min-width: auto;
      }
      .charts-toggle {
        width: 100%;
        margin-top: 10px;
      }
      .charts-section {
        padding: 15px;
        margin: 20px 0;
      }
      .charts-grid {
        grid-template-columns: 1fr;
        gap: 15px;
      }
      .chart-container {
        height: 280px;
        padding: 12px;
      }
      .chart-title {
        font-size: 14px;
        margin-bottom: 10px;
      }
      .table-container {
        margin: 0 -10px;
        border-radius: 0;
      }
      table {
        font-size: 12px;
        min-width: 600px;
      }
      th, td {
        padding: 8px 6px;
        font-size: 11px;
      }
      .status {
        font-size: 9px;
        padding: 3px 6px;
      }
      .cost-indicator {
        padding: 3px 6px;
        font-size: 11px;
      }
      .cost-icon {
        font-size: 14px;
      }
    }
    
    @media (max-width: 480px) {
      body {
        padding: 2px;
      }
      .container {
        padding: 8px;
        margin: 2px;
      }
      h1 {
        font-size: 18px;
      }
      .filters {
        gap: 10px;
      }
      select, input[type="date"], input[type="text"] {
        padding: 10px;
        font-size: 16px;
      }
      .charts-section {
        padding: 10px;
      }
      .chart-container {
        height: 250px;
        padding: 10px;
      }
      .chart-title {
        font-size: 13px;
      }
      table {
        font-size: 10px;
        min-width: 500px;
      }
      th, td {
        padding: 6px 4px;
        font-size: 10px;
      }
      .status {
        font-size: 8px;
        padding: 2px 4px;
      }
      .cost-indicator {
        padding: 2px 4px;
        font-size: 10px;
      }
      .cost-icon {
        font-size: 12px;
      }
      .loading, .error {
        font-size: 16px;
        padding: 30px 20px;
      }
    }
    
    /* Melhorias para touch */
    @media (hover: none) and (pointer: coarse) {
      select, input[type="date"], input[type="text"], .charts-toggle, .mobile-filters-toggle {
        min-height: 44px;
      }
      tr:hover {
        transform: none;
      }
      .charts-toggle:active, .mobile-filters-toggle:active {
        transform: scale(0.95);
      }
      
      /* Melhor feedback visual para touch */
      .charts-toggle:active, .mobile-filters-toggle:active {
        background-color: #0d6efd;
      }
      
      /* Scroll suave para tabela */
      .table-container {
        -webkit-overflow-scrolling: touch;
      }
    }
    
    /* Orientação landscape em mobile */
    @media (max-width: 768px) and (orientation: landscape) {
      .header {
        flex-direction: row;
        align-items: center;
      }
      .filters {
        flex-direction: row;
        flex-wrap: wrap;
      }
      .filter-group {
        min-width: 120px;
      }
      .charts-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
    }
    
    /* Menu de filtros para mobile */
    .mobile-filters-toggle {
      display: none;
      background-color: #1877f2;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 10px;
      width: 100%;
      min-height: 44px;
    }
    
    .mobile-filters-toggle:hover {
      background-color: #166fe5;
    }
    
    @media (max-width: 480px) {
      .mobile-filters-toggle {
        display: block;
      }
      
      .filters {
        display: none;
      }
      
      .filters.show {
        display: flex;
      }
      
      .header {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;

  const getCostIndicator = (cost) => {
    const costValue = parseFloat(cost);
    if (costValue === 0) return null;
    
    if (costValue < 3.00) {
      return (
        <div className="cost-indicator cost-good">
          <span className="cost-icon">✓</span>
          <span>{costValue.toFixed(2)}</span>
        </div>
      );
    } else {
      return (
        <div className="cost-indicator cost-warning">
          <span className="cost-icon">⚠️</span>
          <span>{costValue.toFixed(2)}</span>
        </div>
      );
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="container">
        <div className="header">
          <h1>Comunica ADS</h1>
          <button 
            className="mobile-filters-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <div className={`filters ${showFilters ? 'show' : ''}`}>
            <div className="filter-group">
              <label htmlFor="account-select">Conta:</label>
              <select 
                id="account-select"
                value={selectedAccount} 
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="all">Todas as Contas</option>
                {adAccounts.map(account => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="search-input">Buscar:</label>
              <input 
                type="text" 
                id="search-input"
                className="search-input"
                placeholder="Nome da campanha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="status-select">Status:</label>
              <select 
                id="status-select"
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="ACTIVE">Ativas</option>
                <option value="PAUSED">Pausadas</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="since-date">De:</label>
              <input 
                type="date" 
                id="since-date" 
                name="since"
                value={dates.since}
                onChange={handleDateChange} 
              />
            </div>
            <div className="filter-group">
              <label htmlFor="until-date">Até:</label>
              <input 
                type="date" 
                id="until-date"
                name="until"
                value={dates.until}
                onChange={handleDateChange}
              />
      </div>
            <button 
              className="charts-toggle"
              onClick={() => setShowCharts(!showCharts)}
            >
              {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
        </button>
          </div>
        </div>
        
        {showCharts && (
          <div className="charts-section">
            <h2>Análise Visual dos Dados</h2>
            {filteredCampaigns.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                Nenhum dado disponível para exibir gráficos. Aplique filtros para ver dados.
              </div>
            ) : (
              <div className="charts-grid">
                <div className="chart-container">
                  <div className="chart-title">Top 10 Campanhas por Gasto</div>
                  {chartData.bar.labels.length > 0 ? (
                    <div className="chart-wrapper">
                      <Bar 
                        data={chartData.bar}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                      Sem dados para exibir
                    </div>
                  )}
                </div>
                <div className="chart-container">
                  <div className="chart-title">Distribuição de Gastos por Conta</div>
                  {chartData.pie.labels.length > 0 ? (
                    <div className="chart-wrapper">
                      <Pie 
                        data={chartData.pie}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                      Sem dados para exibir
                    </div>
                  )}
                </div>
                <div className="chart-container">
                  <div className="chart-title">CPM por Campanha (Top 15)</div>
                  {chartData.line.labels.length > 0 ? (
                    <div className="chart-wrapper">
                      <Line 
                        data={chartData.line}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                      Sem dados para exibir
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && filteredCampaigns.length > 0 && (
          <div style={{
            background: '#e3f2fd',
            padding: '10px 15px',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '14px',
            color: '#1976d2',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            📊 {filteredCampaigns.length} campanha{filteredCampaigns.length !== 1 ? 's' : ''} encontrada{filteredCampaigns.length !== 1 ? 's' : ''}
          </div>
        )}
        
        {loading && <div className="loading">Carregando dados...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Status</th>
                  <th>Valor Gasto (R$)</th>
                  <th>Impressões</th>
                  <th>Alcance</th>
                  <th>CPM (R$)</th>
                  <th>Custo por Conversa (R$)</th>
                  <th>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.length > 0 ? (
                  filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td>
                        <span className={`status status-${campaign.status}`}>{campaign.status}</span>
                      </td>
                      <td className="spend-value">{parseFloat(campaign.insights.spend).toFixed(2)}</td>
                      <td className="metric-value">{new Intl.NumberFormat('pt-BR').format(campaign.insights.impressions)}</td>
                      <td className="metric-value">{new Intl.NumberFormat('pt-BR').format(campaign.insights.reach)}</td>
                      <td className="cpm-value">{parseFloat(campaign.insights.cpm).toFixed(2)}</td>
                      <td>
                        {getCostIndicator(campaign.insights.cost_per_conversation)}
                      </td>
                      <td className="roas-value">{parseFloat(campaign.insights.roas).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">Nenhuma campanha encontrada para os filtros selecionados.</td>
                  </tr>
                )}
              </tbody>
              {filteredCampaigns.length > 0 && (
                <tfoot>
                  <tr className="table-footer">
                    <td><strong>TOTAIS / MÉDIAS</strong></td>
                    <td></td>
                    <td className="spend-value"><strong>{totalSpend.toFixed(2)}</strong></td>
                    <td></td>
                    <td></td>
                    <td className="cpm-value"><strong>{averageCPM.toFixed(2)}</strong></td>
                    <td>
                      {getCostIndicator(averageCostPerConversation)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
