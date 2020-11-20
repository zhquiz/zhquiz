package server

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"

	"github.com/patarapolw/zhquiz/server/db"
	"github.com/patarapolw/zhquiz/server/rand"
	"github.com/patarapolw/zhquiz/shared"
)

// Resource for reuse and cleanup
type Resource struct {
	DB       db.DB
	Store    memstore.Store
	FireApp  *firebase.App
	FireAuth *auth.Client
}

// Prepare initialize Resource for reuse and cleanup
func Prepare() Resource {
	var fireApp *firebase.App
	var fireAuth *auth.Client

	if os.Getenv("GOOGLE_APPLICATION_CREDENTIALS") != "" {
		ctx := context.Background()

		app, err := firebase.NewApp(context.Background(), nil)
		if err != nil {
			log.Fatalf("error initializing app: %v\n", err)
		}

		fireApp = app

		client, err := app.Auth(ctx)
		if err != nil {
			log.Fatalf("error getting Auth client: %v\n", err)
		}

		fireAuth = client
	}

	apiSecret := shared.GetenvOrDefaultFn("ZHQUIZ_API_SECRET", func() string {
		s, err := rand.GenerateRandomString(64)
		if err != nil {
			log.Fatalln(err)
		}
		return s
	})

	return Resource{
		DB:       db.Connect(),
		Store:    memstore.NewStore([]byte(apiSecret)),
		FireApp:  fireApp,
		FireAuth: fireAuth,
	}
}

// Serve start the server
func (res Resource) Serve() {
	r := gin.Default()
	res.registerAPI(r)

	// fmt.Printf("Server running at http://localhost:%s\n", port)
	r.Run(":" + shared.Port())
}

// Cleanup cleanup resources
func (res Resource) Cleanup() {
	res.DB.Current.Commit()
}
