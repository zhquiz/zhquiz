import sys
import json
from typing import List

from wordfreq import word_frequency
from fastapi import FastAPI, Body

# pylint: disable=no-name-in-module
from pydantic import BaseModel

app = FastAPI()


class FreqResponse(BaseModel):
    entry: str = "你好"
    frequency: float = 7.59


class FreqPostRequest(BaseModel):
    entries: List[str]


class FreqPostResponse(BaseModel):
    result: List[FreqResponse]


@app.get("/freq", response_model=FreqResponse)
async def freq_get(q: str):
    return FreqResponse(entry=q, frequency=word_frequency(q, "zh") * 1_000_000)


@app.post("/freq", response_model=FreqPostResponse)
async def freq_post(body: FreqPostRequest):
    return FreqPostResponse(
        result=[
            FreqResponse(entry=q, frequency=word_frequency(q, "zh") * 1_000_000)
            for q in body.entries
        ]
    )
