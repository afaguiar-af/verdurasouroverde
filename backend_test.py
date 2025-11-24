#!/usr/bin/env python3
"""
Backend Test Suite for Quitanda POS System
Tests all backend routes to ensure they are publicly accessible without authentication
"""

import requests
import json
import sys
from datetime import datetime, timezone

# Get backend URL from frontend .env
BACKEND_URL = "https://veggiestall.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_ids = {
            'clientes': [],
            'produtos': [],
            'pedidos': []
        }
    
    def log_test(self, test_name, success, message="", response_code=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'response_code': response_code
        }
        self.test_results.append(result)
        print(f"{status} {test_name}: {message}")
        if response_code:
            print(f"    Response Code: {response_code}")
    
    def test_clientes_crud(self):
        """Test all CLIENTES endpoints"""
        print("\n=== TESTING CLIENTES ENDPOINTS ===")
        
        # Test POST /clientes - Create cliente
        cliente_data = {
            "nome": "Maria Silva",
            "telefone": "(11) 98765-4321",
            "email": "maria.silva@email.com",
            "endereco": "Rua das Flores, 123 - São Paulo, SP",
            "sexo": "F",
            "observacao": "Cliente preferencial"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/clientes", json=cliente_data)
            if response.status_code == 200:
                cliente_created = response.json()
                self.created_ids['clientes'].append(cliente_created['id'])
                self.log_test("POST /clientes", True, "Cliente criado com sucesso", response.status_code)
                cliente_id = cliente_created['id']
            else:
                self.log_test("POST /clientes", False, f"Erro ao criar cliente: {response.text}", response.status_code)
                return
        except Exception as e:
            self.log_test("POST /clientes", False, f"Exceção: {str(e)}")
            return
        
        # Test GET /clientes - List all clientes
        try:
            response = self.session.get(f"{self.base_url}/clientes")
            if response.status_code == 200:
                clientes = response.json()
                self.log_test("GET /clientes", True, f"Listados {len(clientes)} clientes", response.status_code)
            else:
                self.log_test("GET /clientes", False, f"Erro ao listar clientes: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /clientes", False, f"Exceção: {str(e)}")
        
        # Test GET /clientes/{id} - Get specific cliente
        try:
            response = self.session.get(f"{self.base_url}/clientes/{cliente_id}")
            if response.status_code == 200:
                cliente = response.json()
                self.log_test("GET /clientes/{id}", True, f"Cliente encontrado: {cliente['nome']}", response.status_code)
            else:
                self.log_test("GET /clientes/{id}", False, f"Erro ao buscar cliente: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /clientes/{id}", False, f"Exceção: {str(e)}")
        
        # Test PUT /clientes/{id} - Update cliente
        update_data = {
            "nome": "Maria Silva Santos",
            "telefone": "(11) 98765-4321",
            "email": "maria.santos@email.com",
            "endereco": "Rua das Flores, 123 - São Paulo, SP",
            "sexo": "F",
            "observacao": "Cliente VIP atualizada"
        }
        
        try:
            response = self.session.put(f"{self.base_url}/clientes/{cliente_id}", json=update_data)
            if response.status_code == 200:
                self.log_test("PUT /clientes/{id}", True, "Cliente atualizado com sucesso", response.status_code)
            else:
                self.log_test("PUT /clientes/{id}", False, f"Erro ao atualizar cliente: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("PUT /clientes/{id}", False, f"Exceção: {str(e)}")
    
    def test_produtos_crud(self):
        """Test all PRODUTOS endpoints"""
        print("\n=== TESTING PRODUTOS ENDPOINTS ===")
        
        # Test POST /produtos - Create produto
        produto_data = {
            "nome": "Tomate Cereja",
            "tipo": "Legumes",
            "porcionamento": "kg",
            "qtd_porcionamento": 1.0,
            "valor_unitario": 8.50,
            "estoque_atual": 25.0
        }
        
        try:
            response = self.session.post(f"{self.base_url}/produtos", json=produto_data)
            if response.status_code == 200:
                produto_created = response.json()
                self.created_ids['produtos'].append(produto_created['id'])
                self.log_test("POST /produtos", True, f"Produto criado com CP: {produto_created['cp']}", response.status_code)
                produto_id = produto_created['id']
                produto_cp = produto_created['cp']
            else:
                self.log_test("POST /produtos", False, f"Erro ao criar produto: {response.text}", response.status_code)
                return
        except Exception as e:
            self.log_test("POST /produtos", False, f"Exceção: {str(e)}")
            return
        
        # Test GET /produtos - List all produtos
        try:
            response = self.session.get(f"{self.base_url}/produtos")
            if response.status_code == 200:
                produtos = response.json()
                self.log_test("GET /produtos", True, f"Listados {len(produtos)} produtos", response.status_code)
            else:
                self.log_test("GET /produtos", False, f"Erro ao listar produtos: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /produtos", False, f"Exceção: {str(e)}")
        
        # Test GET /produtos/cp/{cp} - Get produto by CP
        try:
            response = self.session.get(f"{self.base_url}/produtos/cp/{produto_cp}")
            if response.status_code == 200:
                produto = response.json()
                self.log_test("GET /produtos/cp/{cp}", True, f"Produto encontrado por CP: {produto['nome']}", response.status_code)
            else:
                self.log_test("GET /produtos/cp/{cp}", False, f"Erro ao buscar produto por CP: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /produtos/cp/{cp}", False, f"Exceção: {str(e)}")
        
        # Test PUT /produtos/{id} - Update produto
        update_data = {
            "nome": "Tomate Cereja Orgânico",
            "tipo": "Legumes",
            "porcionamento": "kg",
            "qtd_porcionamento": 1.0,
            "valor_unitario": 12.00,
            "estoque_atual": 20.0
        }
        
        try:
            response = self.session.put(f"{self.base_url}/produtos/{produto_id}", json=update_data)
            if response.status_code == 200:
                self.log_test("PUT /produtos/{id}", True, "Produto atualizado com sucesso", response.status_code)
            else:
                self.log_test("PUT /produtos/{id}", False, f"Erro ao atualizar produto: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("PUT /produtos/{id}", False, f"Exceção: {str(e)}")
    
    def test_pedidos_crud(self):
        """Test all PEDIDOS endpoints"""
        print("\n=== TESTING PEDIDOS ENDPOINTS ===")
        
        # First, we need a cliente and produto to create a pedido
        if not self.created_ids['clientes'] or not self.created_ids['produtos']:
            self.log_test("PEDIDOS Setup", False, "Necessário cliente e produto para testar pedidos")
            return
        
        cliente_id = self.created_ids['clientes'][0]
        produto_id = self.created_ids['produtos'][0]
        
        # Test POST /pedidos - Create pedido
        pedido_data = {
            "cliente_id": cliente_id,
            "total_itens": 2.5,
            "valor_total": 30.00,
            "observacao": "Entrega urgente",
            "itens": [
                {
                    "produto_id": produto_id,
                    "produto_nome": "Tomate Cereja Orgânico",
                    "quantidade": 2.5,
                    "valor_unitario": 12.00,
                    "valor_total": 30.00
                }
            ]
        }
        
        try:
            response = self.session.post(f"{self.base_url}/pedidos", json=pedido_data)
            if response.status_code == 200:
                pedido_created = response.json()
                self.created_ids['pedidos'].append(pedido_created['id'])
                self.log_test("POST /pedidos", True, f"Pedido criado com valor: R$ {pedido_created['valor_total']}", response.status_code)
                pedido_id = pedido_created['id']
            else:
                self.log_test("POST /pedidos", False, f"Erro ao criar pedido: {response.text}", response.status_code)
                return
        except Exception as e:
            self.log_test("POST /pedidos", False, f"Exceção: {str(e)}")
            return
        
        # Test GET /pedidos - List pedidos
        try:
            response = self.session.get(f"{self.base_url}/pedidos")
            if response.status_code == 200:
                result = response.json()
                pedidos = result.get('pedidos', [])
                self.log_test("GET /pedidos", True, f"Listados {len(pedidos)} pedidos", response.status_code)
            else:
                self.log_test("GET /pedidos", False, f"Erro ao listar pedidos: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /pedidos", False, f"Exceção: {str(e)}")
        
        # Test GET /pedidos/{id} - Get specific pedido
        try:
            response = self.session.get(f"{self.base_url}/pedidos/{pedido_id}")
            if response.status_code == 200:
                pedido = response.json()
                self.log_test("GET /pedidos/{id}", True, f"Pedido encontrado com {len(pedido['itens'])} itens", response.status_code)
            else:
                self.log_test("GET /pedidos/{id}", False, f"Erro ao buscar pedido: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /pedidos/{id}", False, f"Exceção: {str(e)}")
    
    def test_analytics_endpoints(self):
        """Test all ANALYTICS endpoints"""
        print("\n=== TESTING ANALYTICS ENDPOINTS ===")
        
        # Test GET /analytics/resumo
        try:
            response = self.session.get(f"{self.base_url}/analytics/resumo")
            if response.status_code == 200:
                resumo = response.json()
                self.log_test("GET /analytics/resumo", True, f"Faturamento total: R$ {resumo.get('faturamento_total', 0)}", response.status_code)
            else:
                self.log_test("GET /analytics/resumo", False, f"Erro ao obter resumo: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /analytics/resumo", False, f"Exceção: {str(e)}")
        
        # Test GET /analytics/vendas-por-dia
        try:
            response = self.session.get(f"{self.base_url}/analytics/vendas-por-dia")
            if response.status_code == 200:
                vendas = response.json()
                self.log_test("GET /analytics/vendas-por-dia", True, f"Dados de {len(vendas)} dias", response.status_code)
            else:
                self.log_test("GET /analytics/vendas-por-dia", False, f"Erro ao obter vendas por dia: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /analytics/vendas-por-dia", False, f"Exceção: {str(e)}")
        
        # Test GET /analytics/vendas-por-mes
        try:
            response = self.session.get(f"{self.base_url}/analytics/vendas-por-mes")
            if response.status_code == 200:
                vendas = response.json()
                self.log_test("GET /analytics/vendas-por-mes", True, f"Dados de {len(vendas)} meses", response.status_code)
            else:
                self.log_test("GET /analytics/vendas-por-mes", False, f"Erro ao obter vendas por mês: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /analytics/vendas-por-mes", False, f"Exceção: {str(e)}")
        
        # Test GET /analytics/top-produtos
        try:
            response = self.session.get(f"{self.base_url}/analytics/top-produtos")
            if response.status_code == 200:
                produtos = response.json()
                self.log_test("GET /analytics/top-produtos", True, f"Top {len(produtos)} produtos", response.status_code)
            else:
                self.log_test("GET /analytics/top-produtos", False, f"Erro ao obter top produtos: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /analytics/top-produtos", False, f"Exceção: {str(e)}")
    
    def cleanup_test_data(self):
        """Clean up test data created during tests"""
        print("\n=== CLEANING UP TEST DATA ===")
        
        # Delete test pedidos
        for pedido_id in self.created_ids['pedidos']:
            try:
                response = self.session.delete(f"{self.base_url}/pedidos/{pedido_id}")
                if response.status_code == 200:
                    self.log_test(f"DELETE /pedidos/{pedido_id}", True, "Pedido deletado", response.status_code)
                else:
                    self.log_test(f"DELETE /pedidos/{pedido_id}", False, f"Erro ao deletar: {response.text}", response.status_code)
            except Exception as e:
                self.log_test(f"DELETE /pedidos/{pedido_id}", False, f"Exceção: {str(e)}")
        
        # Delete test produtos
        for produto_id in self.created_ids['produtos']:
            try:
                response = self.session.delete(f"{self.base_url}/produtos/{produto_id}")
                if response.status_code == 200:
                    self.log_test(f"DELETE /produtos/{produto_id}", True, "Produto deletado", response.status_code)
                else:
                    self.log_test(f"DELETE /produtos/{produto_id}", False, f"Erro ao deletar: {response.text}", response.status_code)
            except Exception as e:
                self.log_test(f"DELETE /produtos/{produto_id}", False, f"Exceção: {str(e)}")
        
        # Delete test clientes
        for cliente_id in self.created_ids['clientes']:
            try:
                response = self.session.delete(f"{self.base_url}/clientes/{cliente_id}")
                if response.status_code == 200:
                    self.log_test(f"DELETE /clientes/{cliente_id}", True, "Cliente deletado", response.status_code)
                else:
                    self.log_test(f"DELETE /clientes/{cliente_id}", False, f"Erro ao deletar: {response.text}", response.status_code)
            except Exception as e:
                self.log_test(f"DELETE /clientes/{cliente_id}", False, f"Exceção: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 INICIANDO TESTES DO BACKEND POS QUITANDA")
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"📅 Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Test all endpoints
        self.test_clientes_crud()
        self.test_produtos_crud()
        self.test_pedidos_crud()
        self.test_analytics_endpoints()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 RESUMO DOS TESTES")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result['status'])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result['status'])
        total = len(self.test_results)
        
        print(f"✅ Testes Aprovados: {passed}")
        print(f"❌ Testes Falharam: {failed}")
        print(f"📈 Total de Testes: {total}")
        print(f"📊 Taxa de Sucesso: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if "❌ FAIL" in result['status']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 TODOS OS TESTES PASSARAM! Backend está funcionando corretamente.")
        sys.exit(0)
    else:
        print("⚠️  ALGUNS TESTES FALHARAM! Verifique os erros acima.")
        sys.exit(1)