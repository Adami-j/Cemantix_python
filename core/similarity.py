import numpy as np

class Similarity:
    @staticmethod
    def cosine(v1, v2):
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
