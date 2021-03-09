package zhquiz.zh

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable

object CedictTable: IntIdTable("cedict") {
    val simplified = text("simplified").index()
    val traditional = text("traditional").nullable().index()
    val pinyin = text("pinyin")
    val english = text("english")
    val frequency = float("frequency").index()
}

class Cedict(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<Cedict>(CedictTable)

    val simplified by CedictTable.simplified
    val traditional by CedictTable.traditional
    val pinyin by CedictTable.pinyin
    val english by CedictTable.english
    val frequency by CedictTable.frequency
}