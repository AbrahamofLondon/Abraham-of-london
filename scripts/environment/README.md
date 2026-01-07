# Environment Setup

## Files
- `.env.local` - Local development environment (gitignored)
- `.env` - Default environment variables
- `templates/` - Environment templates for different deployments

## Setup
1. Run `pnpm env:setup` to create initial files
2. Update `.env.local` with your actual values
3. For production, set actual secrets via your hosting platform

## Required Variables for Production
- NEXTAUTH_SECRET
- JWT_SECRET
- ENCRYPTION_KEY
- RESEND_API_KEY (for emails)
- DATABASE_URL (production database)

## Security Notes
- NEVER commit `.env.local` to version control
- Use environment variables for secrets in production
- Rotate secrets periodically
