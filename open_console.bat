@REM This batch file opens Windows Terminal with multiple tabs, each set to a specific directory and profile.

wt ^
-p "PowerShell 7" -d "C:\Users\ignac\dev\task_management\management" --title "TM Management"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\task_management\backend" --title "TM Backend"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\task_management\frontend" --title "TM Frontend"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\task_management" --title "TM Project"