' اجرای مخفی نگهبان ماکان (بدون باز کردن مرورگر)
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = root
WshShell.Run "node scripts\run.js", 0, False
