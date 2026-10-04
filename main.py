from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Permitir conexión con tu visor
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Consulta(BaseModel):
    pregunta: str
    contexto: dict

@app.get("/")
def root():
    return {"mensaje": "Auresal IA activo"}

@app.post("/asistente")
def asistente(data: Consulta):

    prompt = f"""
Eres un asistente experto en normativa urbanística en Colombia.

Contexto del predio:
{data.contexto}

Pregunta:
{data.pregunta}

Responde claro, breve y con fundamento normativo.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    return {
        "respuesta": response.choices[0].message.content
    }
