package db

import "gorm.io/gorm"

// Tag database model for tag
type Tag struct {
	gorm.Model
	Name string `gorm:"index,unique"`
}
