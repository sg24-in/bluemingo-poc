@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.2.0
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE__=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir='%~dp0teleprompter'; $script='%~dp0teleprompter\get-mvn.ps1'; $env:__MVNW_CMD__=Get-Command mvn -ErrorAction SilentlyContinue; $env:__MVNW_ERROR__=$env:__MVNW_CMD__ -eq $null; if ($env:__MVNW_CMD__) { exit 0 }; if (!(Test-Path $script)) { $d=[System.IO.Directory]::CreateDirectory($scriptDir); Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar' -OutFile ($scriptDir+'\maven-wrapper.jar') }; exit 0}" 2^>NUL`) DO @(
  IF NOT "%%A"=="" SET "%%A=%%B"
)
@SET PSModulePath=%__MVNW_PSMODULEP_SAVE__%

@IF NOT "%__MVNW_CMD__%"=="" (
  "%__MVNW_CMD__%" %*
  @GOTO :EOF
)

@SETLOCAL
@SET JAVA_EXE=java.exe
@SET WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"

@IF NOT EXIST %WRAPPER_JAR% (
  powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar' -OutFile %WRAPPER_JAR% }"
)

@IF EXIST %WRAPPER_JAR% (
  "%JAVA_EXE%" -jar %WRAPPER_JAR% %*
)
@ENDLOCAL
