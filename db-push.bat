@echo off
echo Running prisma db push...
prisma db push --datasource-url="file:./prisma/dev.db"
pause