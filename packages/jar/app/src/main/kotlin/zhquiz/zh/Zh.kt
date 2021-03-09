package zhquiz.zh

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transactionManager
import org.sqlite.Function
import org.sqlite.SQLiteConfig
import org.sqlite.SQLiteDataSource
import java.sql.Connection
import java.sql.SQLException
import java.util.regex.Pattern


object Zh {
    val db: Database

    init {
        val config = SQLiteConfig()
//        config.setReadOnly(true)
        val source = SQLiteDataSource(config)
        source.url = "jdbc:sqlite::resource:zh.db"

        Function.create(source.connection, "REGEXP", object : Function() {
            @Throws(SQLException::class)
            override fun xFunc() {
                val expression = value_text(0)
                var value = value_text(1)
                if (value == null) value = ""
                val pattern: Pattern = Pattern.compile(expression)
                result(if (pattern.matcher(value).find()) 1 else 0)
            }
        })

        db = Database.connect(source)
        db.transactionManager.defaultIsolationLevel = Connection.TRANSACTION_SERIALIZABLE


    }
}