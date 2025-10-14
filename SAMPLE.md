# Syntax Highlighting Test

This file contains code samples in various languages to test syntax highlighting in markdown rendering.

## JavaScript

```javascript
function greet(name) {
  const message = `Hello, ${name}!`;
  console.log(message);
  return message;
}

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  introduce() {
    return `My name is ${this.name} and I'm ${this.age} years old.`;
  }
}
```

## Python

```python
def calculate_fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return calculate_fibonacci(n - 1) + calculate_fibonacci(n - 2)

class Animal:
    def __init__(self, name, species):
        self.name = name
        self.species = species

    def make_sound(self):
        return f"{self.name} the {self.species} makes a sound"
```

## Go

```go
package main

import (
    "fmt"
    "time"
)

type User struct {
    Name      string
    Email     string
    CreatedAt time.Time
}

func (u *User) SendEmail(message string) error {
    fmt.Printf("Sending email to %s: %s\n", u.Email, message)
    return nil
}

func main() {
    user := &User{
        Name:      "John Doe",
        Email:     "john@example.com",
        CreatedAt: time.Now(),
    }
    user.SendEmail("Welcome!")
}
```

## Rust

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Red"), 50);

    for (key, value) in &scores {
        println!("{}: {}", key, value);
    }
}

struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}
```

## TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data: User = await response.json();
  return data;
}

class UserService {
  private users: Map<number, User> = new Map();

  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUser(id: number): User | undefined {
    return this.users.get(id);
  }
}
```

## Bash

```bash
#!/bin/bash

# Function to backup files
backup_files() {
    local source_dir=$1
    local backup_dir=$2

    if [ ! -d "$backup_dir" ]; then
        mkdir -p "$backup_dir"
    fi

    tar -czf "$backup_dir/backup-$(date +%Y%m%d).tar.gz" "$source_dir"
    echo "Backup completed successfully!"
}

backup_files "/home/user/documents" "/home/user/backups"
```

## SQL

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some data
INSERT INTO users (username, email) VALUES
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com');

-- Query with JOIN
SELECT u.username, o.order_date, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 100
ORDER BY o.order_date DESC;
```

## JSON

```json
{
  "name": "gh-here",
  "version": "2.0.0",
  "description": "A local GitHub-like file browser",
  "dependencies": {
    "express": "^4.18.2",
    "highlight.js": "^11.9.0",
    "marked": "^12.0.0"
  },
  "scripts": {
    "start": "node bin/gh-here.js",
    "test": "jest"
  }
}
```

## CSS

```css
:root {
  --primary-color: #0366d6;
  --background-color: #ffffff;
  --text-color: #24292e;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #0256c7;
  cursor: pointer;
}
```

## HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to My Site</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <p>This is the main content area.</p>
    </main>
    <script src="script.js"></script>
</body>
</html>
```

## Java

```java
import java.util.ArrayList;
import java.util.List;

public class BankAccount {
    private String accountNumber;
    private double balance;
    private List<Transaction> transactions;

    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
        this.transactions = new ArrayList<>();
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            transactions.add(new Transaction("DEPOSIT", amount));
        }
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && balance >= amount) {
            balance -= amount;
            transactions.add(new Transaction("WITHDRAWAL", amount));
            return true;
        }
        return false;
    }
}
```
