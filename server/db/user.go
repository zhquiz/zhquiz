package db

import (
	"log"

	"github.com/patarapolw/zhquiz/server/rand"
	"gorm.io/gorm"
)

// User Database model for User
type User struct {
	gorm.Model
	Email  string `gorm:"index,unique"`
	Name   string
	Image  string
	APIKey string
	Data   UserData `gorm:"embedded"`
}

// UserData DbUser data field
type UserData struct {
	Forvo *string
}

// New Create New Record
func (u *User) New(email string, name string, image string) {
	u.Email = email
	u.Name = name
	u.Image = image

	u.NewAPIKey()
}

// NewAPIKey generate new API key
func (u *User) NewAPIKey() string {
	apiKey, err := rand.GenerateRandomString(64)
	if err != nil {
		log.Fatalln(err)
	}

	u.APIKey = apiKey

	return apiKey
}
