; ---------------------------------------------------------------
; NEO-LIB custom NSIS include
;
; Root cause of the v1.2.3 bug: electron-builder's stock
; MUI_FINISHPAGE_RUN checkbox fires a "StartApp" helper that
; occasionally fails silently on Windows 10/11 (particularly when
; the installer was launched via UAC / right-click "Run as admin").
;
; Fix: bypass the flaky checkbox entirely. `customInstall` is a hook
; that electron-builder runs after every file is copied and the app
; is fully wired. We ExecShell the primary exe from there — ExecShell
; drops elevation to the current interactive user's shell process,
; so the app always launches non-elevated (which is what NEO-LIB
; expects — writes to %APPDATA%, no admin bits).
;
; The old MUI_FINISHPAGE_RUN checkbox is disabled from package.json
; (`runAfterFinish: false`); this include handles launch instead.
; ---------------------------------------------------------------

; Current policy supersedes the historical immediate-launch workaround above.
; Only .onGUIEnd (after the UI closes) may launch; silent installs never do.
; electron-builder loads this include before its own LogicLib helpers.
!include "LogicLib.nsh"
Var NeoLibInstallComplete

!macro customInstall
  ; Notify Explorer after an upgrade now that the EXE/shortcut icon is ready.
  ; This does not delete icon caches, alter pinned items, or touch user data.
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0x0000, p 0, p 0)'
  ${IfNot} ${Silent}
    StrCpy $NeoLibInstallComplete "1"
  ${EndIf}
!macroend

Function .onGUIEnd
  ${If} $NeoLibInstallComplete == "1"
  ${AndIfNot} ${Silent}
    StrCpy $NeoLibInstallComplete "0"
    ; APP_FILENAME is supplied on the compiler command line; the later
    ; APP_EXECUTABLE_FILENAME alias is not available in this early include.
    IfFileExists "$INSTDIR\${APP_FILENAME}.exe" 0 done
    ExecShell "open" "$INSTDIR\${APP_FILENAME}.exe"
  ${EndIf}
  done:
FunctionEnd

!macro customUnInstall
!macroend
