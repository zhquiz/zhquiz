package zhquiz

import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.path
import zhquiz.api.Api
import zhquiz.db.Db

object App {
    fun serve() {
        val hasPublic = this.javaClass.classLoader
            .getResource("public") != null

        val app = Javalin.create {
            it.sessionHandler {
                Api.sessionHandler
            }

            it.showJavalinBanner = false

            if (System.getenv("DEBUG") != null) {
                it.enableDevLogging()
            }

            if (!Db.isJar) {
                it.enableDevLogging()
                it.enableCorsForAllOrigins()
            }

            if (hasPublic) {
                it.addStaticFiles("/public")
                it.addSinglePageRoot("/", "/public/index.html")
            }
        }

        app.routes {
            path("api", Api.router)
        }

        if (!hasPublic) {
            app.get("/") { ctx -> ctx.result("Ready") }
        }

        app.start(Api.port)
    }
}