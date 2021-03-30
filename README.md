# ZhQuiz

ZhQuiz, a Chinese quizzing platform

![Preview GIF](/docs/preview.gif)

<https://youtu.be/iomE0xiYoqY>

Currently, the most updated is [Docker with PostgreSQL](/docker-compose.yml), followed by <https://github.com/zhquiz/go-zhquiz>.

## Features

- HSK vocabularies made into 60 levels
- Flashcards showing statuses of success
- Custom vocabularies input by users
- Learn vocabulary by sentence, by sentence segmenter, Jieba
- Searchable, with Hanzi, Pinyin (with or without tone) and English

## Desktop app

See <https://github.com/zhquiz/go-zhquiz/releases>.

By default, it will use Google TTS. But if offline, or Google TTS were to fail, then

- For Windows, you need to install Chinese Language Support.
- For macOS, you will need to enable Chinese voice (Ting-Ting) in accessibility.
- For Linux, you might need to install `espeak` and `speech-dispatcher`, if not preinstalled already.

## Docker app

Powered by PostgreSQL and pgroonga.

Hint - it is as simple as installing Docker / Docker Compose, then

```sh
git clone --depth=1 https://github.com/zhquiz/zhquiz.git
docker-compose build
docker-compose up
```

## Mobile / Smartphone / iPad app

This is also possible, with either self hosting or localhost tunneling.

I ensured that the UI is mobile-enabled.
