package api

import (
	"github.com/gin-gonic/gin"
	"github.com/patarapolw/zhquiz/shared"
)

// MediaUpload
func mediaUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		panic(err)
	}

	c.SaveUploadedFile(file, shared.Paths().MediaPath())

	c.JSON(201, gin.H{
		"url": "/media/" + file.Filename,
	})
}
