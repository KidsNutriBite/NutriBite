@echo off
REM Replace the secret MongoDB URI in all JS/MJS files during git filter-branch tree traversal
for /r %%f in (*.js *.mjs) do (
    powershell -Command "(Get-Content '%%f' -Raw) -replace 'mongodb\+srv://pv839910_db_user:Pavan3107@cluster0\.qf9utna\.mongodb\.net/nutrikid\?appName=Cluster0', 'process.env.MONGO_URI' | Set-Content '%%f'"
)
