from typing import List
from wordfreq import word_frequency
from regex import regex
from fastapi import FastAPI

app = FastAPI()


def wordfreq(it: str, lang: str):
    if lang == "zh" and regex.search("[\\p{Katakana}\\p{Hiragana}]", it):
        return 0

    return word_frequency(it, lang) * 10 ** 6


@app.post("/wordfreq")
async def r_wordfreq(entries: List[str], lang: str = "zh"):
    out = {}
    for it in entries:
        out[it] = wordfreq(it, lang)

    return out


@app.post("/wordfreq/multi")
async def r_wordfreq_multi(entries: List[str], langs: List[str]):
    out = []
    for it in entries:
        r = {}

        for lang in langs:
            r[lang] = wordfreq(it, lang)

            if not r[lang]:
                r[lang] = None

        if any(r.values()):
            r["entry"] = it
            out.append(r)

    return {"result": out}
