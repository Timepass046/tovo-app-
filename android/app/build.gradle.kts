plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.tovoapp.productivity"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.tovoapp.productivity"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    androidResources {
        // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
        // Default: https://android.googlesource.com/platform/frameworks/base/+/282e181b58cf72b6ca770dc7ca5f91f135444502/tools/aapt/AaptAssets.cpp#61
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~"
    }

    buildTypes {
        release {
            optimization {
                enable = true
                packageScope = setOf("androidx.**", "kotlin.**", "kotlinx.**")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

repositories {
    flatDir {
        dirs("../capacitor-cordova-android-plugins/src/main/libs", "libs")
    }
}

dependencies {
    implementation(fileTree(mapOf("include" to listOf("*.jar"), "dir" to "libs")))
    implementation(libs.activity.ktx)
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.material)
    implementation(libs.coordinatorlayout)
    implementation(libs.core.splashscreen)
    implementation(project(":capacitor-android"))
    implementation(project(":capacitor-cordova-android-plugins"))
    testImplementation(libs.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)
}

apply(from = "capacitor.build.gradle")

val servicesJSON = file("google-services.json")
if (servicesJSON.exists() && servicesJSON.readText().isNotBlank()) {
    apply(plugin = "com.google.gms.google-services")
} else {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
