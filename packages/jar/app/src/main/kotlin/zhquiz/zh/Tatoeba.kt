package zhquiz.zh

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable

object TatoebaTable: IntIdTable("tatoeba") {
    val chinese = text("chinese").index()
    val english = text("english")
    val frequency = float("frequency").index()
    val level = float("level").nullable().index()
}

class Tatoeba(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<Tatoeba>(TatoebaTable)

    val chinese by TatoebaTable.chinese
    val english by TatoebaTable.english
    val frequency by TatoebaTable.frequency
    val level by TatoebaTable.level
}