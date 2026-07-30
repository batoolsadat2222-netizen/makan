' اجرای خودکار با روشن شدن ویندوز — فقط سرور، بدون مرورگر
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run """" & root & "\start-daemon.vbs""", 0, False
