package chinese

import "gorm.io/gorm"

// Tag is the database model for tag
type Tag struct {
	gorm.Model
	Name string `gorm:"index:,unique;not null;check:name <> ''"`
}
