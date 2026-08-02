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

!macro customInstall
  ${IfNot} ${Silent}
    ExecShell "open" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  ${EndIf}
!macroend

!macro customUnInstall
!macroend
