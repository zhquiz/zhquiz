package api

import (
	"github.com/gin-gonic/gin"
	"github.com/patarapolw/zhquiz/shared"
)

type tMediaRouter struct {
	Router *gin.RouterGroup
}

func (r tMediaRouter) init() {
	r.upload()
}

// Upload is a router that uploads media
func (r tMediaRouter) upload() {
	r.Router.POST("/upload", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			panic(err)
		}

		c.SaveUploadedFile(file, shared.Paths().MediaPath())

		c.JSON(201, gin.H{
			"url": "/media/" + file.Filename,
		})
	})
}
