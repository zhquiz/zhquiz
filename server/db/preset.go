package db

import (
	"github.com/patarapolw/zhquiz/server/types"
	"gorm.io/gorm"
)

// Preset holds deck states
type Preset struct {
	gorm.Model

	UserID uint `gorm:"index:preset_unique_idx,unique"`

	Name     string `gorm:"index:preset_unique_idx,unique"`
	Q        string
	Status   PresetStatus      `gorm:"embedded"`
	Selected types.StringArray `gorm:"type:text"`
	Opened   types.StringArray `gorm:"type:text"`
}

// PresetStatus (internal) holds status of a Preset
type PresetStatus struct {
	New       bool
	Due       bool
	Leech     bool
	Graduated bool
}
