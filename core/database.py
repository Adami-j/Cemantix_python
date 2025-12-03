from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine import make_url
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

# 1. Récupération de l'URL brute
raw_url = os.environ.get("DATABASE_URL")
if not raw_url:
    raise ValueError("❌ Erreur: DATABASE_URL manquant dans le fichier .env")

# 2. Parsing propre de l'URL avec SQLAlchemy
db_url = make_url(raw_url)

# 3. Création du contexte SSL manuel (pour éviter le bug channel_binding)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# 4. On force la suppression des paramètres de requête problématiques dans l'URL
# (ssl, sslmode, etc.) pour laisser connect_args gérer la sécurité.
# On garde l'URL propre sans aucun paramètre '?' à la fin.
safe_url = db_url.set(query={})

# 5. Création du moteur
engine = create_async_engine(
    safe_url,
    echo=True,
    connect_args={"ssl": ssl_ctx} # On injecte le SSL ici directement
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session