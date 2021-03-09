package zhquiz.db

import com.github.salomonbrys.kotson.fromJson
import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insertIgnore
import org.jetbrains.exposed.sql.select

object LibraryTable: IntIdTable("library") {
    var userId = reference("userId", UserTable)

    var title = text("title").index()
    var entries = text("entries")
    var type = text("type").index()
    var description = text("description")

    init {
        check { type inList listOf(
            "character",
            "vocabulary",
            "sentence"
        ) }

        uniqueIndex(userId, title)
    }
}

class Library(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<Library>(LibraryTable)

    var userId by LibraryTable.userId

    var title by LibraryTable.title
    var entries: List<String> by LibraryTable.entries.transform(
        { gson.toJson(it) },
        { gson.fromJson(it) }
    )
    var type by LibraryTable.type
    var description by LibraryTable.description

    var tag: List<String>
        get() {
            val globalUser = User.findById(1)!!

            return TagTable
                .select { (TagTable.userId inList listOf(globalUser.id, userId)) and (TagTable.type eq type) and (TagTable.entry inList entries) }
                .map { it[TagTable.tag] }
        }
        set(replacementTags) {
            removeTag(*tag.toTypedArray())
            addTag(*replacementTags.toTypedArray())
        }

    fun addTag(vararg newTags: String) {
        val self = this
        entries.map { ent ->
            newTags.map { t ->
                TagTable.insertIgnore {
                    it[userId] = self.userId
                    it[entry] = ent
                    it[tag] = t
                    it[type] = self.type
                }
            }
        }
    }

    fun removeTag(vararg nonTags: String) {
        if (nonTags.isEmpty()) {
            return
        }

        TagTable.deleteWhere {
            (TagTable.userId eq userId) and
                    (TagTable.type eq type) and
                    (TagTable.entry inList entries) and
                    (TagTable.tag inList nonTags.toList())
        }
    }
}