# Quiz Platform

A modern quiz platform built with Spring Boot and React.

## Environment Variables

### Backend

The following environment variables need to be set for the backend:

- `JWT_SECRET`: Secret key used for JWT token generation and verification. This should be a strong, random string in production.

Example of setting environment variables:

```bash
# Linux/macOS
export JWT_SECRET=your-secure-secret-key

# Windows (Command Prompt)
set JWT_SECRET=your-secure-secret-key

# Windows (PowerShell)
$env:JWT_SECRET="your-secure-secret-key"
```

For development, a default secret key is provided, but it's recommended to set your own secret key in production.

## Development Setup

1. Clone the repository
2. Set up the environment variables
3. Start the backend server:
   ```bash
   cd backend
   mvn clean compile exec:java -Dexec.mainClass=com.quizplatform.Main
   ```
4. Start the frontend development server:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Security Notes

- Never commit the actual JWT secret to version control
- Use a strong, random string for the JWT secret in production
- Consider using a secrets management service in production environments
- Regularly rotate the JWT secret in production 