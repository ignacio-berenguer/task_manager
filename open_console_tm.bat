@REM This batch file opens Windows Terminal with multiple tabs, each set to a specific directory and profile.

wt ^
-p "PowerShell 7" -d "C:\Users\ignac\dev\task_manager\management" --title "TM Management"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\task_manager\backend" --title "TM Backend"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\task_manager\frontend" --title "TM Frontend"^
 ; new-tab -p "PowerShell 7" -d "C:\Users\ignac\dev\task_manager" --title "TM Project"