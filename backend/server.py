from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from collections import defaultdict
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'verduras-ouro-verde-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

# Credenciais fixas (hardcoded conforme especificação)
FIXED_USERNAME = "beiculo"
FIXED_PASSWORD = "adm@123"

# Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str
class Cliente(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    nome: str
    telefone: str
    email: Optional[str] = None
    endereco: Optional[str] = None
    sexo: Optional[str] = None
    observacao: Optional[str] = None
    data_cadastro: Optional[str] = None

class ClienteCreate(BaseModel):
    nome: str
    telefone: str
    email: Optional[str] = None
    endereco: Optional[str] = None
    sexo: Optional[str] = None
    observacao: Optional[str] = None

class Produto(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    cp: Optional[int] = None
    nome: str
    tipo: str
    porcionamento: str
    qtd_porcionamento: float
    valor_unitario: float
    estoque_atual: Optional[float] = 0

class ProdutoCreate(BaseModel):
    nome: str
    tipo: str
    porcionamento: str
    qtd_porcionamento: float
    valor_unitario: float
    estoque_atual: Optional[float] = 0

class ItemPedido(BaseModel):
    produto_id: str
    produto_nome: str
    quantidade: float
    valor_unitario: float
    valor_total: float

class Pedido(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    data_pedido: str
    cliente_id: Optional[str] = None
    cliente_nome: Optional[str] = None
    cliente_telefone: Optional[str] = None
    cliente_endereco: Optional[str] = None
    total_itens: float
    valor_total: float
    observacao: Optional[str] = None
    itens: List[ItemPedido]

class PedidoCreate(BaseModel):
    cliente_id: Optional[str] = None
    total_itens: float
    valor_total: float
    observacao: Optional[str] = None
    itens: List[ItemPedido]

# Authentication Functions
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Routes - Authentication
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    # Verificar credenciais fixas
    if login_data.username != FIXED_USERNAME or login_data.password != FIXED_PASSWORD:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    
    # Gerar token JWT
    access_token = create_access_token(data={"username": login_data.username})
    
    return LoginResponse(token=access_token, username=login_data.username)

# Routes - Clientes
@api_router.post("/clientes", response_model=Cliente)
async def create_cliente(cliente: ClienteCreate):
    cliente_dict = cliente.model_dump()
    cliente_dict['data_cadastro'] = datetime.now(timezone.utc).isoformat()
    cliente_dict['id'] = str(ObjectId())
    await db.clientes.insert_one(cliente_dict)
    return Cliente(**cliente_dict)

@api_router.get("/clientes", response_model=List[Cliente])
async def get_clientes(search: Optional[str] = None):
    query = {}
    if search:
        query = {
            "$or": [
                {"nome": {"$regex": search, "$options": "i"}},
                {"telefone": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        }
    clientes = await db.clientes.find(query, {"_id": 0}).to_list(1000)
    return clientes

@api_router.get("/clientes/{cliente_id}", response_model=Cliente)
async def get_cliente(cliente_id: str):
    cliente = await db.clientes.find_one({"id": cliente_id}, {"_id": 0})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@api_router.put("/clientes/{cliente_id}", response_model=Cliente)
async def update_cliente(cliente_id: str, cliente: ClienteCreate):
    cliente_dict = cliente.model_dump()
    result = await db.clientes.update_one({"id": cliente_id}, {"$set": cliente_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    updated_cliente = await db.clientes.find_one({"id": cliente_id}, {"_id": 0})
    return updated_cliente

@api_router.delete("/clientes/{cliente_id}")
async def delete_cliente(cliente_id: str):
    result = await db.clientes.delete_one({"id": cliente_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente excluído com sucesso"}

# Routes - Produtos
@api_router.post("/produtos", response_model=Produto)
async def create_produto(produto: ProdutoCreate):
    last_produto = await db.produtos.find_one({}, {"_id": 0, "cp": 1}, sort=[("cp", -1)])
    next_cp = (last_produto["cp"] + 1) if last_produto and "cp" in last_produto else 1
    
    produto_dict = produto.model_dump()
    produto_dict['cp'] = next_cp
    produto_dict['id'] = str(ObjectId())
    await db.produtos.insert_one(produto_dict)
    return Produto(**produto_dict)

@api_router.get("/produtos", response_model=List[Produto])
async def get_produtos(search: Optional[str] = None, tipo: Optional[str] = None):
    query = {}
    if search:
        query["nome"] = {"$regex": search, "$options": "i"}
    if tipo:
        query["tipo"] = tipo
    produtos = await db.produtos.find(query, {"_id": 0}).sort("cp", 1).to_list(1000)
    return produtos

@api_router.get("/produtos/cp/{cp}", response_model=Produto)
async def get_produto_by_cp(cp: int):
    produto = await db.produtos.find_one({"cp": cp}, {"_id": 0})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@api_router.get("/produtos/{produto_id}", response_model=Produto)
async def get_produto(produto_id: str):
    produto = await db.produtos.find_one({"id": produto_id}, {"_id": 0})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@api_router.put("/produtos/{produto_id}", response_model=Produto)
async def update_produto(produto_id: str, produto: ProdutoCreate):
    produto_dict = produto.model_dump()
    result = await db.produtos.update_one({"id": produto_id}, {"$set": produto_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    updated_produto = await db.produtos.find_one({"id": produto_id}, {"_id": 0})
    return updated_produto

@api_router.delete("/produtos/{produto_id}")
async def delete_produto(produto_id: str):
    result = await db.produtos.delete_one({"id": produto_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"message": "Produto excluído com sucesso"}

# Routes - Pedidos
@api_router.post("/pedidos", response_model=Pedido)
async def create_pedido(pedido: PedidoCreate):
    pedido_dict = pedido.model_dump()
    pedido_dict['data_pedido'] = datetime.now(timezone.utc).isoformat()
    pedido_dict['id'] = str(ObjectId())
    
    if pedido_dict.get('cliente_id'):
        cliente = await db.clientes.find_one({"id": pedido_dict['cliente_id']}, {"_id": 0})
        if cliente:
            pedido_dict['cliente_nome'] = cliente.get('nome')
            pedido_dict['cliente_telefone'] = cliente.get('telefone')
            pedido_dict['cliente_endereco'] = cliente.get('endereco')
    
    await db.pedidos.insert_one(pedido_dict)
    return Pedido(**pedido_dict)

@api_router.get("/pedidos")
async def get_pedidos(
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None,
    clienteId: Optional[str] = None,
    page: int = 1,
    pageSize: int = 20
):
    query = {}
    
    if dataInicio and dataFim:
        query["data_pedido"] = {
            "$gte": dataInicio,
            "$lte": dataFim
        }
    
    if clienteId:
        query["cliente_id"] = clienteId
    
    total_count = await db.pedidos.count_documents(query)
    skip = (page - 1) * pageSize
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).sort("data_pedido", -1).skip(skip).limit(pageSize).to_list(pageSize)
    
    return {
        "pedidos": pedidos,
        "totalCount": total_count,
        "page": page,
        "pageSize": pageSize
    }

@api_router.get("/pedidos/{pedido_id}", response_model=Pedido)
async def get_pedido(pedido_id: str):
    pedido = await db.pedidos.find_one({"id": pedido_id}, {"_id": 0})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido

# Analytics Routes
@api_router.get("/analytics/resumo")
async def get_resumo(
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None
):
    query = {}
    if dataInicio and dataFim:
        query["data_pedido"] = {"$gte": dataInicio, "$lte": dataFim}
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).to_list(10000)
    
    if not pedidos:
        return {
            "faturamento_total": 0,
            "total_pedidos": 0,
            "ticket_medio": 0,
            "produto_mais_vendido": None,
            "cliente_maior_faturamento": None
        }
    
    faturamento_total = sum(p["valor_total"] for p in pedidos)
    total_pedidos = len(pedidos)
    ticket_medio = faturamento_total / total_pedidos if total_pedidos > 0 else 0
    
    # Produto mais vendido
    produtos_qtd = defaultdict(lambda: {"quantidade": 0, "nome": ""})
    for pedido in pedidos:
        for item in pedido.get("itens", []):
            produtos_qtd[item["produto_id"]]["quantidade"] += item["quantidade"]
            produtos_qtd[item["produto_id"]]["nome"] = item["produto_nome"]
    
    produto_mais_vendido = None
    if produtos_qtd:
        top_produto = max(produtos_qtd.items(), key=lambda x: x[1]["quantidade"])
        produto_mais_vendido = {
            "nome": top_produto[1]["nome"],
            "quantidade": top_produto[1]["quantidade"]
        }
    
    # Cliente com maior faturamento
    clientes_valor = defaultdict(lambda: {"valor": 0, "nome": ""})
    for pedido in pedidos:
        if pedido.get("cliente_id"):
            clientes_valor[pedido["cliente_id"]]["valor"] += pedido["valor_total"]
            clientes_valor[pedido["cliente_id"]]["nome"] = pedido.get("cliente_nome", "")
    
    cliente_maior_faturamento = None
    if clientes_valor:
        top_cliente = max(clientes_valor.items(), key=lambda x: x[1]["valor"])
        cliente_maior_faturamento = {
            "nome": top_cliente[1]["nome"],
            "valor": top_cliente[1]["valor"]
        }
    
    return {
        "faturamento_total": faturamento_total,
        "total_pedidos": total_pedidos,
        "ticket_medio": ticket_medio,
        "produto_mais_vendido": produto_mais_vendido,
        "cliente_maior_faturamento": cliente_maior_faturamento
    }

@api_router.get("/analytics/vendas-por-dia")
async def get_vendas_por_dia(
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None,
    clienteId: Optional[str] = None
):
    query = {}
    if dataInicio and dataFim:
        query["data_pedido"] = {"$gte": dataInicio, "$lte": dataFim}
    if clienteId:
        query["cliente_id"] = clienteId
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).to_list(10000)
    
    vendas_por_dia = defaultdict(lambda: {"valor": 0, "quantidade_itens": 0})
    for pedido in pedidos:
        data = pedido["data_pedido"][:10]  # YYYY-MM-DD
        vendas_por_dia[data]["valor"] += pedido["valor_total"]
        vendas_por_dia[data]["quantidade_itens"] += pedido["total_itens"]
    
    result = [{"data": k, "valor": v["valor"], "quantidade_itens": v["quantidade_itens"]} 
              for k, v in sorted(vendas_por_dia.items())]
    
    return result

@api_router.get("/analytics/vendas-por-mes")
async def get_vendas_por_mes(
    ano: Optional[int] = None,
    clienteId: Optional[str] = None
):
    query = {}
    if ano:
        query["data_pedido"] = {
            "$gte": f"{ano}-01-01",
            "$lte": f"{ano}-12-31"
        }
    if clienteId:
        query["cliente_id"] = clienteId
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).to_list(10000)
    
    vendas_por_mes = defaultdict(lambda: {"valor": 0, "pedidos": 0})
    for pedido in pedidos:
        mes = pedido["data_pedido"][:7]  # YYYY-MM
        vendas_por_mes[mes]["valor"] += pedido["valor_total"]
        vendas_por_mes[mes]["pedidos"] += 1
    
    result = [{"mes": k, "valor": v["valor"], "pedidos": v["pedidos"]} 
              for k, v in sorted(vendas_por_mes.items())]
    
    return result

@api_router.get("/analytics/vendas-por-produto")
async def get_vendas_por_produto(
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None,
    clienteId: Optional[str] = None
):
    query = {}
    if dataInicio and dataFim:
        query["data_pedido"] = {"$gte": dataInicio, "$lte": dataFim}
    if clienteId:
        query["cliente_id"] = clienteId
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).to_list(10000)
    
    vendas_por_produto = defaultdict(float)
    produto_nomes = {}
    
    for pedido in pedidos:
        for item in pedido.get("itens", []):
            vendas_por_produto[item["produto_id"]] += item["valor_total"]
            produto_nomes[item["produto_id"]] = item["produto_nome"]
    
    result = [{"produto": produto_nomes[k], "valor": v} 
              for k, v in sorted(vendas_por_produto.items(), key=lambda x: x[1], reverse=True)]
    
    return result

@api_router.get("/analytics/top-produtos")
async def get_top_produtos(
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None,
    limit: int = 10
):
    query = {}
    if dataInicio and dataFim:
        query["data_pedido"] = {"$gte": dataInicio, "$lte": dataFim}
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).to_list(10000)
    
    produtos_stats = defaultdict(lambda: {"quantidade": 0, "valor": 0, "nome": ""})
    
    for pedido in pedidos:
        for item in pedido.get("itens", []):
            produtos_stats[item["produto_id"]]["quantidade"] += item["quantidade"]
            produtos_stats[item["produto_id"]]["valor"] += item["valor_total"]
            produtos_stats[item["produto_id"]]["nome"] = item["produto_nome"]
    
    result = [{"produto": v["nome"], "quantidade": v["quantidade"], "valor": v["valor"]} 
              for k, v in sorted(produtos_stats.items(), key=lambda x: x[1]["quantidade"], reverse=True)[:limit]]
    
    return result

@api_router.get("/analytics/vendas-por-categoria")
async def get_vendas_por_categoria(
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None
):
    query = {}
    if dataInicio and dataFim:
        query["data_pedido"] = {"$gte": dataInicio, "$lte": dataFim}
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).to_list(10000)
    produtos = await db.produtos.find({}, {"_id": 0}).to_list(10000)
    
    produto_tipo_map = {p["id"]: p["tipo"] for p in produtos}
    
    categoria_stats = defaultdict(lambda: {"valor": 0, "quantidade": 0})
    
    for pedido in pedidos:
        for item in pedido.get("itens", []):
            tipo = produto_tipo_map.get(item["produto_id"], "Outros")
            categoria_stats[tipo]["valor"] += item["valor_total"]
            categoria_stats[tipo]["quantidade"] += item["quantidade"]
    
    result = [{"categoria": k, "valor": v["valor"], "quantidade": v["quantidade"]} 
              for k, v in sorted(categoria_stats.items(), key=lambda x: x[1]["valor"], reverse=True)]
    
    return result

@api_router.get("/analytics/produtos-por-mes")
async def get_produtos_por_mes(
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None,
    limitProdutos: int = 5
):
    query = {}
    if dataInicio and dataFim:
        query["data_pedido"] = {"$gte": dataInicio, "$lte": dataFim}
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).to_list(10000)
    
    # Get top products overall
    produtos_total = defaultdict(lambda: {"valor": 0, "nome": ""})
    for pedido in pedidos:
        for item in pedido.get("itens", []):
            produtos_total[item["produto_id"]]["valor"] += item["valor_total"]
            produtos_total[item["produto_id"]]["nome"] = item["produto_nome"]
    
    top_produtos = sorted(produtos_total.items(), key=lambda x: x[1]["valor"], reverse=True)[:limitProdutos]
    top_produto_ids = [p[0] for p in top_produtos]
    produto_nomes = {p[0]: p[1]["nome"] for p in top_produtos}
    
    # Group by month
    vendas_mes_produto = defaultdict(lambda: defaultdict(float))
    for pedido in pedidos:
        mes = pedido["data_pedido"][:7]  # YYYY-MM
        for item in pedido.get("itens", []):
            if item["produto_id"] in top_produto_ids:
                vendas_mes_produto[mes][item["produto_id"]] += item["valor_total"]
    
    result = []
    for mes in sorted(vendas_mes_produto.keys()):
        mes_data = {"mes": mes}
        for prod_id in top_produto_ids:
            mes_data[produto_nomes[prod_id]] = vendas_mes_produto[mes].get(prod_id, 0)
        result.append(mes_data)
    
    return result

@api_router.get("/analytics/vendas-cliente-timeline")
async def get_vendas_cliente_timeline(
    clienteId: str,
    dataInicio: Optional[str] = None,
    dataFim: Optional[str] = None
):
    query = {"cliente_id": clienteId}
    if dataInicio and dataFim:
        query["data_pedido"] = {"$gte": dataInicio, "$lte": dataFim}
    
    pedidos = await db.pedidos.find(query, {"_id": 0}).sort("data_pedido", 1).to_list(10000)
    
    result = [{"data": p["data_pedido"][:10], "valor": p["valor_total"]} for p in pedidos]
    
    return result

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()