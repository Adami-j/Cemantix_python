from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

# Charge les variables d'environnement
load_dotenv()

# 1. Gestion de l'erreur "str | None"
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ Erreur: DATABASE_URL n'est pas défini dans le fichier .env")

# 2. Création du moteur asynchrone
engine = create_async_engine(DATABASE_URL, echo=True)

# 3. Utilisation de async_sessionmaker (Spécifique à SQLAlchemy 2.0+)
# Cela corrige les erreurs de type sur sessionmaker et __aenter__/__aexit__
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

# Dépendance pour FastAPI
async def get_db():
    # Le context manager asynchrone fonctionnera maintenant correctement
    async with AsyncSessionLocal() as session:
        yield session