@REM This batch file opens Windows Terminal with multiple tabs, each set to a specific directory and profile.

wt ^
-p "PowerShell 7" -d "C:\Users\ignac\dev\portfolio_migration\management" --title "Management"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\portfolio_migration\backend" --title "Backend"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\portfolio_migration\frontend" --title "Frontend"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\portfolio_migration" --title "Project"