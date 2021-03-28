# ZhQuiz

ZhQuiz, a Chinese quizzing platform

![Preview GIF](/docs/preview.gif)

<https://youtu.be/iomE0xiYoqY>

Currently, this most updated is [Docker with PostgreSQL](/packages/www), followed by <https://github.com/zhquiz/go-zhquiz>.

## Features

- HSK vocabularies made into 60 levels
- Flashcards showing statuses of success
- Custom vocabularies input by users

## Desktop app

See <https://github.com/zhquiz/go-zhquiz/releases>.

By default, it will use Google TTS. But if offline, or Google TTS where to fail, then

- For Windows, you need to install Chinese Language Support.
- For macOS, you will need to enable Chinese voice (Ting-Ting) in accessibility.
- For Linux, you might need to install `espeak` and `speech-dispatcher`, if not preinstalled already.

## Docker app

Powered by PostgreSQL and pgroonga. See [Docker with PostgreSQL](/packages/www).

Hint - it is as simple as installing Docker / Docker Compose, then

```sh
docker-compose build
docker-compose up
```
