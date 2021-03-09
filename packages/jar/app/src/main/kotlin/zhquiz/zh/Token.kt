package zhquiz.zh

import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IdTable
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.select

object TokenTable: IdTable<String>("token") {
    override val id = text("entry").entityId()

    val frequency = float("frequency").index()
    val hanziLevel = integer("hanzi_level").nullable().index()
    val vocabLevel = integer("vocab_level").nullable().index()
    val pinyin = text("pinyin")
    val english = text("english")
}

object SubTable: Table("token_sub") {
    val parent = text("parent")
    val child = text("child")

    override val primaryKey = PrimaryKey(parent, child)
}

object SupTable: Table("token_sup") {
    val parent = text("parent")
    val child = text("child")

    override val primaryKey = PrimaryKey(parent, child)
}

object VarTable: Table("token_var") {
    val parent = text("parent")
    val child = text("child")

    override val primaryKey = PrimaryKey(parent, child)
}

class Token(id: EntityID<String>): Entity<String>(id) {
    companion object : EntityClass<String, Token>(TokenTable)

    val entry by TokenTable.id

    val pinyin by TokenTable.pinyin
    val english by TokenTable.english
    val frequency by TokenTable.frequency

    val hanziLevel by TokenTable.hanziLevel
    val vocabLevel by TokenTable.vocabLevel

    val sub get() = SubTable
        .join(TokenTable, JoinType.LEFT, additionalConstraint = { SubTable.child eq TokenTable.id })
        .select { SubTable.parent eq entry.value }
        .orderBy(TokenTable.frequency to SortOrder.DESC)
        .map { it[SubTable.child] }
    val sup get() = SupTable
        .join(TokenTable, JoinType.LEFT, additionalConstraint = { SubTable.child eq TokenTable.id })
        .select { SupTable.parent eq entry.value }
        .orderBy(TokenTable.frequency to SortOrder.DESC)
        .map { it[SupTable.child] }
    val `var` get() = VarTable
        .join(TokenTable, JoinType.LEFT, additionalConstraint = { SubTable.child eq TokenTable.id })
        .select { VarTable.parent eq entry.value }
        .orderBy(TokenTable.frequency to SortOrder.DESC)
        .map { it[VarTable.child] }
}