package handlers

import "github.com/gin-gonic/gin"

func RespondData(c *gin.Context, status int, data any, meta any) {
	if meta != nil {
		c.JSON(status, gin.H{"data": data, "meta": meta})
		return
	}
	c.JSON(status, gin.H{"data": data})
}

func RespondError(c *gin.Context, status int, code string, message string, details any) {
	if details != nil {
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    code,
				"message": message,
				"details": details,
			},
		})
		return
	}

	c.JSON(status, gin.H{
		"error": gin.H{
			"code":    code,
			"message": message,
		},
	})
}
