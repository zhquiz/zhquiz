package zhquiz.zh

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import zhquiz.db.jsonb

object ZhLibraryTable: IntIdTable("library") {
    val title = text("title").index()
    val entries = jsonb<List<String>>("entries")
    val type = text("type")
    val description = text("description")
    val tag = jsonb<List<String>>("entries")
}

class ZhLibrary(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<ZhLibrary>(ZhLibraryTable)

    val title by ZhLibraryTable.title
    val entries: List<String> by ZhLibraryTable.entries
    val type by ZhLibraryTable.type
    val description by ZhLibraryTable.description
    val tag by ZhLibraryTable.tag
}