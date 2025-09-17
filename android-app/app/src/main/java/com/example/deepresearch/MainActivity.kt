package com.example.deepresearch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                App()
            }
        }
    }
}

@Composable
fun App() {
    var baseUrl by remember { mutableStateOf("http://10.0.2.2:8000") }
    var objective by remember { mutableStateOf(TextFieldValue("")) }
    var jobId by remember { mutableStateOf<String?>(null) }
    var status by remember { mutableStateOf("-") }
    var stage by remember { mutableStateOf("-") }
    var progress by remember { mutableStateOf(0) }
    var results by remember { mutableStateOf<JSONObject?>(null) }

    val client = remember { OkHttpClient() }

    LaunchedEffect(jobId) {
        if (jobId != null) {
            while (true) {
                try {
                    val req = Request.Builder().url("$baseUrl/api/job/$jobId").get().build()
                    client.newCall(req).execute().use { resp ->
                        if (resp.isSuccessful) {
                            val data = JSONObject(resp.body!!.string())
                            status = data.getString("status")
                            stage = data.optString("current_stage", "-")
                            progress = data.optInt("progress", 0)
                            if (status == "completed") {
                                val rreq = Request.Builder().url("$baseUrl/api/results/$jobId").get().build()
                                client.newCall(rreq).execute().use { rresp ->
                                    if (rresp.isSuccessful) {
                                        results = JSONObject(rresp.body!!.string())
                                    }
                                }
                                break
                            }
                            if (status == "failed") break
                        }
                    }
                } catch (_: Exception) {}
                delay(1000)
            }
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Deep Research Agent") }) }) { padding ->
        Column(Modifier.padding(padding).padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(value = baseUrl, onValueChange = { baseUrl = it }, label = { Text("Backend URL") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = objective, onValueChange = { objective = it }, label = { Text("Objective") }, modifier = Modifier.fillMaxWidth())
            Button(enabled = objective.text.isNotBlank() && jobId == null, onClick = {
                val json = JSONObject().apply {
                    put("objective", objective.text)
                    put("research_questions", emptyList<String>())
                    put("include_keywords", emptyList<String>())
                    put("exclude_keywords", emptyList<String>())
                    put("date_from", JSONObject.NULL)
                    put("date_to", JSONObject.NULL)
                    put("sources", listOf("crossref", "openalex", "pubmed", "arxiv"))
                    put("max_results", 50)
                }
                val body = json.toString().toRequestBody("application/json".toMediaType())
                val req = Request.Builder().url("$baseUrl/api/start").post(body).build()
                try {
                    client.newCall(req).execute().use { resp ->
                        if (resp.isSuccessful) {
                            val data = JSONObject(resp.body!!.string())
                            jobId = data.getString("job_id")
                        }
                    }
                } catch (_: Exception) {}
            }) { Text("Start Research") }

            if (jobId != null && results == null) {
                LinearProgressIndicator(progress = progress / 100f, modifier = Modifier.fillMaxWidth())
                Text("Status: $status | Stage: $stage | $progress%")
            }

            results?.let { r ->
                Text("Results", style = MaterialTheme.typography.titleLarge)
                val papers = r.getJSONArray("papers")
                LazyColumn(Modifier.weight(1f)) {
                    items((0 until papers.length()).toList()) { idx ->
                        val p = papers.getJSONObject(idx)
                        Column(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                            Text(p.getString("title"), style = MaterialTheme.typography.titleMedium)
                            Text(p.optString("journal", p.getString("source")))
                        }
                    }
                }
            }
        }
    }
}