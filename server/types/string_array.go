package types

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"strings"
)

// StringArray type that is compat with both SQLite and PostGres
type StringArray []string

// Scan (internal) to-external method for StringArray Type
func (sa *StringArray) Scan(value interface{}) error {
	s, ok := value.(string)
	if !ok {
		return errors.New(fmt.Sprint("Not a string:", value))
	}

	if s == "" {
		*sa = []string{}
	} else if strings.HasPrefix(s, "\x1f") && strings.HasSuffix(s, "\x1f") {
		*sa = strings.Split(s[1:len(s)-1], "\x1f")
	} else {
		return errors.New(fmt.Sprint("Invalid string:", value))
	}

	return nil
}

// Value (internal) to-database method for StringArray Type
func (sa StringArray) Value() (driver.Value, error) {
	if len(sa) == 0 {
		return "", nil
	}

	return "\x1f" + strings.Join(sa, "\x1f") + "\x1f", nil
}
