class CemantixEngine:
    def __init__(self, model):
        self.model = model
        self.target_word = None

    def new_game(self, target_word: str):
        self.target_word = target_word

    def guess(self, word: str):
        # Mot inconnu du modèle
        if word not in self.model.key_to_index:
            return {"exists": False}

        # Similarité : numpy.float32 -> float
        sim = float(self.model.similarity(word, self.target_word))

        return {
            "exists": True,
            "similarity": sim,  # en float natif
            "temperature": float(round(sim * 100, 2))
        }