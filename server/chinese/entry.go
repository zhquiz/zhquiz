package chinese

import (
	"github.com/patarapolw/zhquiz/server/types"
	"gorm.io/gorm"
)

// EntryItem (internal) represents items of an entry
type EntryItem struct {
	gorm.Model
	Name    string `gorm:"index:name_entryId_idx,unique"`
	EntryID uint   `gorm:"index:name_entryId_idx,unique"`
}

// Entry is a dictionary entry
type Entry struct {
	gorm.Model

	// Relationships
	Tags []Tag `gorm:"many2many:entry_tag"`

	// Entry
	Items        []EntryItem       `gorm:"foreignKey:EntryID"`
	Readings     types.StringArray `gorm:"type:text"`
	Translations types.StringArray `gorm:"type:text"`

	Type string `gorm:"index"`
}
