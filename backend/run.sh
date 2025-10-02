#!/bin/bash
export JAVA_HOME=$(/usr/libexec/java_home -v 22)
mvn spring-boot:run
