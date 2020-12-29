from typing import List
from wordfreq import word_frequency

from fastapi import FastAPI

app = FastAPI()


@app.post("/wordfreq")
async def read_root(entries: List[str]):
    out = {}
    for it in entries:
        out[it] = word_frequency(it, "zh") * 10 ** 6

    return out
