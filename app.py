import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from starlette.staticfiles import StaticFiles

from core.model_loader import ModelLoader
from core.game_engine import CemantixEngine

app = FastAPI()

loader = ModelLoader("models/frWac_no_postag_phrase_500_cbow_cut10_stripped.bin")
model = loader.load()
app.mount("/static", StaticFiles(directory="static"), name="static")


engine = CemantixEngine(model)
engine.new_game("chien")  # mot du jour

@app.get("/", response_class=HTMLResponse)
def home():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/guess")
def guess(word: str):
    return engine.guess(word)

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
