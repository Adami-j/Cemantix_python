from gensim.models import KeyedVectors

class ModelLoader:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None

    def load(self):
        if self.model is None:
            self.model = KeyedVectors.load_word2vec_format(
                self.model_path,
                binary=True
            )
        return self.model
