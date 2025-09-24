# Better Auth Database Setup for ParkTrack

This directory contains the complete database schema and migration system for Better Auth integration with MotherDuck/DuckDB.

## Directory Structure

```
src/server/database/
├── README.md                          # This documentation
├── better-auth-schema.ts              # TypeScript schema definitions
├── schema.ts                          # Existing app schema
├── util.ts                           # Database connection utilities
├── setup.ts                          # Development setup scripts
├── migrations/                       # Database migrations
│   ├── 001_better_auth_core_schema.sql # Core Better Auth tables
│   ├── migrate.ts                    # Migration utilities
│   └── cli.ts                        # Migration CLI tool
└── user/                            # User-related queries
    ├── query.ts                     # Recreation location queries
    ├── query.test.ts               # Query tests
    └── constants.ts                # User table constants
```

##  Quick Start

### 1. Initial Setup
```bash
# Set up Better Auth tables for the first time
bun run db:setup

# Check database health
bun run db:health

# Create sample development data (optional)
bun run db:sample-data
```

### 2. Production Setup
```bash
# Initialize production schema
bun run db:production
```

## Database Schema

Better Auth requires four core tables:

### `user` Table
Stores user account information and profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR | NOT NULL | User's display name |
| `email` | VARCHAR | UNIQUE, NOT NULL | User's email address |
| `emailVerified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `image` | VARCHAR | NULLABLE | User's profile image URL |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

### `session` Table
Manages user sessions and authentication tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Unique session identifier |
| `userId` | VARCHAR | FK to user(id) | Associated user |
| `token` | VARCHAR | UNIQUE, NOT NULL | Session token |
| `expiresAt` | TIMESTAMP | NOT NULL | Session expiration time |
| `ipAddress` | VARCHAR | NULLABLE | Client IP address |
| `userAgent` | VARCHAR | NULLABLE | Client user agent |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Session creation time |
| `updatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

### `account` Table
Stores OAuth provider accounts and credential information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Unique account identifier |
| `userId` | VARCHAR | FK to user(id) | Associated user |
| `accountId` | VARCHAR | NOT NULL | Provider account ID |
| `providerId` | VARCHAR | NOT NULL | OAuth provider name |
| `accessToken` | VARCHAR | NULLABLE | OAuth access token |
| `refreshToken` | VARCHAR | NULLABLE | OAuth refresh token |
| `accessTokenExpiresAt` | TIMESTAMP | NULLABLE | Access token expiration |
| `refreshTokenExpiresAt` | TIMESTAMP | NULLABLE | Refresh token expiration |
| `scope` | VARCHAR | NULLABLE | OAuth scope |
| `idToken` | VARCHAR | NULLABLE | OAuth ID token |
| `password` | VARCHAR | NULLABLE | Hashed password (for credentials) |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

### `verification` Table
Handles email verification and password reset tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Unique verification identifier |
| `identifier` | VARCHAR | NOT NULL | Email or identifier to verify |
| `value` | VARCHAR | NOT NULL | Verification token/code |
| `expiresAt` | TIMESTAMP | NOT NULL | Token expiration time |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Token creation time |
| `updatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

## Migration Commands

### Core Migration Commands
```bash
# Run all pending migrations
bun run migrate:up

# Check migration status
bun run migrate:status

# Validate migration integrity
bun run migrate:validate

# Check if tables exist
bun run migrate:check
```

### Advanced Migration Commands
```bash
# Create a new migration file
bun run migrate:create "add user role field"

# Reset database (DANGER: deletes all data)
bun run migrate:reset --force

# Show help
bun run migrate help
```

### Development Commands
```bash
# Full development setup
bun run db:setup

# Check database health
bun run db:health

# Create sample test data
bun run db:sample-data

# Initialize production schema
bun run db:production
```

## 🌐 MotherDuck Integration

### Connection Management
```typescript
import { getParkTrackDatabaseConnection } from './util.js';

// Get database connection
const connection = await getParkTrackDatabaseConnection();

// Execute query
const result = await connection.streamAndReadAll('SELECT * FROM "user"');
const users = result.getRowObjects();
```

### DuckDB Considerations
- Foreign key constraints don't support CASCADE
- JSON data stored as strings (automatically parsed)
- Timestamps use ISO string format
- Boolean values supported natively

## TypeScript Schemas

### Using Schema Validation
```typescript
import { validateUser, validateCreateUser } from './better-auth-schema.js';

// Validate existing user data
const user = validateUser(userData);

// Validate data for user creation
const createData = validateCreateUser({
  name: "John Doe",
  email: "john@example.com",
  emailVerified: false
});
```

### Schema Types
```typescript
import type {
  User,
  Session,
  Account,
  Verification,
  CreateUser,
  SessionWithUser
} from './better-auth-schema.js';
```

## 🧪 Development & Testing

### Sample Data
The setup script creates sample users for development:
- John Developer (john@example.com) - verified
- Jane Tester (jane@example.com) - unverified

### Testing Database Operations
```typescript
import { checkDatabaseHealth } from './setup.js';

// Check database status programmatically
const health = await checkDatabaseHealth();
console.log('Connected:', health.connected);
console.log('Tables exist:', health.tablesExist);
console.log('Migrations applied:', health.migrationsApplied);
```

## 🚨 Troubleshooting

### Common Issues

#### MotherDuck Connection Failed
```bash
# Check environment variable
echo $motherduck_token

# Test connection manually
bun run db:health
```

#### Tables Missing
```bash
# Check which tables exist
bun run migrate:check

# Run migrations
bun run migrate:up
```

#### Migration Checksum Mismatch
```bash
# Validate migrations
bun run migrate:validate

# Check migration status
bun run migrate:status
```

#### Foreign Key Errors
DuckDB doesn't support CASCADE operations. Use application-level cleanup:
```typescript
// Delete user sessions before deleting user
await connection.streamAndReadAll('DELETE FROM "session" WHERE userId = ?');
await connection.streamAndReadAll('DELETE FROM "account" WHERE userId = ?');
await connection.streamAndReadAll('DELETE FROM "user" WHERE id = ?');
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection failed` | Missing MotherDuck token | Set `motherduck_token` environment variable |
| `Table does not exist` | Migrations not run | Run `bun run migrate:up` |
| `FOREIGN KEY constraints cannot use CASCADE` | DuckDB limitation | Remove CASCADE from SQL |
| `Parser Error` | Invalid SQL syntax | Check migration file syntax |

## Further Reading

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [DuckDB SQL Reference](https://duckdb.org/docs/sql/introduction)
- [MotherDuck Documentation](https://motherduck.com/docs)
- [Valibot Schema Validation](https://valibot.dev/)

## Production Checklist

- [ ] MotherDuck token configured
- [ ] All migrations applied (`bun run migrate:status`)
- [ ] Database health check passes (`bun run db:health`)
- [ ] Better Auth adapter configured
- [ ] SSL/TLS enabled for production
- [ ] Database backups configured
- [ ] Monitoring and logging set up

## Performance Optimization

### Indexes
The migration automatically creates indexes for:
- User email lookups
- Session token validation
- Account provider queries
- Verification token lookups

### Query Optimization
- Use specific column selection instead of `SELECT *`
- Add appropriate WHERE clauses
- Consider connection pooling for high traffic

### MotherDuck Best Practices
- Use prepared statements for repeated queries
- Batch INSERT operations when possible
- Monitor query performance through MotherDuck console
