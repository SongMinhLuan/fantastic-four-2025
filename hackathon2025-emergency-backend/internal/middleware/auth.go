package middleware

import (
	"net/http"
	"strings"

	"invoiceflow/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserID    = "user_id"
	ContextUserRole  = "user_role"
	ContextUserEmail = "user_email"
)

func Auth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "AUTH.UNAUTHORIZED",
					"message": "missing authorization header",
				},
			})
			return
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "AUTH.UNAUTHORIZED",
					"message": "invalid authorization header",
				},
			})
			return
		}

		token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
			if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, jwt.ErrTokenSignatureInvalid
			}
			return []byte(cfg.JWTSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "AUTH.UNAUTHORIZED",
					"message": "invalid token",
				},
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "AUTH.UNAUTHORIZED",
					"message": "invalid token claims",
				},
			})
			return
		}

		userID, _ := claims["sub"].(string)
		role, _ := claims["role"].(string)
		email, _ := claims["email"].(string)

		if userID == "" || role == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "AUTH.UNAUTHORIZED",
					"message": "invalid token claims",
				},
			})
			return
		}

		c.Set(ContextUserID, userID)
		c.Set(ContextUserRole, role)
		c.Set(ContextUserEmail, email)
		c.Next()
	}
}
