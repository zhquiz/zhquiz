package zhquiz.db

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.*

object ExtraTable: IntIdTable("extra") {
    val userId = reference("userId", UserTable)

    var entry = text("entry").index()
    var reading = text("reading")
    var english = text("english")
    var description = text("description")
    var type = text("type").index()

    init {
        check { type inList listOf(
            "character",
            "vocabulary",
            "sentence"
        ) }

        uniqueIndex(userId, entry, type)
    }
}

object TagTable: IntIdTable("tag") {
    val userId = ExtraTable.reference("userId", UserTable)

    var entry = text("entry")
    var tag = text("tag")
    var type = text("type")

    init {
        check {
            type inList listOf(
                "character",
                "vocabulary",
                "sentence"
            )
        }

        uniqueIndex(userId, entry, tag, type)
    }
}

class Extra(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<Extra>(ExtraTable)

    var userId by ExtraTable.userId

    var entry by ExtraTable.entry
    var reading by ExtraTable.reading
    var english by ExtraTable.english
    var description by ExtraTable.description
    var type by ExtraTable.type

    var tag: List<String>
    get() {
            return TagTable
                .select { (TagTable.userId eq userId) and (TagTable.type eq type) and (TagTable.entry eq entry) }
                .map { it[TagTable.tag] }
        }
    set(replacementTags) {
        removeTag(*tag.toTypedArray())
        addTag(*replacementTags.toTypedArray())
    }

    fun addTag(vararg newTags: String) {
        val self = this
        newTags.map { t ->
            TagTable.insertIgnore {
                it[userId] = self.userId
                it[entry] = self.entry
                it[tag] = t
                it[type] = self.type
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
                    (TagTable.entry eq entry) and
                    (TagTable.tag inList nonTags.toList())
        }
    }
}