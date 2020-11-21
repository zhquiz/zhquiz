package api

import (
	"context"
	"errors"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"
	"github.com/patarapolw/zhquiz/server/chinese"
	"github.com/patarapolw/zhquiz/server/db"
	"github.com/patarapolw/zhquiz/server/rand"
	"github.com/patarapolw/zhquiz/shared"
	"gorm.io/gorm"
)

// Resource is a struct for reuse and cleanup.
type Resource struct {
	DB       db.DB
	Chinese  chinese.DB
	Store    memstore.Store
	FireApp  *firebase.App
	FireAuth *auth.Client
}

// Prepare initializes Resource for reuse and cleanup.
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

	f, _ := os.Create(filepath.Join(shared.Paths().Root, "gin.log"))
	gin.DefaultWriter = io.MultiWriter(f, os.Stdout)

	return Resource{
		DB:       db.Connect(),
		Chinese:  chinese.Connect(),
		Store:    memstore.NewStore([]byte(apiSecret)),
		FireApp:  fireApp,
		FireAuth: fireAuth,
	}
}

// Register registers API paths to Gin Engine.
func (res Resource) Register(r *gin.Engine) {
	r.Use(sessions.Sessions("session", res.Store))

	r.Use(func(c *gin.Context) {
		session := sessions.Default(c)

		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			authorization := c.GetHeader("Authorization")
			if res.FireAuth != nil && strings.HasPrefix(authorization, "Bearer ") {
				ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(30*time.Second))
				defer cancel()

				idToken := strings.Split(authorization, " ")[1]
				if token, err := res.FireAuth.VerifyIDToken(ctx, idToken); err == nil {
					if u, err := res.FireAuth.GetUser(ctx, token.UID); err == nil {
						var dbUser db.User

						if r := res.DB.Current.Where("email = ?", u.Email).First(&dbUser); errors.Is(r.Error, gorm.ErrRecordNotFound) {
							dbUser.New(u.Email, u.DisplayName, u.PhotoURL)
							if dbUser.Image == "" {
								dbUser.Image = "https://www.gravatar.com/avatar/0?d=mp"
							}

							if r := res.DB.Current.Create(&dbUser); r.Error != nil {
								panic(r.Error)
							}
						}

						session.Set("userId", dbUser.ID)
					}
				}
			}
		}
	})

	tAPIRouter{
		Router: r.Group("/api"),
	}.init()

	// Send media files
	r.GET("/media/:filename", func(c *gin.Context) {
		filePath := filepath.Join(shared.Paths().MediaPath(), c.Param("filename"))
		if fileInfo, err := os.Stat(filePath); err == nil && !fileInfo.IsDir() {
			c.File(filePath)
			return
		}

		c.Status(404)
	})
}

// Cleanup cleans up Resource.
func (res Resource) Cleanup() {
	res.DB.Current.Commit()
}
