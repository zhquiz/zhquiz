package zhquiz.api

import com.github.salomonbrys.kotson.fromJson
import com.google.gson.JsonObject
import io.javalin.apibuilder.ApiBuilder.before
import io.javalin.apibuilder.EndpointGroup
import io.javalin.http.util.RateLimit
import org.eclipse.jetty.server.session.DatabaseAdaptor
import org.eclipse.jetty.server.session.DefaultSessionCache
import org.eclipse.jetty.server.session.JDBCSessionDataStoreFactory
import org.eclipse.jetty.server.session.SessionHandler
import org.jetbrains.exposed.sql.transactions.transaction
import zhquiz.db.Db
import zhquiz.db.User
import zhquiz.db.UserTable
import zhquiz.db.gson
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.Path
import java.util.*
import java.util.concurrent.TimeUnit

object Api {
    val port = System.getenv("PORT")?.toInt() ?: 35594
    private val cotterAPIKey = System.getenv("COTTER_API_KEY")

    val router = EndpointGroup {
        before { ctx ->
            RateLimit(ctx).requestPerTimeUnit(10, TimeUnit.SECONDS)

            ctx.header<String>("Authorization")
                .check({ it.startsWith("Basic ") })
                .getOrNull()?.let { authString ->
                    val u = String(
                        Base64.getDecoder()
                        .decode(authString.split(" ")[1])).split(':', limit = 2)

                    val user = transaction(Db.db) {
                        User.find {
                            UserTable.identifier eq u[0]
                        }.firstOrNull()
                    }

                    ctx.sessionAttribute(
                        "userId",
                        user?.let { if (it.checkPassword(u[1])) user.id.value else null }
                    )
                    return@before
                }

            ctx.header<String>("Authorization")
                .check({ it.startsWith("Bearer ") })
                .getOrNull()?.let { authString ->
                    ctx.sessionAttribute(
                        "userId",
                        (cotterAPIKey?.let {
                            try {
                                val userName = ctx.header<String>("X-User").get()

                                val out = gson.toJson(mapOf(
                                        "oauth_token" to authString
                                    )).toByteArray()
                                val length = out.size

                                val url = URL("https://worker.cotter.app/verify")
                                val con = url.openConnection()
                                val http = con as HttpURLConnection
                                http.requestMethod = "POST" // PUT is another valid option
                                http.doOutput = true
                                http.setFixedLengthStreamingMode(length)
                                http.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                                http.setRequestProperty("API_KEY_ID", cotterAPIKey)
                                http.connect()
                                http.outputStream.use { os -> os.write(out) }

                                val s: Scanner = Scanner(http.inputStream).useDelimiter("\\A")

                                if (!s.hasNext()) {
                                    throw Error("Empty response")
                                }

                                val r = gson.fromJson<JsonObject>(s.next())

                                if (!r.get("success").asBoolean) {
                                    throw Error("success false is returned")
                                }

                                val user = transaction(Db.db) {
                                    User.find {
                                        UserTable.identifier eq userName
                                    }.firstOrNull() ?: User.new {
                                        identifier = userName
                                    }
                                }

                                user.id.value
                           } catch (e: Error) {
                                ctx.status(401).result(e.message ?: "Unauthorized")
                                null
                            }
                        })
                    )
                    return@before
                }

            if (System.getenv("DATABASE_URL").isNullOrEmpty()) {
                ctx.sessionAttribute(
                    "userId",
                    transaction(Db.db) {
                        User.find {
                            UserTable.identifier eq (System.getenv("DEFAULT_USER") ?: "")
                        }.firstOrNull()?.id?.value
                    }
                )
            }
        }
    }

    val sessionHandler = SessionHandler().apply {
        sessionCache = DefaultSessionCache(this).apply {
            sessionDataStore = JDBCSessionDataStoreFactory().apply {
                setDatabaseAdaptor(DatabaseAdaptor().apply {
                    setDriverInfo(Db.SQLITE_DRIVER, let {
                        val dbPath = Path.of(Db.root.toString(), "session.db")
                        "jdbc:sqlite:${dbPath.toUri().path}"
                    })
                })
            }.getSessionDataStore(sessionHandler)
        }
        httpOnly = true
    }
}