@echo off
echo Installing npm dependencies...

REM Initialize package.json with default values
npm init -y

REM Install testing and linting tools
npm install --save-dev jest jest-environment-jsdom eslint

REM Create Jest config file
echo module.exports = { > jest.config.js
echo   testEnvironment: "jsdom", >> jest.config.js
echo   setupFilesAfterEnv: ["./src/scripts/test/setupTests.js"], >> jest.config.js
echo }; >> jest.config.js

REM Create ESLint config
npx eslint --init

REM Create basic test utils setup file
mkdir src\scripts\test
echo global.testUtils = { > src\scripts\test\setupTests.js
echo   simulateClick: (el) => el.dispatchEvent(new MouseEvent('click')) >> src\scripts\test\setupTests.js
echo }; >> src\scripts\test\setupTests.js

REM Create a placeholder test file
mkdir tests
echo test("Sample test", () => { expect(true).toBe(true); }); > tests\sample.test.js

REM Final Instructions
echo.
echo ? All tools installed and basic test setup created.
echo.
echo ?? Next steps:
echo - Customize your ESLint rules in .eslintrc.*
echo - Add your test cases in the tests\ folder
echo - Use "npm test" to run Jest, "npx eslint ." to lint
pause
