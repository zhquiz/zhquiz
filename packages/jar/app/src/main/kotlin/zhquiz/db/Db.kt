package zhquiz.db

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.TransactionManager
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.transactions.transactionManager
import zhquiz.zh.Zh
import zhquiz.zh.ZhLibrary
import java.io.File
import java.nio.file.Path
import java.sql.Connection
import java.sql.ResultSet

object Db {
    val isJar = Db::class.java.getResource("Db.class").toString().startsWith("jar:")

    @SuppressWarnings("WeakerAccess")
    val root: File = if (isJar) {
        File(Db::class.java.protectionDomain.codeSource.location.toURI()).parentFile
    } else {
        File(System.getProperty("user.dir"))
    }

    private const val DEFAULT_SQLITE_DB_NAME = "data.db"
    const val SQLITE_DRIVER = "org.sqlite.JDBC"
    const val POSTGRES_DRIVER = "org.postgresql.Driver"

    val driver: String
    private val connectionUrl: String
    val db: Database

    fun <T:Any>exec(
        stmt: String,
        transform: (ResultSet) -> T
    ): List<T> {
        val result = arrayListOf<T>()
        db.transactionManager.currentOrNull()?.exec(stmt) { rs ->
            while (rs.next()) {
                result += transform(rs)
            }
        }
        return result.toList()
    }

    init {
        val databaseURL = System.getenv("DATABASE_URL") ?: DEFAULT_SQLITE_DB_NAME
        val m = Regex("postgres(ql)?://(?<user>[^:]+):(?<pass>[^@]+)@(?<r>.+)")
            .matchEntire(databaseURL)

        driver = m?.let { POSTGRES_DRIVER } ?: SQLITE_DRIVER
        connectionUrl = m?.let {
            "jdbc:postgresql://${it.groups["r"]!!.value}"
        } ?: let {
            val dbPath = Path.of(root.toString(), databaseURL)
            "jdbc:sqlite:${dbPath.toUri().path}"
        }
        db = m?.let {
            Database.connect(
                url = connectionUrl,
                driver = driver,
                user = it.groups["user"]!!.value,
                password = it.groups["pass"]!!.value
            )
        } ?: Database.connect(
            url = connectionUrl,
            driver = driver,
            user = "",
            password = ""
        )

        m ?: let {
            TransactionManager.manager.defaultIsolationLevel =
                Connection.TRANSACTION_SERIALIZABLE
        }

        transaction(db) {
            SchemaUtils.create(
                UserTable,
                TagTable,
                ExtraTable,
                LibraryTable,
                QuizTable
            )

            if (User.count() == 0L) {
                User.new(1) {
                    identifier = ""
                }
            }

            if (Library.count() == 0L) {
                val globalUser = User.findById(1)!!

                transaction(Zh.db) {
                    ZhLibrary.all()
                }.map {
                    val lib = Library.new {
                        userId = globalUser.id
                        title = it.title
                        entries = it.entries
                        type = it.type
                        description = it.description
                    }

                    lib.tag = it.tag
                }
            }
        }
    }
}