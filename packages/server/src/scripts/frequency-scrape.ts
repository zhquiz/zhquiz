import { URL } from 'url'

import axios from 'axios'
import rateLimit from 'axios-rate-limit'
import sqlite3 from 'better-sqlite3'
import cheerio from 'cheerio'
import jieba from 'nodejieba'

class FrequencyScrape {
    db: sqlite3.Database
    re = /\p{sc=Han}/gu
    urls = new Set<string>()
    axios = rateLimit(
        axios.create({
            /** millisecond */
            timeout: 10000,
        }),
        {
            /** per second */
            maxRPS: 1,
        }
    )

    constructor(public filename: string) {
        this.db = sqlite3(filename)

        this.db.exec(/* sql */ `
        CREATE TABLE IF NOT EXISTS frequency (
            "url"           TEXT NOT NULL UNIQUE,
            "character"     JSON NOT NULL,
            "vocabulary"    JSON NOT NULL,
            "date"          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `)

        this.db
            .prepare(
                /* sql */ `
        SELECT "url" FROM frequency
        `
            )
            .all()
            .map((r) => this.urls.add(r.url))
    }

    close() {
        this.db.exec(/* sql */ `
        DROP TABLE IF EXISTS "character";
        CREATE TABLE "character" (
            "entry"         TEXT NOT NULL PRIMARY KEY,
            "frequency"     FLOAT NOT NULL
        );

        DROP TABLE IF EXISTS "vocabulary";
        CREATE TABLE "vocabulary" (
            "entry"         TEXT NOT NULL PRIMARY KEY,
            "frequency"     FLOAT NOT NULL
        );

        WITH c_sum AS (
            SELECT sum(value) FROM frequency, json_tree("character")
        )
        INSERT INTO "character"
        SELECT key, 1000000.0 * value / (SELECT * FROM c_sum) FROM frequency, json_tree("character") WHERE key IS NOT NULL
        ON CONFLICT DO UPDATE SET "frequency" = "frequency" + EXCLUDED."frequency";

        WITH v_sum AS (
            SELECT sum(value) FROM frequency, json_tree("vocabulary")
        )
        INSERT INTO "vocabulary"
        SELECT key, 1000000.0 * value / (SELECT * FROM v_sum) FROM frequency, json_tree("vocabulary") WHERE key IS NOT NULL
        ON CONFLICT DO UPDATE SET "frequency" = "frequency" + EXCLUDED."frequency";
        `)

        this.db.close()
    }

    async scrape(url: string, depth = 2) {
        if (depth < 0) {
            return
        }

        if (!/^https?:\/\//i.test(url)) {
            return
        }

        try {
            const { data: html } = await this.axios.get(url)
            if (typeof html === 'string') {
                this.db
                    .prepare(
                        /* sql */ `
                INSERT OR REPLACE INTO frequency VALUES (?, ?, ?, NULL)
                `
                    )
                    .run(
                        url,
                        JSON.stringify(this.findCharacter(html)),
                        JSON.stringify(this.findVocabulary(html))
                    )

                const $ = cheerio.load(html)

                this.urls.add(new URL(url).href)
                const promises: Promise<any>[] = []
                $('a').each((_, el) => {
                    const href = $(el).attr('href')
                    if (href) {
                        try {
                            const u = new URL(href, url)
                            if (!this.urls.has(u.href)) {
                                promises.push(this.scrape(u.href, depth - 1))
                                this.urls.add(u.href)
                            }
                        } catch (_) {}
                    }
                })
                console.log(promises.length)

                return Promise.allSettled(promises)
            }
        } catch (e) {
            console.error(url)
        }

        return
    }

    findCharacter(html: string) {
        const out: Record<string, number> = {}
        const m = [...html.matchAll(this.re)].map((r) => r[0]!)
        m.map((v) => {
            out[v] = (out[v] || 0) + 1
        })

        return out
    }

    findVocabulary(html: string) {
        const out: Record<string, number> = {}
        const m = jieba.cutForSearch(html).filter((v) => this.re.test(v))
        m.map((v) => {
            out[v] = (out[v] || 0) + 1
        })

        return out
    }
}

if (require.main === module) {
    /**
     * ```sql
     * sqlite> SELECT count(*) FROM (SELECT DISTINCT key FROM frequency, json_tree("character"));
     * 5422
     * sqlite> SELECT count(*) FROM (SELECT DISTINCT key FROM frequency, json_tree("vocabulary"));
     * 43784
     * sqlite> SELECT sum(value) FROM frequency, json_tree("character");
     * 1501467.0
     * sqlite> SELECT sum(value) FROM frequency, json_tree("vocabulary");
     * 744641.0
     * sqlite> SELECT sum(json_extract("character", '$.你')) FROM frequency;
     * 2436
     * sqlite> SELECT sum(json_extract("vocabulary", '$.你们')) FROM frequency;
     * 105
     * ```
     */
    const f = new FrequencyScrape('./assets/freq.db')
    // f.scrape('https://www.hao123.com').then(() => {
    //     f.close()
    // })
    f.close()
}
