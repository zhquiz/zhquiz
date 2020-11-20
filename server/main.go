package server

import (
	"github.com/gin-gonic/gin"

	"github.com/patarapolw/zhquiz/server/controller"
	"github.com/patarapolw/zhquiz/shared"
)

// Serve start the server
func Serve() {
	port := shared.Port()

	r := gin.Default()
	controller.RegisterAPI(r)

	// fmt.Printf("Server running at http://localhost:%s\n", port)
	r.Run(":" + port)
}
