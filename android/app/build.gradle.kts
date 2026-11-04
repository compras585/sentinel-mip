plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.fumizaymas.sentinelmip"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.fumizaymas.sentinelmip"
        minSdk = 26
        targetSdk = 35
        versionCode = 21
        versionName = "2.1.0"
        val apiBaseUrl = (project.findProperty("SENTINEL_API_BASE_URL") as String?)
            ?: "https://api.example.invalid/api/"
        require(apiBaseUrl.startsWith("https://")) {
            "SENTINEL_API_BASE_URL debe usar HTTPS; no se permite HTTP en builds de Sentinel MIP."
        }
        require(apiBaseUrl.endsWith("/")) {
            "SENTINEL_API_BASE_URL debe terminar en / (ej. https://servidor/api/)."
        }
        buildConfigField("String", "API_BASE_URL", "\"${apiBaseUrl}\"")
    }
    buildFeatures { compose = true; buildConfig = true }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
