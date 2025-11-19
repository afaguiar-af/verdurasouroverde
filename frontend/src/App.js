import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import DashboardCharts from "@/components/DashboardCharts";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Login from "@/components/Login";
import PrivateRoute from "@/components/PrivateRoute";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Clientes Page
const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    sexo: "",
    observacao: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const response = await axios.get(`${API}/clientes`);
      setClientes(response.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/clientes/${editingId}`, formData);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await axios.post(`${API}/clientes`, formData);
        toast.success("Cliente cadastrado com sucesso!");
      }
      handleClear();
      loadClientes();
    } catch (error) {
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleEdit = (cliente) => {
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || "",
      endereco: cliente.endereco || "",
      sexo: cliente.sexo || "",
      observacao: cliente.observacao || ""
    });
    setEditingId(cliente.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este cliente?")) {
      try {
        await axios.delete(`${API}/clientes/${id}`);
        toast.success("Cliente excluído com sucesso!");
        loadClientes();
      } catch (error) {
        toast.error("Erro ao excluir cliente");
      }
    }
  };

  const handleClear = () => {
    setFormData({
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      sexo: "",
      observacao: ""
    });
    setEditingId(null);
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-content">
      <h1 className="page-title" data-testid="clientes-title">Cadastro de Clientes</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid" data-testid="cliente-form">
          <div className="form-group">
            <label>Nome *</label>
            <input
              data-testid="cliente-nome-input"
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Telefone *</label>
            <input
              data-testid="cliente-telefone-input"
              type="text"
              required
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              data-testid="cliente-email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Endereço</label>
            <input
              data-testid="cliente-endereco-input"
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Sexo</label>
            <select
              data-testid="cliente-sexo-select"
              value={formData.sexo}
              onChange={(e) => setFormData({...formData, sexo: e.target.value})}
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          
          <div className="form-group full-width">
            <label>Observação</label>
            <textarea
              data-testid="cliente-observacao-textarea"
              value={formData.observacao}
              onChange={(e) => setFormData({...formData, observacao: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="button-group full-width">
            <button type="submit" className="btn btn-primary" data-testid="cliente-save-btn">
              {editingId ? "Atualizar" : "Salvar"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClear} data-testid="cliente-clear-btn">
              Limpar
            </button>
          </div>
        </form>
      </div>

      <div className="card mt-4">
        <div className="search-bar">
          <input
            data-testid="cliente-search-input"
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="table-container">
          <table data-testid="clientes-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.id.substring(0, 8)}</td>
                  <td>{cliente.nome}</td>
                  <td>{cliente.telefone}</td>
                  <td>{cliente.email || "-"}</td>
                  <td>
                    <button
                      data-testid={`edit-cliente-${cliente.id}`}
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(cliente)}
                    >
                      Editar
                    </button>
                    <button
                      data-testid={`delete-cliente-${cliente.id}`}
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Produtos Page
const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    porcionamento: "",
    qtd_porcionamento: "",
    valor_unitario: "",
    estoque_atual: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    try {
      const response = await axios.get(`${API}/produtos`);
      setProdutos(response.data);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        qtd_porcionamento: parseFloat(formData.qtd_porcionamento),
        valor_unitario: parseFloat(formData.valor_unitario),
        estoque_atual: parseFloat(formData.estoque_atual || 0)
      };
      
      if (editingId) {
        await axios.put(`${API}/produtos/${editingId}`, data);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await axios.post(`${API}/produtos`, data);
        toast.success("Produto cadastrado com sucesso!");
      }
      handleClose();
      loadProdutos();
    } catch (error) {
      toast.error("Erro ao salvar produto");
    }
  };

  const handleEdit = (produto) => {
    setFormData({
      nome: produto.nome,
      tipo: produto.tipo,
      porcionamento: produto.porcionamento,
      qtd_porcionamento: produto.qtd_porcionamento.toString(),
      valor_unitario: produto.valor_unitario.toString(),
      estoque_atual: produto.estoque_atual?.toString() || "0"
    });
    setEditingId(produto.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este produto?")) {
      try {
        await axios.delete(`${API}/produtos/${id}`);
        toast.success("Produto excluído com sucesso!");
        loadProdutos();
      } catch (error) {
        toast.error("Erro ao excluir produto");
      }
    }
  };

  const handleClose = () => {
    setFormData({
      nome: "",
      tipo: "",
      porcionamento: "",
      qtd_porcionamento: "",
      valor_unitario: "",
      estoque_atual: ""
    });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredProdutos = produtos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !tipoFilter || p.tipo === tipoFilter;
    return matchSearch && matchTipo;
  });

  const tipos = [...new Set(produtos.map(p => p.tipo))];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title" data-testid="produtos-title">Cadastro de Produtos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} data-testid="add-produto-btn">
          + Novo Produto
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <input
            data-testid="produto-search-input"
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            data-testid="produto-tipo-filter"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {tipos.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table data-testid="produtos-table">
            <thead>
              <tr>
                <th>CP</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Porcionamento</th>
                <th>Qnt Porcionamento</th>
                <th>Valor (R$)</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutos.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.cp}</td>
                  <td>{produto.nome}</td>
                  <td>{produto.tipo}</td>
                  <td>{produto.porcionamento}</td>
                  <td>{produto.qtd_porcionamento}</td>
                  <td>R$ {produto.valor_unitario.toFixed(2)}</td>
                  <td>{produto.estoque_atual || 0}</td>
                  <td>
                    <button
                      data-testid={`edit-produto-${produto.id}`}
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(produto)}
                    >
                      Editar
                    </button>
                    <button
                      data-testid={`delete-produto-${produto.id}`}
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(produto.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" data-testid="produto-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Editar Produto" : "Novo Produto"}</h2>
              <button className="close-btn" onClick={handleClose}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Produto *</label>
                <input
                  data-testid="produto-nome-input"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Tipo *</label>
                <input
                  data-testid="produto-tipo-input"
                  type="text"
                  required
                  placeholder="Ex: Verdura, Legume, Fruta"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Porcionamento *</label>
                <input
                  data-testid="produto-porcionamento-input"
                  type="text"
                  required
                  placeholder="Ex: Maço, Kg, Unidade"
                  value={formData.porcionamento}
                  onChange={(e) => setFormData({...formData, porcionamento: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Quantidade Porcionamento *</label>
                <input
                  data-testid="produto-qtd-input"
                  type="number"
                  step="0.01"
                  required
                  value={formData.qtd_porcionamento}
                  onChange={(e) => setFormData({...formData, qtd_porcionamento: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Valor Unitário (R$) *</label>
                <input
                  data-testid="produto-valor-input"
                  type="number"
                  step="0.01"
                  required
                  value={formData.valor_unitario}
                  onChange={(e) => setFormData({...formData, valor_unitario: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Estoque Atual</label>
                <input
                  data-testid="produto-estoque-input"
                  type="number"
                  step="0.01"
                  value={formData.estoque_atual}
                  onChange={(e) => setFormData({...formData, estoque_atual: e.target.value})}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary" data-testid="produto-save-btn">
                  {editingId ? "Atualizar" : "Salvar"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleClose} data-testid="produto-cancel-btn">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Venda Page
const Venda = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [itens, setItens] = useState([]);
  const [cpInput, setCpInput] = useState("");
  const [quantidadeInput, setQuantidadeInput] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tipoVenda, setTipoVenda] = useState("sem-cadastro");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [searchCliente, setSearchCliente] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    loadProdutos();
    loadClientes();
  }, []);

  const loadProdutos = async () => {
    try {
      const response = await axios.get(`${API}/produtos`);
      setProdutos(response.data);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    }
  };

  const loadClientes = async () => {
    try {
      const response = await axios.get(`${API}/clientes`);
      setClientes(response.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    }
  };

  const handleCpChange = async (cp) => {
    setCpInput(cp);
    if (cp && !isNaN(cp)) {
      try {
        const response = await axios.get(`${API}/produtos/cp/${parseInt(cp)}`);
        setProdutoSelecionado(response.data);
      } catch (error) {
        setProdutoSelecionado(null);
      }
    } else {
      setProdutoSelecionado(null);
    }
  };

  const handleAddItem = () => {
    if (!produtoSelecionado) {
      toast.error("Produto não encontrado");
      return;
    }
    if (!quantidadeInput || parseFloat(quantidadeInput) <= 0) {
      toast.error("Quantidade inválida");
      return;
    }

    const quantidade = parseFloat(quantidadeInput);
    const valorTotal = quantidade * produtoSelecionado.valor_unitario;

    const novoItem = {
      produto_id: produtoSelecionado.id,
      produto_nome: produtoSelecionado.nome,
      cp: produtoSelecionado.cp,
      quantidade,
      valor_unitario: produtoSelecionado.valor_unitario,
      valor_total: valorTotal
    };

    setItens([...itens, novoItem]);
    setCpInput("");
    setQuantidadeInput("");
    setProdutoSelecionado(null);
    toast.success("Item adicionado!");
  };

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotais = () => {
    const totalQuantidade = itens.reduce((sum, item) => sum + item.quantidade, 0);
    const valorTotal = itens.reduce((sum, item) => sum + item.valor_total, 0);
    return { totalQuantidade, valorTotal };
  };

  const handleEfetuarVenda = async () => {
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    if (tipoVenda === "com-cadastro" && !clienteSelecionado) {
      toast.error("Selecione um cliente para prosseguir");
      return;
    }

    const { totalQuantidade, valorTotal } = calcularTotais();

    const pedidoData = {
      cliente_id: tipoVenda === "com-cadastro" ? clienteSelecionado.id : null,
      total_itens: totalQuantidade,
      valor_total: valorTotal,
      observacao,
      itens: itens.map(item => ({
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total
      }))
    };

    try {
      const response = await axios.post(`${API}/pedidos`, pedidoData);
      toast.success("Venda realizada com sucesso!");
      navigate(`/impressao/${response.data.id}`);
    } catch (error) {
      toast.error("Erro ao realizar venda");
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
    c.telefone.includes(searchCliente)
  );

  const { totalQuantidade, valorTotal } = calcularTotais();

  return (
    <div className="page-content">
      <h1 className="page-title" data-testid="venda-title">Painel de Vendas</h1>

      <div className="venda-grid">
        <div className="venda-left">
          <div className="card">
            <h2 className="section-title">Adicionar Produtos</h2>
            <div className="form-inline">
              <div className="form-group">
                <label>Código (CP)</label>
                <input
                  data-testid="cp-input"
                  type="text"
                  value={cpInput}
                  onChange={(e) => handleCpChange(e.target.value)}
                  placeholder="Digite o código"
                />
              </div>

              {produtoSelecionado && (
                <div className="form-group flex-2">
                  <label>Produto</label>
                  <input
                    data-testid="produto-nome-display"
                    type="text"
                    value={`${produtoSelecionado.nome} - R$ ${produtoSelecionado.valor_unitario.toFixed(2)}`}
                    readOnly
                  />
                </div>
              )}

              <div className="form-group">
                <label>Quantidade</label>
                <input
                  data-testid="quantidade-input"
                  type="number"
                  step="0.01"
                  value={quantidadeInput}
                  onChange={(e) => setQuantidadeInput(e.target.value)}
                  placeholder="Qtd"
                />
              </div>

              <button
                data-testid="add-item-btn"
                className="btn btn-primary"
                onClick={handleAddItem}
                style={{alignSelf: 'flex-end'}}
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="card mt-3">
            <h2 className="section-title">Itens do Pedido</h2>
            <div className="table-container">
              <table data-testid="itens-table">
                <thead>
                  <tr>
                    <th>CP</th>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Valor (R$)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, index) => (
                    <tr key={index}>
                      <td>{item.cp}</td>
                      <td>{item.produto_nome}</td>
                      <td>{item.quantidade}</td>
                      <td>R$ {item.valor_total.toFixed(2)}</td>
                      <td>
                        <button
                          data-testid={`remove-item-${index}`}
                          className="btn-icon btn-delete"
                          onClick={() => handleRemoveItem(index)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                  {itens.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Nenhum item adicionado</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="2"><strong>TOTAL</strong></td>
                    <td><strong>{totalQuantidade}</strong></td>
                    <td><strong>R$ {valorTotal.toFixed(2)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="venda-right">
          <div className="card">
            <h2 className="section-title">Dados do Cliente</h2>
            
            <div className="radio-group" data-testid="tipo-venda-radio">
              <label>
                <input
                  type="radio"
                  value="sem-cadastro"
                  checked={tipoVenda === "sem-cadastro"}
                  onChange={(e) => {
                    setTipoVenda(e.target.value);
                    setClienteSelecionado(null);
                  }}
                  data-testid="sem-cadastro-radio"
                />
                Sem Cadastro
              </label>
              <label>
                <input
                  type="radio"
                  value="com-cadastro"
                  checked={tipoVenda === "com-cadastro"}
                  onChange={(e) => setTipoVenda(e.target.value)}
                  data-testid="com-cadastro-radio"
                />
                Com Cadastro
              </label>
            </div>

            {tipoVenda === "com-cadastro" && (
              <div className="mt-3">
                <div className="form-group">
                  <label>Buscar Cliente</label>
                  <input
                    data-testid="search-cliente-input"
                    type="text"
                    placeholder="Nome ou telefone..."
                    value={searchCliente}
                    onChange={(e) => setSearchCliente(e.target.value)}
                  />
                </div>

                {searchCliente && filteredClientes.length > 0 && (
                  <div className="cliente-list" data-testid="cliente-list">
                    {filteredClientes.slice(0, 5).map(cliente => (
                      <div
                        key={cliente.id}
                        className={`cliente-item ${clienteSelecionado?.id === cliente.id ? 'selected' : ''}`}
                        onClick={() => {
                          setClienteSelecionado(cliente);
                          setSearchCliente("");
                        }}
                        data-testid={`cliente-item-${cliente.id}`}
                      >
                        <strong>{cliente.nome}</strong>
                        <span>{cliente.telefone}</span>
                      </div>
                    ))}
                  </div>
                )}

                {clienteSelecionado && (
                  <div className="cliente-info" data-testid="cliente-info">
                    <p><strong>Código:</strong> {clienteSelecionado.id.substring(0, 8)}</p>
                    <p><strong>Nome:</strong> {clienteSelecionado.nome}</p>
                    <p><strong>Telefone:</strong> {clienteSelecionado.telefone}</p>
                    {clienteSelecionado.endereco && (
                      <p><strong>Endereço:</strong> {clienteSelecionado.endereco}</p>
                    )}
                    {clienteSelecionado.observacao && (
                      <p><strong>Obs:</strong> {clienteSelecionado.observacao}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {tipoVenda === "sem-cadastro" && (
              <div className="info-box" data-testid="sem-cadastro-info">
                <p>Venda sem cadastro de cliente</p>
              </div>
            )}
          </div>

          <div className="card mt-3">
            <div className="form-group">
              <label>Observação do Pedido</label>
              <textarea
                data-testid="observacao-textarea"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows="4"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <button
            data-testid="efetuar-venda-btn"
            className="btn btn-success btn-large"
            onClick={handleEfetuarVenda}
          >
            EFETUAR VENDA
          </button>
        </div>
      </div>
    </div>
  );
};

// Impressão Page
const Impressao = () => {
  const { pedidoId } = useParams();
  const [pedido, setPedido] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPedido();
  }, [pedidoId]);

  const loadPedido = async () => {
    try {
      const response = await axios.get(`${API}/pedidos/${pedidoId}`);
      setPedido(response.data);
    } catch (error) {
      toast.error("Erro ao carregar pedido");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!pedido) return <div className="loading">Carregando...</div>;

  const dataFormatada = new Date(pedido.data_pedido).toLocaleDateString('pt-BR');

  return (
    <div className="impressao-container">
      <div className="no-print">
        <button className="btn btn-primary" onClick={handlePrint} data-testid="print-btn">
          Imprimir
        </button>
        <button className="btn btn-secondary ml-2" onClick={() => navigate('/venda')} data-testid="nova-venda-btn">
          Nova Venda
        </button>
      </div>

      <div className="notinha" data-testid="notinha">
        <div className="notinha-header">
          <h1>VERDURAS OURO VERDE</h1>
          <p>PEDIDO: {pedido.id.substring(0, 8)}</p>
          <p>DATA: {dataFormatada}</p>
        </div>

        <div className="notinha-cliente">
          <p><strong>NOME:</strong> {pedido.cliente_nome || "Cliente não identificado"}</p>
          {pedido.cliente_telefone && (
            <p><strong>TELEFONE:</strong> {pedido.cliente_telefone}</p>
          )}
          {pedido.cliente_endereco && (
            <p><strong>ENDEREÇO:</strong> {pedido.cliente_endereco}</p>
          )}
        </div>

        {pedido.observacao && (
          <div className="notinha-obs">
            <p><strong>OBSERVAÇÃO:</strong></p>
            <p>{pedido.observacao}</p>
          </div>
        )}

        <table className="notinha-table">
          <thead>
            <tr>
              <th>PRODUTO</th>
              <th>QNT</th>
              <th>VALOR</th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item, index) => (
              <tr key={index}>
                <td>{item.produto_nome}</td>
                <td>{item.quantidade}</td>
                <td>R$ {item.valor_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="notinha-total">
          <p>{pedido.total_itens} itens</p>
          <p><strong>R$ {pedido.valor_total.toFixed(2)}</strong></p>
        </div>

        <div className="notinha-footer">
          <p>Obrigado pela preferência!</p>
        </div>
      </div>
    </div>
  );
};

// Histórico Page
const Historico = () => {
  const [activeTab, setActiveTab] = useState("lista");
  
  return (
    <div className="page-content">
      <h1 className="page-title" data-testid="historico-title">Histórico de Vendas</h1>
      
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "lista" ? "active" : ""}`}
            onClick={() => setActiveTab("lista")}
            data-testid="tab-lista"
          >
            Lista de Vendas
          </button>
          <button 
            className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
            data-testid="tab-dashboard"
          >
            Dashboard
          </button>
        </div>
      </div>
      
      {activeTab === "lista" ? <ListaVendas /> : <Dashboard />}
    </div>
  );
};

// Lista de Vendas Component
const ListaVendas = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [filtros, setFiltros] = useState({
    periodo: "hoje",
    dataInicio: "",
    dataFim: "",
    clienteId: ""
  });
  const [clientes, setClientes] = useState([]);
  const [searchCliente, setSearchCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null);
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [page, pageSize]);

  const loadClientes = async () => {
    try {
      const response = await axios.get(`${API}/clientes`);
      setClientes(response.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    }
  };

  const calcularDatas = (periodo) => {
    const hoje = new Date();
    let dataInicio, dataFim;

    switch(periodo) {
      case "hoje":
        dataInicio = dataFim = hoje.toISOString().split('T')[0];
        break;
      case "ontem":
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        dataInicio = dataFim = ontem.toISOString().split('T')[0];
        break;
      case "ultimos7":
        const sete = new Date(hoje);
        sete.setDate(sete.getDate() - 7);
        dataInicio = sete.toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case "estemes":
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case "mesanterior":
        const mesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        dataInicio = mesAnt.toISOString().split('T')[0];
        dataFim = fimMesAnt.toISOString().split('T')[0];
        break;
      default:
        return { dataInicio: filtros.dataInicio, dataFim: filtros.dataFim };
    }

    return { dataInicio, dataFim };
  };

  const aplicarFiltros = async () => {
    try {
      let { dataInicio, dataFim } = filtros.periodo === "personalizado" 
        ? { dataInicio: filtros.dataInicio, dataFim: filtros.dataFim }
        : calcularDatas(filtros.periodo);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (dataInicio) params.append('dataInicio', dataInicio + 'T00:00:00.000Z');
      if (dataFim) params.append('dataFim', dataFim + 'T23:59:59.999Z');
      if (clienteSelecionado) params.append('clienteId', clienteSelecionado.id);

      const response = await axios.get(`${API}/pedidos?${params}`);
      setPedidos(response.data.pedidos);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      toast.error("Erro ao carregar pedidos");
    }
  };

  const limparFiltros = () => {
    setFiltros({
      periodo: "hoje",
      dataInicio: "",
      dataFim: "",
      clienteId: ""
    });
    setClienteSelecionado(null);
    setPage(1);
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
    c.telefone.includes(searchCliente)
  );

  const formatarData = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="card">
        <h2 className="section-title">Filtros</h2>
        <div className="filter-grid">
          <div className="form-group">
            <label>Período</label>
            <select
              data-testid="periodo-select"
              value={filtros.periodo}
              onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
            >
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="ultimos7">Últimos 7 dias</option>
              <option value="estemes">Este mês</option>
              <option value="mesanterior">Mês anterior</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {filtros.periodo === "personalizado" && (
            <>
              <div className="form-group">
                <label>Data Início</label>
                <input
                  data-testid="data-inicio-input"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Data Fim</label>
                <input
                  data-testid="data-fim-input"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Cliente</label>
            <input
              data-testid="search-cliente-historico-input"
              type="text"
              placeholder="Buscar cliente..."
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
            />
            {searchCliente && filteredClientes.length > 0 && (
              <div className="cliente-dropdown">
                {filteredClientes.slice(0, 5).map(cliente => (
                  <div
                    key={cliente.id}
                    className="cliente-dropdown-item"
                    onClick={() => {
                      setClienteSelecionado(cliente);
                      setSearchCliente(cliente.nome);
                    }}
                  >
                    {cliente.nome} - {cliente.telefone}
                  </div>
                ))}
              </div>
            )}
            {clienteSelecionado && (
              <div className="selected-cliente">
                {clienteSelecionado.nome}
                <button onClick={() => { setClienteSelecionado(null); setSearchCliente(""); }}>✕</button>
              </div>
            )}
          </div>
        </div>

        <div className="button-group mt-3">
          <button className="btn btn-primary" onClick={aplicarFiltros} data-testid="aplicar-filtros-btn">
            Aplicar Filtros
          </button>
          <button className="btn btn-secondary" onClick={limparFiltros} data-testid="limpar-filtros-btn">
            Limpar
          </button>
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="section-title">Resultados ({totalCount} pedidos)</h2>
        <div className="table-container">
          <table data-testid="pedidos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Total Itens</th>
                <th>Valor Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.id.substring(0, 8)}</td>
                  <td>{formatarData(pedido.data_pedido)}</td>
                  <td>{pedido.cliente_nome || "Cliente não identificado"}</td>
                  <td>{pedido.total_itens}</td>
                  <td>R$ {pedido.valor_total.toFixed(2)}</td>
                  <td>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => setSelectedPedido(pedido)}
                      data-testid={`ver-detalhes-${pedido.id}`}
                    >
                      Ver Detalhes
                    </button>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => navigate(`/impressao/${pedido.id}`)}
                    >
                      Reimprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button 
            className="btn btn-secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            data-testid="prev-page-btn"
          >
            Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button 
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            data-testid="next-page-btn"
          >
            Próxima
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="10">10 por página</option>
            <option value="20">20 por página</option>
            <option value="50">50 por página</option>
          </select>
        </div>
      </div>

      {selectedPedido && (
        <div className="modal-overlay" onClick={() => setSelectedPedido(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes do Pedido</h2>
              <button className="close-btn" onClick={() => setSelectedPedido(null)}>×</button>
            </div>
            <div className="pedido-detalhes">
              <p><strong>ID:</strong> {selectedPedido.id.substring(0, 8)}</p>
              <p><strong>Data:</strong> {formatarData(selectedPedido.data_pedido)}</p>
              <p><strong>Cliente:</strong> {selectedPedido.cliente_nome || "Cliente não identificado"}</p>
              {selectedPedido.observacao && (
                <p><strong>Observação:</strong> {selectedPedido.observacao}</p>
              )}
              
              <h3 className="mt-3">Itens do Pedido</h3>
              <table className="mt-2">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Valor Unit.</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPedido.itens.map((item, index) => (
                    <tr key={index}>
                      <td>{item.produto_nome}</td>
                      <td>{item.quantidade}</td>
                      <td>R$ {item.valor_unitario.toFixed(2)}</td>
                      <td>R$ {item.valor_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="pedido-total mt-3">
                <p><strong>Total de Itens:</strong> {selectedPedido.total_itens}</p>
                <p><strong>Valor Total:</strong> R$ {selectedPedido.valor_total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Component (continua na próxima parte)
const Dashboard = () => {
  return <DashboardCharts />;
};

// Sidebar Component
const Sidebar = () => {
  const { username, logout } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logout realizado com sucesso!');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`} data-testid="sidebar">
        <div className="sidebar-header">
          <img src="/logo.svg" alt="Logo" className="sidebar-logo" />
          <h2 className="sidebar-title">VERDURAS OURO VERDE</h2>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/venda" 
            className={`sidebar-link ${isActive('/venda') ? 'active' : ''}`}
            data-testid="nav-venda"
            onClick={() => window.innerWidth < 768 && closeSidebar()}
          >
            <span className="sidebar-icon">🛒</span>
            <span className="sidebar-text">Vendas</span>
          </Link>

          <Link 
            to="/clientes" 
            className={`sidebar-link ${isActive('/clientes') ? 'active' : ''}`}
            data-testid="nav-clientes"
            onClick={() => window.innerWidth < 768 && closeSidebar()}
          >
            <span className="sidebar-icon">👥</span>
            <span className="sidebar-text">Clientes</span>
          </Link>

          <Link 
            to="/produtos" 
            className={`sidebar-link ${isActive('/produtos') ? 'active' : ''}`}
            data-testid="nav-produtos"
            onClick={() => window.innerWidth < 768 && closeSidebar()}
          >
            <span className="sidebar-icon">🥬</span>
            <span className="sidebar-text">Produtos</span>
          </Link>

          <Link 
            to="/historico" 
            className={`sidebar-link ${isActive('/historico') ? 'active' : ''}`}
            data-testid="nav-historico"
            onClick={() => window.innerWidth < 768 && closeSidebar()}
          >
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">Histórico</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-icon">👤</span>
            <span className="sidebar-text">{username}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="sidebar-logout"
            data-testid="logout-btn"
          >
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-text">Sair</span>
          </button>
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
          data-testid="sidebar-overlay"
        />
      )}
    </>
  );
};

// Layout with Sidebar Navigation
const Layout = ({ children }) => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="app-layout">
      <Sidebar />
      
      {!isSidebarOpen && (
        <button
          className="menu-toggle-button"
          onClick={toggleSidebar}
          data-testid="menu-toggle-btn"
          aria-label="Abrir menu"
        >
          ☰
        </button>
      )}

      <main className={`app-content ${isSidebarOpen ? 'with-sidebar' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/venda" replace />} />
              <Route path="/clientes" element={<PrivateRoute><Layout><Clientes /></Layout></PrivateRoute>} />
              <Route path="/produtos" element={<PrivateRoute><Layout><Produtos /></Layout></PrivateRoute>} />
              <Route path="/venda" element={<PrivateRoute><Layout><Venda /></Layout></PrivateRoute>} />
              <Route path="/historico" element={<PrivateRoute><Layout><Historico /></Layout></PrivateRoute>} />
              <Route path="/impressao/:pedidoId" element={<PrivateRoute><Impressao /></PrivateRoute>} />
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;