package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireRoles(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleValue, ok := c.Get(ContextUserRole)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "AUTH.FORBIDDEN",
					"message": "missing role",
				},
			})
			return
		}

		role, _ := roleValue.(string)
		if !roleAllowed(role, roles) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "AUTH.FORBIDDEN",
					"message": "insufficient role",
				},
			})
			return
		}

		c.Next()
	}
}

func roleAllowed(role string, allowed []string) bool {
	for _, item := range allowed {
		if role == item {
			return true
		}
	}
	return false
}
