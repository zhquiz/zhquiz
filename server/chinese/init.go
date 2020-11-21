package chinese

import (
	"log"
	"path"

	"github.com/patarapolw/zhquiz/shared"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB holds storage for current DB
type DB struct {
	Current *gorm.DB
}

// Connect connects to the database
func Connect() DB {
	db, err := gorm.Open(sqlite.Open(path.Join(shared.Paths().Dir, "assets", "chinese.db")), &gorm.Config{})
	if err != nil {
		log.Fatalln(err)
	}

	db.AutoMigrate(&Tag{}, &EntryItem{}, &Entry{}, &Deck{})

	return DB{
		Current: db,
	}
}
