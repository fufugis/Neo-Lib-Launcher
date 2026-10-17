; Compiler-only verification. Do not run this fixture installer.
!define APP_FILENAME "NEO-LIB"
Name "NEO-LIB callback compile fixture"
OutFile "${NEOLIB_TEST_OUTPUT}"
InstallDir "$TEMP\neolib-callback-compile-fixture"
RequestExecutionLevel user
!include "..\..\build\installer.nsh"
Section
  !insertmacro customInstall
SectionEnd
