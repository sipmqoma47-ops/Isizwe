import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///isizwe.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "27658712184")

