import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subMonths } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#FF9800', '#FFC107', '#FFD54F'];

const DashboardCharts = () => {
  const [filtros, setFiltros] = useState({
    periodo: "estemes",
    dataInicio: "",
    dataFim: ""
  });
  
  const [resumo, setResumo] = useState(null);
  const [vendasPorDia, setVendasPorDia] = useState([]);
  const [vendasPorMes, setVendasPorMes] = useState([]);
  const [vendasPorProduto, setVendasPorProduto] = useState([]);
  const [topProdutos, setTopProdutos] = useState([]);
  const [vendasPorCategoria, setVendasPorCategoria] = useState([]);
  const [produtosPorMes, setProdutosPorMes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const calcularDatas = () => {
    const hoje = new Date();
    let dataInicio, dataFim;

    switch(filtros.periodo) {
      case "estemes":
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case "ultimos3meses":
        const tres = subMonths(hoje, 3);
        dataInicio = tres.toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case "anoatual":
        dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case "personalizado":
        return { dataInicio: filtros.dataInicio, dataFim: filtros.dataFim };
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
    }

    return { dataInicio, dataFim };
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { dataInicio, dataFim } = calcularDatas();
      const params = `?dataInicio=${dataInicio}T00:00:00.000Z&dataFim=${dataFim}T23:59:59.999Z`;

      const [
        resumoRes,
        vendasDiaRes,
        vendasMesRes,
        vendasProdutoRes,
        topProdutosRes,
        categoriaRes,
        produtosMesRes
      ] = await Promise.all([
        axios.get(`${API}/analytics/resumo${params}`),
        axios.get(`${API}/analytics/vendas-por-dia${params}`),
        axios.get(`${API}/analytics/vendas-por-mes?ano=${new Date().getFullYear()}`),
        axios.get(`${API}/analytics/vendas-por-produto${params}`),
        axios.get(`${API}/analytics/top-produtos${params}&limit=10`),
        axios.get(`${API}/analytics/vendas-por-categoria${params}`),
        axios.get(`${API}/analytics/produtos-por-mes${params}&limitProdutos=5`)
      ]);

      setResumo(resumoRes.data);
      setVendasPorDia(vendasDiaRes.data);
      setVendasPorMes(vendasMesRes.data);
      setVendasPorProduto(vendasProdutoRes.data.slice(0, 10));
      setTopProdutos(topProdutosRes.data);
      setVendasPorCategoria(categoriaRes.data);
      setProdutosPorMes(produtosMesRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatarMes = (mesStr) => {
    const [ano, mes] = mesStr.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  };

  if (loading && !resumo) {
    return <div className="loading">Carregando dados...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2 className="section-title">Filtros do Dashboard</h2>
        <div className="filter-grid">
          <div className="form-group">
            <label>Período</label>
            <select
              data-testid="dashboard-periodo-select"
              value={filtros.periodo}
              onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
            >
              <option value="estemes">Este mês</option>
              <option value="ultimos3meses">Últimos 3 meses</option>
              <option value="anoatual">Ano atual</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {filtros.periodo === "personalizado" && (
            <>
              <div className="form-group">
                <label>Data Início</label>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Data Fim</label>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <button className="btn btn-primary" onClick={carregarDados} data-testid="atualizar-dashboard-btn">
              Atualizar Dashboard
            </button>
          </div>
        </div>
      </div>

      {resumo && (
        <div className="stats-grid">
          <div className="stat-card" data-testid="stat-faturamento">
            <div className="stat-value">{formatCurrency(resumo.faturamento_total)}</div>
            <div className="stat-label">Faturamento Total</div>
          </div>
          <div className="stat-card" data-testid="stat-pedidos">
            <div className="stat-value">{resumo.total_pedidos}</div>
            <div className="stat-label">Total de Pedidos</div>
          </div>
          <div className="stat-card" data-testid="stat-ticket">
            <div className="stat-value">{formatCurrency(resumo.ticket_medio)}</div>
            <div className="stat-label">Ticket Médio</div>
          </div>
          <div className="stat-card" data-testid="stat-produto-top">
            <div className="stat-value">
              {resumo.produto_mais_vendido ? resumo.produto_mais_vendido.nome : "-"}
            </div>
            <div className="stat-label">Produto Mais Vendido</div>
            {resumo.produto_mais_vendido && (
              <div className="stat-detail">Qtd: {resumo.produto_mais_vendido.quantidade}</div>
            )}
          </div>
          {resumo.cliente_maior_faturamento && (
            <div className="stat-card" data-testid="stat-cliente-top">
              <div className="stat-value">{resumo.cliente_maior_faturamento.nome}</div>
              <div className="stat-label">Cliente com Maior Faturamento</div>
              <div className="stat-detail">{formatCurrency(resumo.cliente_maior_faturamento.valor)}</div>
            </div>
          )}
        </div>
      )}

      <div className="charts-grid">
        {vendasPorDia.length > 0 && (
          <div className="card chart-card">
            <h2 className="section-title">Vendas por Dia</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#4CAF50" strokeWidth={2} name="Valor (R$)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {vendasPorMes.length > 0 && (
          <div className="card chart-card">
            <h2 className="section-title">Vendas por Mês</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickFormatter={formatarMes} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => name === "valor" ? formatCurrency(value) : value}
                  labelFormatter={formatarMes}
                />
                <Legend />
                <Bar dataKey="valor" fill="#4CAF50" name="Valor (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {topProdutos.length > 0 && (
          <div className="card chart-card">
            <h2 className="section-title">Top 10 Produtos Mais Vendidos (Quantidade)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProdutos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="produto" type="category" width={150} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "quantidade") return value;
                    if (name === "valor") return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#66BB6A" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {vendasPorProduto.length > 0 && (
          <div className="card chart-card">
            <h2 className="section-title">Vendas por Produto (Valor)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={vendasPorProduto} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="produto" type="category" width={150} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="valor" fill="#4CAF50" name="Valor (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {vendasPorCategoria.length > 0 && (
          <div className="card chart-card">
            <h2 className="section-title">Vendas por Categoria</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={vendasPorCategoria}
                  dataKey="valor"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={(entry) => `${entry.categoria}: ${formatCurrency(entry.valor)}`}
                >
                  {vendasPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {produtosPorMes.length > 0 && (
          <div className="card chart-card full-width">
            <h2 className="section-title">Top 5 Produtos por Mês</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={produtosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickFormatter={formatarMes} />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={formatarMes}
                />
                <Legend />
                {produtosPorMes.length > 0 && Object.keys(produtosPorMes[0])
                  .filter(key => key !== 'mes')
                  .map((produto, index) => (
                    <Line 
                      key={produto}
                      type="monotone" 
                      dataKey={produto} 
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={2}
                    />
                  ))
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
