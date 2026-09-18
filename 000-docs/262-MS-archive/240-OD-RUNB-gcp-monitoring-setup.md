# GCP Monitoring & Alerting Setup Runbook

**Document ID**: 240-OD-RUNB-gcp-monitoring-setup
**Status**: ACTIVE
**Created**: 2025-11-18
**Phase**: Phase 3 - Monitoring + Agent Deploy Automation (STEP 3)
**Owner**: DevOps/SRE

---

## Purpose

This runbook provides step-by-step instructions to deploy Cloud Monitoring dashboards, alert policies, notification channels, and budget alerts for the Hustle application infrastructure.

**Related Documents**:
- Observability Baseline: `000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md`
- Logging Standard: `000-docs/239-OD-GUID-logging-standard.md`

---

## Prerequisites

### Required Tools
```bash
# Verify gcloud CLI installed
gcloud version

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project hustleapp-production
```

### Required Permissions

**IAM Roles Required**:
- `roles/monitoring.admin` - Create dashboards and alert policies
- `roles/cloudnotifications.admin` - Manage notification channels
- `roles/billing.admin` - Configure budget alerts

**Verify permissions**:
```bash
gcloud projects get-iam-policy hustleapp-production \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL"
```

---

## STEP 1: Configure Notification Channels

### 1.1 Email Notification Channel

**Create email channel** (DevOps team):
```bash
gcloud alpha monitoring channels create \
  --display-name="DevOps Team Email" \
  --type=email \
  --channel-labels=email_address=devops@hustleapp.com \
  --description="Primary notification channel for DevOps team"
```

**Get channel ID** (save for later use):
```bash
EMAIL_CHANNEL_ID=$(gcloud alpha monitoring channels list \
  --filter="displayName='DevOps Team Email'" \
  --format="value(name)")

echo "Email Channel ID: $EMAIL_CHANNEL_ID"
```

### 1.2 Slack Notification Channel (via Webhook)

**Prerequisites**:
1. Create Slack webhook URL for `#hustle-alerts` channel
2. Get webhook URL from Slack workspace settings

**Create Slack channel**:
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

gcloud alpha monitoring channels create \
  --display-name="Slack #hustle-alerts" \
  --type=slack \
  --channel-labels=url="$SLACK_WEBHOOK_URL" \
  --description="Slack channel for real-time alerts"
```

**Get Slack channel ID**:
```bash
SLACK_CHANNEL_ID=$(gcloud alpha monitoring channels list \
  --filter="displayName='Slack #hustle-alerts'" \
  --format="value(name)")

echo "Slack Channel ID: $SLACK_CHANNEL_ID"
```

### 1.3 Verify Notification Channels

```bash
# List all channels
gcloud alpha monitoring channels list

# Test email channel (sends test notification)
gcloud alpha monitoring channels verify $EMAIL_CHANNEL_ID
```

---

## STEP 2: Create Alert Policies

### 2.1 Critical Alerts (Immediate Notification)

#### Alert: High Error Rate (Web App)

**Policy Definition** (`web-app-high-error-rate.yaml`):
```yaml
displayName: "Web App - High Error Rate"
documentation:
  content: |
    ## High Error Rate Detected

    The web application error rate has exceeded 5% for 5 minutes.

    **Investigate**:
    1. Check Cloud Functions logs: `gcloud logging read "severity>=ERROR AND resource.type=cloud_function" --limit=50`
    2. Review Firestore connection status
    3. Verify Firebase Auth service health
    4. Check recent deployments for regressions

    **References**:
    - Runbook: 000-docs/238-MON-SPEC (Section 8: Incident Response)
    - Logs: https://console.cloud.google.com/logs
  mimeType: text/markdown

conditions:
  - displayName: "Error Rate > 5%"
    conditionThreshold:
      filter: |
        resource.type="cloud_function"
        severity>=ERROR
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_MEAN
      comparison: COMPARISON_GT
      thresholdValue: 0.05
      duration: 300s

combiner: OR
enabled: true
notificationChannels:
  - ${EMAIL_CHANNEL_ID}
  - ${SLACK_CHANNEL_ID}

alertStrategy:
  autoClose: 604800s  # 7 days
```

**Deploy**:
```bash
# Replace channel IDs
sed -e "s|\${EMAIL_CHANNEL_ID}|$EMAIL_CHANNEL_ID|g" \
    -e "s|\${SLACK_CHANNEL_ID}|$SLACK_CHANNEL_ID|g" \
    web-app-high-error-rate.yaml | \
gcloud alpha monitoring policies create --policy-from-file=-
```

#### Alert: API Endpoint Unavailable

**Policy Definition** (`api-endpoint-unavailable.yaml`):
```yaml
displayName: "API Endpoint Unavailable"
documentation:
  content: |
    ## API Endpoint Health Check Failures

    The /api/healthcheck endpoint has failed 3 consecutive times.

    **Immediate Actions**:
    1. Check Cloud Functions deployment status
    2. Verify Firebase Hosting configuration
    3. Review recent deployments
    4. Check Cloud Run service health (if applicable)

    **Command**:
    ```bash
    # Check function status
    gcloud functions describe orchestrator --region=us-central1

    # View recent logs
    gcloud functions logs read orchestrator --limit=50
    ```
  mimeType: text/markdown

conditions:
  - displayName: "Healthcheck Failures > 3"
    conditionThreshold:
      filter: |
        resource.type="cloud_function"
        resource.labels.function_name="orchestrator"
        jsonPayload.httpRequest.status>=500
        jsonPayload.httpRequest.requestUrl="/api/healthcheck"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_SUM
      comparison: COMPARISON_GT
      thresholdValue: 3
      duration: 180s

combiner: OR
enabled: true
notificationChannels:
  - ${EMAIL_CHANNEL_ID}
  - ${SLACK_CHANNEL_ID}
```

**Deploy**:
```bash
sed -e "s|\${EMAIL_CHANNEL_ID}|$EMAIL_CHANNEL_ID|g" \
    -e "s|\${SLACK_CHANNEL_ID}|$SLACK_CHANNEL_ID|g" \
    api-endpoint-unavailable.yaml | \
gcloud alpha monitoring policies create --policy-from-file=-
```

#### Alert: Firestore Connection Errors

**Inline deployment** (no YAML file):
```bash
gcloud alpha monitoring policies create \
  --notification-channels=$EMAIL_CHANNEL_ID,$SLACK_CHANNEL_ID \
  --display-name="Firestore Connection Errors" \
  --condition-display-name="Firestore Errors > 10/min" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_firestore_database" AND severity>=ERROR' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_RATE \
  --combiner=OR
```

#### Alert: Agent Engine Unavailable

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$EMAIL_CHANNEL_ID,$SLACK_CHANNEL_ID \
  --display-name="Agent Engine Unavailable" \
  --condition-display-name="Agent Availability < 99.5%" \
  --condition-threshold-value=0.995 \
  --condition-threshold-duration=300s \
  --condition-comparison=COMPARISON_LT \
  --condition-filter='resource.type="aiplatform.googleapis.com/Agent"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_MEAN \
  --combiner=OR
```

#### Alert: High Agent Error Rate

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$EMAIL_CHANNEL_ID,$SLACK_CHANNEL_ID \
  --display-name="Agent High Error Rate" \
  --condition-display-name="Agent Error Rate > 10%" \
  --condition-threshold-value=0.10 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="aiplatform.googleapis.com/Agent" AND severity>=ERROR' \
  --condition-aggregation-alignment-period=300s \
  --condition-aggregation-per-series-aligner=ALIGN_RATE \
  --combiner=OR
```

#### Alert: A2A Protocol Failure

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$EMAIL_CHANNEL_ID,$SLACK_CHANNEL_ID \
  --display-name="A2A Protocol Failure" \
  --condition-display-name="A2A Health Check Failures > 0" \
  --condition-threshold-value=0 \
  --condition-threshold-duration=60s \
  --condition-comparison=COMPARISON_GT \
  --condition-filter='jsonPayload.labels.component="agent" AND jsonPayload.message=~"A2A.*failed"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_SUM \
  --combiner=OR
```

#### Alert: Memory Bank Quota Exhausted

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$EMAIL_CHANNEL_ID,$SLACK_CHANNEL_ID \
  --display-name="Memory Bank Quota Exhausted" \
  --condition-display-name="Memory Count >= 95% of Max" \
  --condition-threshold-value=95 \
  --condition-threshold-duration=300s \
  --condition-comparison=COMPARISON_GT \
  --condition-filter='resource.type="aiplatform.googleapis.com/Agent" AND metric.type="custom.googleapis.com/memory_bank/memory_count_percentage"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_MEAN \
  --combiner=OR
```

### 2.2 Warning Alerts (Batched Notification)

#### Alert: Elevated Latency

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$SLACK_CHANNEL_ID \
  --display-name="Web App High Latency" \
  --condition-display-name="P95 Latency > 3 seconds" \
  --condition-threshold-value=3.0 \
  --condition-threshold-duration=600s \
  --condition-filter='resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/execution_times"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_PERCENTILE_95 \
  --combiner=OR
```

#### Alert: Increased Memory Usage

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$SLACK_CHANNEL_ID \
  --display-name="Cloud Function High Memory" \
  --condition-display-name="Memory Usage > 80%" \
  --condition-threshold-value=0.80 \
  --condition-threshold-duration=900s \
  --condition-filter='resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/user_memory_bytes"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_MEAN \
  --combiner=OR
```

#### Alert: Agent Performance Degradation

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$SLACK_CHANNEL_ID \
  --display-name="Agent Degraded Performance" \
  --condition-display-name="P95 Agent Latency > 3 seconds" \
  --condition-threshold-value=3.0 \
  --condition-threshold-duration=600s \
  --condition-filter='resource.type="aiplatform.googleapis.com/Agent" AND metric.type="aiplatform.googleapis.com/agent/latency"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_PERCENTILE_95 \
  --combiner=OR
```

#### Alert: Code Execution Sandbox Timeout

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$SLACK_CHANNEL_ID \
  --display-name="Code Execution Timeout" \
  --condition-display-name="Execution Timeouts > 5/hour" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=3600s \
  --condition-filter='resource.type="aiplatform.googleapis.com/Agent" AND jsonPayload.message=~".*execution timeout.*"' \
  --condition-aggregation-alignment-period=3600s \
  --condition-aggregation-per-series-aligner=ALIGN_SUM \
  --combiner=OR
```

#### Alert: Production Readiness Score Drop

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$SLACK_CHANNEL_ID \
  --display-name="Agent Readiness Score Drop" \
  --condition-display-name="Readiness Score < 85%" \
  --condition-threshold-value=85 \
  --condition-threshold-duration=300s \
  --condition-comparison=COMPARISON_LT \
  --condition-filter='metric.type="custom.googleapis.com/agent/readiness_score"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_MEAN \
  --combiner=OR
```

### 2.3 NWSL Pipeline Alerts

#### Alert: Workflow Failure

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$EMAIL_CHANNEL_ID,$SLACK_CHANNEL_ID \
  --display-name="NWSL Workflow Failure" \
  --condition-display-name="Workflow Status = Failure" \
  --condition-threshold-value=0 \
  --condition-threshold-duration=60s \
  --condition-comparison=COMPARISON_GT \
  --condition-filter='resource.type="cloud_run_revision" AND jsonPayload.labels.component="pipeline" AND jsonPayload.data.workflow_status="failure"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_SUM \
  --combiner=OR
```

#### Alert: Segment Generation Failure

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$EMAIL_CHANNEL_ID,$SLACK_CHANNEL_ID \
  --display-name="NWSL Segment Generation Failure" \
  --condition-display-name="Failed Segments > 2" \
  --condition-threshold-value=2 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_run_revision" AND jsonPayload.labels.component="pipeline" AND jsonPayload.message=~".*segment.*failed.*"' \
  --condition-aggregation-alignment-period=300s \
  --condition-aggregation-per-series-aligner=ALIGN_SUM \
  --combiner=OR
```

### 2.4 Verify Alert Policies

```bash
# List all alert policies
gcloud alpha monitoring policies list

# Count policies (should be 15)
gcloud alpha monitoring policies list --format="value(name)" | wc -l

# Test notification (triggers test alert)
gcloud alpha monitoring policies test $POLICY_NAME
```

---

## STEP 3: Create Cloud Monitoring Dashboards

### 3.1 Dashboard 1: Web Application Overview

**Dashboard Definition** (`dashboard-web-app.json`):
```json
{
  "displayName": "Hustle Web App Overview",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "API Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_function\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Requests/sec",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "API Latency (p95)",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_function\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_times\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_95"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Latency (ms)",
              "scale": "LINEAR"
            },
            "thresholds": [{
              "value": 2000,
              "color": "YELLOW",
              "direction": "ABOVE"
            }, {
              "value": 3000,
              "color": "RED",
              "direction": "ABOVE"
            }]
          }
        }
      },
      {
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate by Endpoint",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_function\" AND severity>=ERROR",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["jsonPayload.httpRequest.requestUrl"]
                  }
                }
              },
              "plotType": "STACKED_AREA"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Errors/sec",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Firestore Operations",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"firestore_database\" AND metric.type=\"firestore.googleapis.com/document/read_count\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                },
                "plotType": "STACKED_AREA",
                "targetAxis": "Y1"
              },
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"firestore_database\" AND metric.type=\"firestore.googleapis.com/document/write_count\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                },
                "plotType": "STACKED_AREA",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Operations/sec",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
```

**Deploy dashboard**:
```bash
gcloud monitoring dashboards create --config-from-file=dashboard-web-app.json
```

### 3.2 Dashboard 2: Vertex AI Agent Engine Health

**Dashboard Definition** (`dashboard-agent-engine.json`):
```json
{
  "displayName": "Vertex AI Agent Engine Health",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Agent Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"aiplatform.googleapis.com/Agent\" AND metric.type=\"aiplatform.googleapis.com/agent/request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["resource.labels.agent_id"]
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Requests/sec",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "width": 3,
        "height": 4,
        "widget": {
          "title": "Task Success Rate",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"custom.googleapis.com/agent/task_success_rate\"",
                "aggregation": {
                  "alignmentPeriod": "300s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            },
            "gaugeView": {
              "lowerBound": 0.0,
              "upperBound": 1.0
            },
            "thresholds": [
              {
                "value": 0.95,
                "color": "YELLOW",
                "direction": "BELOW"
              },
              {
                "value": 0.99,
                "color": "GREEN",
                "direction": "ABOVE"
              }
            ]
          }
        }
      },
      {
        "xPos": 9,
        "width": 3,
        "height": 4,
        "widget": {
          "title": "Production Readiness",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"custom.googleapis.com/agent/readiness_score\"",
                "aggregation": {
                  "alignmentPeriod": "300s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            },
            "gaugeView": {
              "lowerBound": 0.0,
              "upperBound": 100.0
            },
            "thresholds": [
              {
                "value": 70,
                "color": "RED",
                "direction": "BELOW"
              },
              {
                "value": 85,
                "color": "YELLOW",
                "direction": "BELOW"
              },
              {
                "value": 85,
                "color": "GREEN",
                "direction": "ABOVE"
              }
            ]
          }
        }
      },
      {
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Agent Latency Distribution",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"aiplatform.googleapis.com/Agent\" AND metric.type=\"aiplatform.googleapis.com/agent/latency\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_PERCENTILE_50"
                    }
                  }
                },
                "plotType": "LINE",
                "targetAxis": "Y1"
              },
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"aiplatform.googleapis.com/Agent\" AND metric.type=\"aiplatform.googleapis.com/agent/latency\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_PERCENTILE_95"
                    }
                  }
                },
                "plotType": "LINE",
                "targetAxis": "Y1"
              },
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"aiplatform.googleapis.com/Agent\" AND metric.type=\"aiplatform.googleapis.com/agent/latency\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_PERCENTILE_99"
                    }
                  }
                },
                "plotType": "LINE",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Latency (ms)",
              "scale": "LINEAR"
            },
            "thresholds": [{
              "value": 2000,
              "color": "YELLOW",
              "direction": "ABOVE"
            }, {
              "value": 3000,
              "color": "RED",
              "direction": "ABOVE"
            }]
          }
        }
      },
      {
        "xPos": 6,
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Memory Bank Query Performance",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/memory_bank/query_latency\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_95"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Latency (ms)",
              "scale": "LINEAR"
            },
            "thresholds": [{
              "value": 500,
              "color": "YELLOW",
              "direction": "ABOVE"
            }, {
              "value": 1000,
              "color": "RED",
              "direction": "ABOVE"
            }]
          }
        }
      },
      {
        "yPos": 8,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Code Execution Timeouts",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/code_execution/timeout_count\"",
                  "aggregation": {
                    "alignmentPeriod": "3600s",
                    "perSeriesAligner": "ALIGN_SUM"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Timeouts/hour",
              "scale": "LINEAR"
            },
            "thresholds": [{
              "value": 5,
              "color": "YELLOW",
              "direction": "ABOVE"
            }]
          }
        }
      },
      {
        "xPos": 6,
        "yPos": 8,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "A2A Protocol Health",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/a2a/health_check_status\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Health Status (0=fail, 1=pass)",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
```

**Deploy dashboard**:
```bash
gcloud monitoring dashboards create --config-from-file=dashboard-agent-engine.json
```

### 3.3 Dashboard 3: NWSL Pipeline

**Dashboard Definition** (`dashboard-nwsl-pipeline.json`):
```json
{
  "displayName": "NWSL Video Pipeline",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 4,
        "height": 4,
        "widget": {
          "title": "Workflow Success Rate",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"custom.googleapis.com/nwsl/workflow_success_rate\"",
                "aggregation": {
                  "alignmentPeriod": "300s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            },
            "gaugeView": {
              "lowerBound": 0.0,
              "upperBound": 1.0
            },
            "thresholds": [
              {
                "value": 0.75,
                "color": "RED",
                "direction": "BELOW"
              },
              {
                "value": 0.90,
                "color": "YELLOW",
                "direction": "BELOW"
              },
              {
                "value": 0.90,
                "color": "GREEN",
                "direction": "ABOVE"
              }
            ]
          }
        }
      },
      {
        "xPos": 4,
        "width": 8,
        "height": 4,
        "widget": {
          "title": "Segment Generation Time",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/nwsl/segment_duration\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_95"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Duration (seconds)",
              "scale": "LINEAR"
            },
            "thresholds": [{
              "value": 120,
              "color": "YELLOW",
              "direction": "ABOVE"
            }, {
              "value": 180,
              "color": "RED",
              "direction": "ABOVE"
            }]
          }
        }
      },
      {
        "yPos": 4,
        "width": 12,
        "height": 4,
        "widget": {
          "title": "Storage Upload Success",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"gcs_bucket\" AND metric.type=\"storage.googleapis.com/api/request_count\" AND metric.labels.method=\"INSERT\" AND metric.labels.response_code=\"200\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                },
                "plotType": "LINE",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Uploads/sec",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
```

**Deploy dashboard**:
```bash
gcloud monitoring dashboards create --config-from-file=dashboard-nwsl-pipeline.json
```

### 3.4 Verify Dashboards

```bash
# List all dashboards
gcloud monitoring dashboards list

# Get dashboard URL
gcloud monitoring dashboards list --format="table(name, displayName)"

# Open dashboard in browser
DASHBOARD_ID=$(gcloud monitoring dashboards list --filter="displayName='Hustle Web App Overview'" --format="value(name)")
echo "https://console.cloud.google.com/monitoring/dashboards/custom/$DASHBOARD_ID?project=hustleapp-production"
```

---

## STEP 4: Configure Budget Alerts

### 4.1 Create Production Budget

**Budget configuration**:
```bash
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Hustle Production Monthly Budget" \
  --budget-amount=500 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=75 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100 \
  --all-updates-rule-pubsub-topic=projects/hustleapp-production/topics/budget-alerts \
  --all-updates-rule-monitoring-notification-channels=$EMAIL_CHANNEL_ID
```

**Get billing account ID**:
```bash
# List billing accounts
gcloud billing accounts list

# Set billing account ID
BILLING_ACCOUNT_ID="XXXXXX-YYYYYY-ZZZZZZ"
```

### 4.2 Create Staging Budget

```bash
gcloud billing budgets create \
  --billing-account=$BILLING_ACCOUNT_ID \
  --display-name="Hustle Staging Monthly Budget" \
  --budget-amount=200 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=75 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100 \
  --all-updates-rule-monitoring-notification-channels=$EMAIL_CHANNEL_ID
```

### 4.3 Verify Budgets

```bash
# List all budgets
gcloud billing budgets list --billing-account=$BILLING_ACCOUNT_ID

# Describe specific budget
gcloud billing budgets describe BUDGET_NAME --billing-account=$BILLING_ACCOUNT_ID
```

---

## STEP 5: Enable Cost Attribution Labels

### 5.1 Label Cloud Functions

```bash
# Update orchestrator function
gcloud functions deploy orchestrator \
  --region=us-central1 \
  --update-labels=component=web-app,environment=production

# Update welcome email function
gcloud functions deploy sendWelcomeEmail \
  --region=us-central1 \
  --update-labels=component=web-app,environment=production

# Update trial reminders function
gcloud functions deploy sendTrialReminders \
  --region=us-central1 \
  --update-labels=component=web-app,environment=production
```

### 5.2 Label Firestore Database

```bash
# Firestore labels set via Console (not supported in gcloud yet)
# Navigate to: https://console.firebase.google.com/project/hustleapp-production/firestore
# Add labels: component=web-app, environment=production
```

### 5.3 Label Cloud Storage Buckets

```bash
# Label NWSL pipeline bucket
gsutil label set gs://hustleapp-nwsl-segments \
  '{"component":"pipeline","environment":"production"}'

# Label Firebase Storage bucket
gsutil label set gs://hustleapp-production.appspot.com \
  '{"component":"web-app","environment":"production"}'
```

### 5.4 Verify Labels

```bash
# Check function labels
gcloud functions describe orchestrator --region=us-central1 --format="value(labels)"

# Check storage labels
gsutil label get gs://hustleapp-nwsl-segments
```

---

## STEP 6: Verification & Testing

### 6.1 Test Notification Channels

```bash
# Send test notification to email
gcloud alpha monitoring channels verify $EMAIL_CHANNEL_ID

# Send test notification to Slack
gcloud alpha monitoring channels verify $SLACK_CHANNEL_ID
```

### 6.2 Trigger Test Alerts

**Force error to trigger alert**:
```bash
# Manually trigger Cloud Function error (in development only)
gcloud functions call orchestrator --data='{"intent":"invalid_test_intent"}'

# Check if alert triggered
gcloud alpha monitoring policies list-incidents
```

### 6.3 View Dashboards

```bash
# Get dashboard URLs
gcloud monitoring dashboards list --format="table(name, displayName)"

# Example URL:
# https://console.cloud.google.com/monitoring/dashboards/custom/DASHBOARD_ID?project=hustleapp-production
```

### 6.4 Validate Budget Alerts

```bash
# Check budget status
gcloud billing budgets list --billing-account=$BILLING_ACCOUNT_ID

# View current spend
gcloud billing accounts get-iam-policy $BILLING_ACCOUNT_ID
```

---

## STEP 7: Post-Deployment Checklist

- [ ] **Notification Channels**
  - [ ] Email channel created and verified
  - [ ] Slack channel created and verified
  - [ ] Test notifications received

- [ ] **Alert Policies (15 total)**
  - [ ] 7 critical alerts deployed (immediate notification)
  - [ ] 5 warning alerts deployed (batched notification)
  - [ ] 3 NWSL pipeline alerts deployed
  - [ ] All policies enabled
  - [ ] Test alerts triggered successfully

- [ ] **Dashboards (3 total)**
  - [ ] Web App Overview dashboard created
  - [ ] Vertex AI Agent Engine Health dashboard created
  - [ ] NWSL Pipeline dashboard created
  - [ ] All dashboards accessible via Cloud Console

- [ ] **Budget Alerts**
  - [ ] Production budget ($500/month) configured
  - [ ] Staging budget ($200/month) configured
  - [ ] Email notifications enabled
  - [ ] Thresholds set (50%, 75%, 90%, 100%)

- [ ] **Cost Attribution Labels**
  - [ ] Cloud Functions labeled
  - [ ] Cloud Storage buckets labeled
  - [ ] Firestore database labeled (via Console)
  - [ ] Labels visible in billing reports

- [ ] **Documentation**
  - [ ] Runbook completed and validated
  - [ ] Incident response procedures documented
  - [ ] Dashboard URLs shared with team
  - [ ] Alert escalation matrix communicated

---

## Rollback Procedures

### Disable All Alerts

```bash
# Disable all alert policies (emergency use only)
for policy in $(gcloud alpha monitoring policies list --format="value(name)"); do
  gcloud alpha monitoring policies update $policy --enabled=false
done
```

### Delete Specific Alert

```bash
gcloud alpha monitoring policies delete $POLICY_NAME
```

### Delete Dashboard

```bash
gcloud monitoring dashboards delete $DASHBOARD_ID
```

### Delete Notification Channel

```bash
gcloud alpha monitoring channels delete $CHANNEL_ID
```

---

## Troubleshooting

### Issue: Alerts not triggering

**Check**:
1. Alert policy enabled: `gcloud alpha monitoring policies describe $POLICY_NAME --format="value(enabled)"`
2. Notification channels configured: `gcloud alpha monitoring policies describe $POLICY_NAME --format="value(notificationChannels)"`
3. Filter syntax correct: Test in Cloud Logging Explorer
4. Metric data exists: Query metric in Metrics Explorer

### Issue: Slack notifications not received

**Check**:
1. Webhook URL correct in channel configuration
2. Slack app permissions granted
3. Channel ID correct in alert policy
4. Test notification sent: `gcloud alpha monitoring channels verify $SLACK_CHANNEL_ID`

### Issue: Dashboard shows "No data"

**Check**:
1. Metric names correct (typos)
2. Resource type exists
3. Time range includes data
4. Permissions to view metrics

---

## References

### Internal Documentation
- Observability Baseline: `000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md`
- Logging Standard: `000-docs/239-OD-GUID-logging-standard.md`

### Google Cloud Documentation
- Cloud Monitoring: https://cloud.google.com/monitoring/docs
- Alert Policies: https://cloud.google.com/monitoring/alerts
- Dashboards: https://cloud.google.com/monitoring/dashboards
- Budget Alerts: https://cloud.google.com/billing/docs/how-to/budgets
- Notification Channels: https://cloud.google.com/monitoring/support/notification-options

---

**Document Status**: ACTIVE
**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Next Review**: 2025-12-18
