package chinese

import (
	"log"
	"path"

	"github.com/patarapolw/zhquiz/shared"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB storage for current DB
type DB struct {
	Current *gorm.DB
}

// Connect connect to the database
func Connect() DB {
	db, err := gorm.Open(sqlite.Open(path.Join(shared.Paths().Root, "chinese.db")), &gorm.Config{})
	if err != nil {
		log.Fatalln(err)
	}

	db.AutoMigrate(&Tag{}, &EntryItem{}, &Entry{})

	return DB{
		Current: db,
	}
}
