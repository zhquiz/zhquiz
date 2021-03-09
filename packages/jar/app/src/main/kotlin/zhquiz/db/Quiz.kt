package zhquiz.db

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.jodatime.datetime
import org.joda.time.DateTime
import org.joda.time.Duration
import java.util.*

object QuizTable: IntIdTable("quiz") {
    var userId = reference("userId", UserTable)

    var entry = text("entry").index()
    var type = text("type").index()
    var direction = text("type").index()
    var description = text("description").default("")

    var srsLevel = integer("srsLevel").nullable().index()
    var nextReview = datetime("nextReview").nullable().index()
    var lastRight = datetime("lastRight").nullable().index()
    var lastWrong = datetime("lastWrong").nullable().index()
    var rightStreak = integer("rightStreak").nullable().index()
    var wrongStreak = integer("wrongStreak").nullable().index()
    var maxRight = integer("maxRight").nullable().index()
    var maxWrong = integer("maxWrong").nullable().index()

    init {
        check { type inList listOf(
            "character",
            "vocabulary",
            "sentence"
        ) }

        uniqueIndex(userId, entry, type, direction)
    }
}

class Quiz(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<Quiz>(QuizTable) {
        val srsMap = listOf(
            Duration.standardHours(4),
            Duration.standardHours(8),
            Duration.standardDays(1),
            Duration.standardDays(3),
            Duration.standardDays(7),
            Duration.standardDays(14),
            Duration.standardDays(28),
            Duration.standardDays(28 * 4)
        )
    }

    var entry by QuizTable.entry
    var type by QuizTable.type
    var direction by QuizTable.direction
    var description by QuizTable.description
    var srsLevel by QuizTable.srsLevel
    var nextReview by QuizTable.nextReview
    var lastRight by QuizTable.lastRight
    var lastWrong by QuizTable.lastWrong
    var rightStreak by QuizTable.rightStreak
    var wrongStreak by QuizTable.wrongStreak
    var maxRight by QuizTable.maxRight
    var maxWrong by QuizTable.maxWrong

    fun updateSrsLevel(dLevel: Int) {
        val now = DateTime.now()
        val srs = (srsLevel ?: 0) + dLevel
        srsLevel = srs

        nextReview = when {
            srs < 0 -> now.plus(Duration.standardDays(1))
            srs >= srsMap.size -> now.plus(Duration.standardDays(28 * 4))
            else -> now.plus(srsMap[srs])
        }

        when {
            dLevel > 0 -> {
                lastRight = now

                val streak = (rightStreak ?: 0) + 1
                rightStreak = streak
                wrongStreak = 0

                maxRight = maxRight?.let { if (it > streak) it else streak } ?: streak
            }
            dLevel < 0 -> {
                lastWrong = now

                val streak = (wrongStreak ?: 0) + 1
                wrongStreak = streak
                rightStreak = 0

                maxWrong = maxWrong?.let { if (it > streak) it else streak } ?: streak
            }
        }
    }
}