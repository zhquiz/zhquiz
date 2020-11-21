package chinese

import (
	"gorm.io/gorm"
)

// Deck for browsing entries collectively
type Deck struct {
	gorm.Model
	Name string `gorm:"index,unique"`
	Q    string
}
