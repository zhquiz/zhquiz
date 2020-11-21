package db

import (
	"github.com/patarapolw/zhquiz/server/types"
	"gorm.io/gorm"
)

// Preset holds deck states
type Preset struct {
	gorm.Model

	UserID uint `gorm:"index:preset_unique_idx,unique;not null"`

	Name     string            `gorm:"index:preset_unique_idx,unique;not null;name <> ''"`
	Q        string            `gorm:"not null"`
	Status   PresetStatus      `gorm:"embedded"`
	Selected types.StringArray `gorm:"type:text;not null"`
	Opened   types.StringArray `gorm:"type:text;not null"`
}

// PresetStatus (internal) holds status of a Preset
type PresetStatus struct {
	New       bool `gorm:"not null"`
	Due       bool `gorm:"not null"`
	Leech     bool `gorm:"not null"`
	Graduated bool `gorm:"not null"`
}
