package db

import (
	"github.com/patarapolw/zhquiz/server/types"
	"gorm.io/gorm"
)

// EntryItem (internal) items of an entry
type EntryItem struct {
	gorm.Model
	Name    string `gorm:"index:name_entryId_idx,unique"`
	EntryID uint   `gorm:"index:name_entryId_idx,unique"`
}

// Entry custom dictionary entry
type Entry struct {
	gorm.Model

	// Relationships
	UserID uint  `gorm:"index"`
	User   User  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Tags   []Tag `gorm:"many2many:entry_tag"`

	// Entry
	Items        []EntryItem       `gorm:"foreignKey:EntryID"`
	Readings     types.StringArray `gorm:"type:text"`
	Translations types.StringArray `gorm:"type:text"`

	Type string `gorm:"index"`
}
