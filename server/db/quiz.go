package db

import (
	"time"

	"gorm.io/gorm"
)

// Quiz database model for quiz
type Quiz struct {
	gorm.Model

	// Relationships
	UserID uint  `gorm:"index"`
	User   User  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Tags   []Tag `gorm:"many2many:quiz_tag"`

	// Entry references
	Entry     string `gorm:"index:entry_type_direction_idx,unique"`
	Type      string `gorm:"index:entry_type_direction_idx,unique"`
	Direction string `gorm:"index:entry_type_direction_idx,unique"`

	// Quiz annotations
	Front    string
	Back     string
	Mnemonic string

	// Quiz statistics
	SRSLevel    *int8      `gorm:"index"`
	NextReview  *time.Time `gorm:"index"`
	LastRight   *time.Time `gorm:"index"`
	LastWrong   *time.Time `gorm:"index"`
	RightStreak *uint      `gorm:"index"`
	WrongStreak *uint      `gorm:"index"`
	MaxRight    *uint      `gorm:"index"`
	MaxWrong    *uint      `gorm:"index"`
}

// New new quiz item
func (q *Quiz) New(userID uint, entry string, typing string, direction string) {
	q.UserID = userID
	q.Entry = entry
	q.Type = typing
	q.Direction = direction
}

var srsMap []time.Duration = []time.Duration{
	4 * time.Hour,
	8 * time.Hour,
	24 * time.Hour,
	3 * 24 * time.Hour,
	7 * 24 * time.Hour,
	2 * 7 * 24 * time.Hour,
	4 * 7 * 24 * time.Hour,
	16 * 7 * 24 * time.Hour,
}

func getNextReview(srsLevel int8) time.Time {
	if srsLevel >= 0 && srsLevel < int8(len(srsMap)) {
		return time.Now().Add(srsMap[srsLevel])
	}

	return time.Now().Add(10 * time.Minute)
}

// UpdateSRSLevel this will also update stats
func (q *Quiz) UpdateSRSLevel(dSRSLevel int8) {
	if dSRSLevel > 0 {
		if q.RightStreak == nil {
			*q.RightStreak = 0
		}

		*q.RightStreak++

		if q.MaxRight == nil || *q.MaxRight < *q.RightStreak {
			*q.MaxRight = *q.RightStreak
		}
	} else if dSRSLevel < 0 {
		if q.WrongStreak == nil {
			*q.WrongStreak = 0
		}

		*q.WrongStreak++

		if q.MaxWrong == nil || *q.MaxWrong < *q.WrongStreak {
			*q.MaxWrong = *q.WrongStreak
		}
	}

	if q.SRSLevel == nil {
		*q.SRSLevel = 0
	}

	*q.SRSLevel += dSRSLevel

	if *q.SRSLevel >= int8(len(srsMap)) {
		*q.SRSLevel = int8(len(srsMap) - 1)
	}

	if *q.SRSLevel < 0 {
		*q.SRSLevel = 0
		*q.NextReview = getNextReview(-1)
	} else {
		*q.NextReview = getNextReview(*q.SRSLevel)
	}
}
