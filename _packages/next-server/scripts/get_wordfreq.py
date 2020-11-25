import sys
import json
from typing import List

from wordfreq import word_frequency
from fastapi import FastAPI

# pylint: disable=no-name-in-module
from pydantic import BaseModel

app = FastAPI()


class FreqResponse(BaseModel):
    entry: str = "你好"
    frequency: float = 7.59


@app.get("/", response_model=FreqResponse)
async def root(q: str):
    return FreqResponse(entry=q, frequency=word_frequency(q, "zh") * 1_000_000)
