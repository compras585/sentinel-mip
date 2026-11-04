package com.fumizaymas.sentinelmip

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.room.*
import androidx.work.*
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

private const val PREFS = "sentinel_secure_session"
private const val TOKEN_KEY = "access_token"
private const val REFRESH_KEY = "refresh_token"

@Entity(tableName = "pending_inspections", indices = [Index(value = ["clientMutationId"], unique = true)])
data class PendingInspection(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val stationCode: String,
    val pestType: String,
    val activity: String,
    val quantity: Int,
    val observations: String,
    val clientMutationId: String = UUID.randomUUID().toString(),
    val createdAt: Long = System.currentTimeMillis()
)

@Dao
interface InspectionDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun enqueue(item: PendingInspection)
    @Query("SELECT * FROM pending_inspections ORDER BY createdAt")
    suspend fun all(): List<PendingInspection>
    @Query("DELETE FROM pending_inspections WHERE id = :id")
    suspend fun remove(id: String)
    @Query("SELECT COUNT(*) FROM pending_inspections")
    suspend fun count(): Int
}

@Database(entities = [PendingInspection::class], version = 1, exportSchema = true)
abstract class SentinelDatabase : RoomDatabase() {
    abstract fun inspectionDao(): InspectionDao
    companion object {
        @Volatile private var INSTANCE: SentinelDatabase? = null
        fun get(context: android.content.Context): SentinelDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(context, SentinelDatabase::class.java, "sentinel-mip.db").build().also { INSTANCE = it }
            }
    }
}

object SessionStore {
    private fun prefs(context: android.content.Context) =
        EncryptedSharedPreferences.create(
            context,
            PREFS,
            MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    fun token(context: android.content.Context): String? = prefs(context).getString(TOKEN_KEY, null)
    fun refreshToken(context: android.content.Context): String? = prefs(context).getString(REFRESH_KEY, null)
    fun save(context: android.content.Context, access: String, refresh: String) {
        // Commit together so a process death cannot leave mismatched token pairs.
        prefs(context).edit().putString(TOKEN_KEY, access).putString(REFRESH_KEY, refresh).commit()
    }
    fun clear(context: android.content.Context) { prefs(context).edit().remove(TOKEN_KEY).remove(REFRESH_KEY).commit() }
}

object SentinelApi {
    private val client = OkHttpClient.Builder().callTimeout(30, TimeUnit.SECONDS).build()
    private val jsonType = "application/json; charset=utf-8".toMediaType()

    data class TokenPair(val access: String, val refresh: String)

    private fun tokenRequest(path: String, bodyJson: JSONObject): TokenPair {
        val request = Request.Builder().url(BuildConfig.API_BASE_URL + path)
            .post(bodyJson.toString().toRequestBody(jsonType)).build()
        client.newCall(request).execute().use { response ->
            val payload = response.body?.string().orEmpty()
            if (response.code == 401) throw UnauthorizedRefreshException()
            if (!response.isSuccessful) throw IllegalStateException("Solicitud de sesión fallida (${response.code})")
            val json = JSONObject(payload)
            return TokenPair(json.getString("accessToken"), json.getString("refreshToken"))
        }
    }

    fun login(email: String, password: String): TokenPair =
        tokenRequest("auth/login", JSONObject().put("email", email).put("password", password))

    fun refresh(refreshToken: String): TokenPair =
        tokenRequest("auth/refresh", JSONObject().put("refreshToken", refreshToken))

    fun logout(refreshToken: String) {
        val request = Request.Builder().url(BuildConfig.API_BASE_URL + "auth/logout")
            .post(JSONObject().put("refreshToken", refreshToken).toString().toRequestBody(jsonType)).build()
        client.newCall(request).execute().use { /* best effort server-side revocation */ }
    }

    fun sendInspection(item: PendingInspection, token: String) {
        val body = JSONObject()
            .put("stationKey", item.stationCode)
            .put("clientMutationId", item.clientMutationId)
            .put("pestType", item.pestType)
            .put("activity", item.activity)
            .put("quantity", item.quantity)
            .put("observations", item.observations)
            .toString().toRequestBody(jsonType)
        val request = Request.Builder()
            .url(BuildConfig.API_BASE_URL + "inspections")
            .header("Authorization", "Bearer $token")
            .post(body)
            .build()
        client.newCall(request).execute().use { response ->
            if (response.code == 401) throw UnauthorizedSyncException()
            if (!response.isSuccessful) throw IllegalStateException("Error de sincronización (${response.code})")
        }
    }
}
class UnauthorizedSyncException : Exception()
class UnauthorizedRefreshException : Exception()

class InspectionSyncWorker(appContext: android.content.Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        var token = SessionStore.token(applicationContext) ?: return@withContext Result.failure()
        val dao = SentinelDatabase.get(applicationContext).inspectionDao()
        try {
            for (item in dao.all()) {
                try {
                    SentinelApi.sendInspection(item, token)
                } catch (_: UnauthorizedSyncException) {
                    val refresh = SessionStore.refreshToken(applicationContext)
                        ?: run { SessionStore.clear(applicationContext); return@withContext Result.failure() }
                    val pair = try {
                        SentinelApi.refresh(refresh)
                    } catch (_: UnauthorizedRefreshException) {
                        SessionStore.clear(applicationContext)
                        return@withContext Result.failure()
                    } catch (_: Exception) {
                        // Transient network/server errors must not destroy a still-valid refresh token.
                        return@withContext Result.retry()
                    }
                    SessionStore.save(applicationContext, pair.access, pair.refresh)
                    token = pair.access
                    // Retry this exact idempotent inspection once with the new access token.
                    try {
                        SentinelApi.sendInspection(item, token)
                    } catch (_: UnauthorizedSyncException) {
                        SessionStore.clear(applicationContext)
                        return@withContext Result.failure()
                    }
                }
                dao.remove(item.id)
            }
            Result.success()
        } catch (_: UnauthorizedSyncException) {
            SessionStore.clear(applicationContext)
            Result.failure()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}

fun scheduleInspectionSync(context: android.content.Context) {
    val constraints = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
    val request = OneTimeWorkRequestBuilder<InspectionSyncWorker>()
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
        .build()
    WorkManager.getInstance(context).enqueueUniqueWork("sentinel-inspection-sync", ExistingWorkPolicy.KEEP, request)
}

@OptIn(ExperimentalMaterial3Api::class)
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val dao = SentinelDatabase.get(applicationContext).inspectionDao()
        setContent {
            MaterialTheme {
                var token by remember { mutableStateOf(SessionStore.token(applicationContext)) }
                var email by remember { mutableStateOf("") }
                var password by remember { mutableStateOf("") }
                var station by remember { mutableStateOf("") }
                var pest by remember { mutableStateOf("Roedores") }
                var activity by remember { mutableStateOf("Sin actividad") }
                var quantity by remember { mutableStateOf("0") }
                var observations by remember { mutableStateOf("") }
                var message by remember { mutableStateOf("Preparado") }
                var pendingCount by remember { mutableIntStateOf(0) }

                LaunchedEffect(Unit) { pendingCount = dao.count() }

                Scaffold(topBar = { TopAppBar(title = { Text("Sentinel MIP · FUMIZA Y MÁS") }) }) { padding ->
                    Column(Modifier.padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        if (token.isNullOrBlank()) {
                            Text("Iniciar sesión", style = MaterialTheme.typography.titleLarge)
                            OutlinedTextField(email, { email = it }, label = { Text("Correo") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(password, { password = it }, label = { Text("Contraseña") }, modifier = Modifier.fillMaxWidth())
                            Button(onClick = {
                                lifecycleScope.launch {
                                    message = "Validando acceso…"
                                    try {
                                        val received = withContext(Dispatchers.IO) { SentinelApi.login(email.trim(), password) }
                                        SessionStore.save(applicationContext, received.access, received.refresh)
                                        token = received.access
                                        password = ""
                                        message = "Sesión iniciada"
                                        scheduleInspectionSync(applicationContext)
                                    } catch (e: Exception) { message = e.message ?: "Error de acceso" }
                                }
                            }, modifier = Modifier.fillMaxWidth()) { Text("Entrar") }
                        } else {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Sesión activa")
                                TextButton(onClick = {
                                    lifecycleScope.launch {
                                        val refresh = SessionStore.refreshToken(applicationContext)
                                        withContext(Dispatchers.IO) { if (!refresh.isNullOrBlank()) runCatching { SentinelApi.logout(refresh) } }
                                        SessionStore.clear(applicationContext); token = null; message = "Sesión cerrada"
                                    }
                                }) { Text("Salir") }
                            }
                            Text("Registro de inspección offline", style = MaterialTheme.typography.titleLarge)
                            OutlinedTextField(station, { station = it }, label = { Text("Código de estación") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(pest, { pest = it }, label = { Text("Plaga") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(activity, { activity = it }, label = { Text("Actividad") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(quantity, { quantity = it.filter(Char::isDigit) }, label = { Text("Cantidad") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(observations, { observations = it }, label = { Text("Observaciones") }, modifier = Modifier.fillMaxWidth())
                            Button(onClick = {
                                if (station.isNotBlank() && pest.isNotBlank()) {
                                    val item = PendingInspection(stationCode = station.trim(), pestType = pest.trim(),
                                        activity = activity.trim(), quantity = quantity.toIntOrNull() ?: 0,
                                        observations = observations.trim())
                                    lifecycleScope.launch {
                                        dao.enqueue(item)
                                        pendingCount = dao.count()
                                        message = "Guardada localmente. Pendientes: $pendingCount"
                                        scheduleInspectionSync(applicationContext)
                                    }
                                } else message = "Ingrese el código de estación y la plaga."
                            }, modifier = Modifier.fillMaxWidth()) { Text("Guardar inspección") }
                            OutlinedButton(onClick = { scheduleInspectionSync(applicationContext); message = "Sincronización programada" }, modifier = Modifier.fillMaxWidth()) {
                                Text("Sincronizar ahora")
                            }
                        }
                        Text("Pendientes: $pendingCount")
                        Text(message, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}
