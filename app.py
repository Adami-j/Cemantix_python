import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from starlette.staticfiles import StaticFiles
import random
import re
from core.model_loader import ModelLoader
from core.game_engine import CemantixEngine

app = FastAPI()

loader = ModelLoader("model/frWac_no_postag_phrase_500_cbow_cut10_stripped.bin")
model = loader.load()
app.mount("/static", StaticFiles(directory="static"), name="static")



def get_simple_random_word(model):
    vocab = list(model.key_to_index.keys())

    # Filtre : mots simples uniquement
    simple_words = [
        w for w in vocab
        if 4 <= len(w) <= 8                 # mots courts
        and re.fullmatch(r"[a-zàâçéèêëîïôûùüÿñæœ]+", w)  # pas de caractères bizarres
    ]

    return random.choice(simple_words)

random_word = get_simple_random_word(model)
engine = CemantixEngine(model)
engine.new_game(random_word)
print(random_word)


@app.get("/", response_class=HTMLResponse)
def home():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/guess")
def guess(word: str):
    return engine.guess(word)

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=1256, reload=True)
