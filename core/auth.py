# core/auth.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

# À mettre dans votre .env
SECRET_KEY = "VOTRE_SECRET_KEY_TRES_LONGUE_ET_SECURISEE"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7) # Session de 7 jours
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt