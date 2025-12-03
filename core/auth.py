# core/auth.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "cle_de_secours_temporaire_pour_le_dev")

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _pre_hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(_pre_hash_password(plain_password), hashed_password)

def get_password_hash(password):
    return pwd_context.hash(_pre_hash_password(password))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt