package zhquiz.db

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable

data class QuizSettings (
    val type: List<String>,
    val stage: List<String>,
    val direction: List<String>,
    val includeUndue: Boolean,
    val q: String
    )

object UserTable: IntIdTable("user") {
    var identifier = text("identifier").uniqueIndex()

    var level = integer("level").default(10)
    var levelMin = integer("levelMin").default(1)
    var s4level = jsonb<Array<String>>("s4level").nullable()
    var s4quiz = jsonb<QuizSettings>("s4quiz").nullable()
}

class User(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<User>(UserTable)

    var identifier by UserTable.identifier
    var level by UserTable.level
    var levelMin by UserTable.levelMin
    var s4level by UserTable.s4level
    var s4quiz by UserTable.s4quiz
}