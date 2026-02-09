# =====================================================
# ProGuard Rules for MES Production Confirmation POC
# Spring Boot WAR with Angular frontend
# =====================================================

# Keep application entry point and Spring Boot main class
-keep class com.mes.production.MesProductionApplication { *; }
-keep class com.mes.production.ServletInitializer { *; }

# =====================================================
# Spring Framework - Keep all Spring-annotated classes
# =====================================================

# Keep all classes with Spring annotations
-keep @org.springframework.stereotype.Controller class * { *; }
-keep @org.springframework.stereotype.Service class * { *; }
-keep @org.springframework.stereotype.Repository class * { *; }
-keep @org.springframework.stereotype.Component class * { *; }
-keep @org.springframework.context.annotation.Configuration class * { *; }
-keep @org.springframework.boot.autoconfigure.SpringBootApplication class * { *; }
-keep @org.springframework.web.bind.annotation.RestController class * { *; }
-keep @org.springframework.web.bind.annotation.ControllerAdvice class * { *; }

# Keep all REST controller methods with their annotations
-keepclassmembers class * {
    @org.springframework.web.bind.annotation.RequestMapping *;
    @org.springframework.web.bind.annotation.GetMapping *;
    @org.springframework.web.bind.annotation.PostMapping *;
    @org.springframework.web.bind.annotation.PutMapping *;
    @org.springframework.web.bind.annotation.DeleteMapping *;
    @org.springframework.web.bind.annotation.PatchMapping *;
}

# Keep Spring dependency injection annotations
-keepclassmembers class * {
    @org.springframework.beans.factory.annotation.Autowired *;
    @org.springframework.beans.factory.annotation.Value *;
    @javax.inject.Inject *;
    @jakarta.inject.Inject *;
}

# =====================================================
# Controllers - Keep all controllers intact
# =====================================================
-keep class com.mes.production.controller.** { *; }

# =====================================================
# DTOs - Keep all DTOs for JSON serialization
# =====================================================
-keep class com.mes.production.dto.** { *; }
-keepclassmembers class com.mes.production.dto.** {
    *;
}

# =====================================================
# JPA Entities - Keep all entities and their members
# =====================================================
-keep @jakarta.persistence.Entity class * { *; }
-keep @jakarta.persistence.Embeddable class * { *; }
-keep @jakarta.persistence.MappedSuperclass class * { *; }
-keep class com.mes.production.entity.** { *; }
-keepclassmembers class com.mes.production.entity.** {
    *;
}

# =====================================================
# Repositories - Keep Spring Data repositories
# =====================================================
-keep interface com.mes.production.repository.** { *; }
-keep class com.mes.production.repository.** { *; }

# =====================================================
# Security Configuration - Keep security classes
# =====================================================
-keep class com.mes.production.security.** { *; }
-keep class com.mes.production.config.** { *; }

# =====================================================
# Jackson JSON Serialization
# =====================================================

# Keep Jackson annotations
-keepclassmembers class * {
    @com.fasterxml.jackson.annotation.* *;
}

# Keep classes with JsonProperty annotations
-keepclassmembers class * {
    @com.fasterxml.jackson.annotation.JsonProperty *;
    @com.fasterxml.jackson.annotation.JsonIgnore *;
    @com.fasterxml.jackson.annotation.JsonFormat *;
}

# Keep getters/setters for JSON (de)serialization
-keepclassmembers class com.mes.production.dto.** {
    public <methods>;
}

# =====================================================
# Lombok Generated Code
# =====================================================

# Keep Lombok-generated methods
-keepclassmembers class * {
    @lombok.* *;
}

# Keep builder pattern methods
-keepclassmembers class * {
    public static ** builder();
    public ** build();
}

# =====================================================
# Validation Annotations
# =====================================================
-keepclassmembers class * {
    @jakarta.validation.constraints.* *;
    @javax.validation.constraints.* *;
}

# =====================================================
# Servlet API
# =====================================================
-keep class * extends jakarta.servlet.http.HttpServlet { *; }

# =====================================================
# General Settings
# =====================================================

# Don't warn about missing classes from optional dependencies
-dontwarn org.springframework.**
-dontwarn jakarta.**
-dontwarn javax.**
-dontwarn org.hibernate.**
-dontwarn com.fasterxml.jackson.**
-dontwarn lombok.**
-dontwarn org.postgresql.**
-dontwarn com.h2database.**
-dontwarn io.jsonwebtoken.**

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve source file names and line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# Keep annotations for reflection
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Optimization settings
-optimizationpasses 3
-allowaccessmodification
-mergeinterfacesaggressively
-overloadaggressively

# Don't obfuscate public API
-keepparameternames
-renamesourcefileattribute SourceFile
