package db

import (
	"github.com/patarapolw/zhquiz/server/types"
	"gorm.io/gorm"
)

// EntryItem (internal) are items of an entry
type EntryItem struct {
	gorm.Model
	Name    string `gorm:"index:name_entryId_idx,unique;not null;check:name <> ''"`
	EntryID uint   `gorm:"index:name_entryId_idx,unique;not null"`
}

// Entry is a custom dictionary entry
type Entry struct {
	gorm.Model

	// Relationships
	UserID uint  `gorm:"index;not null"`
	Tags   []Tag `gorm:"many2many:entry_tag"`

	// Entry
	Items        []EntryItem       `gorm:"foreignKey:EntryID"`
	Readings     types.StringArray `gorm:"type:text;not null;check:readings <> ''"`
	Translations types.StringArray `gorm:"type:text;not null;check:translations <> ''"`

	Type string `gorm:"index;not null;check:[type] in ('hanzi', 'vocab', 'sentence')"`
}
