from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
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
    # Get the next CP number
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
    
    # Get client info if cliente_id is provided
    if pedido_dict.get('cliente_id'):
        cliente = await db.clientes.find_one({"id": pedido_dict['cliente_id']}, {"_id": 0})
        if cliente:
            pedido_dict['cliente_nome'] = cliente.get('nome')
            pedido_dict['cliente_telefone'] = cliente.get('telefone')
            pedido_dict['cliente_endereco'] = cliente.get('endereco')
    
    await db.pedidos.insert_one(pedido_dict)
    return Pedido(**pedido_dict)

@api_router.get("/pedidos", response_model=List[Pedido])
async def get_pedidos():
    pedidos = await db.pedidos.find({}, {"_id": 0}).sort("data_pedido", -1).to_list(1000)
    return pedidos

@api_router.get("/pedidos/{pedido_id}", response_model=Pedido)
async def get_pedido(pedido_id: str):
    pedido = await db.pedidos.find_one({"id": pedido_id}, {"_id": 0})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido

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