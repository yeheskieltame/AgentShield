# AgentShield Dashboard — Feature Specification

Dokumen ini menjelaskan konsep, fitur, dan data yang tersedia untuk dashboard AgentShield. Diberikan kepada tim desainer sebagai referensi lengkap sebelum mendesain UI.

---

## Konsep Dashboard

Dashboard adalah **real-time monitoring panel** untuk protokol AgentShield. Fungsinya:

1. **Visualisasi status risiko DeFi** secara real-time (GREEN/YELLOW/RED)
2. **Monitoring aktivitas agent** — siapa melakukan apa, kapan, berapa besar
3. **Tracking compliance** — apakah agent patuh terhadap sinyal
4. **Historical analysis** — trend risiko dari waktu ke waktu
5. **Verifikasi on-chain** — semua data berasal dari Hedera Mirror Node, bukan database internal

Dashboard **read-only** — tidak melakukan transaksi, hanya polling data dari Hedera Mirror Node REST API setiap 3 detik.

---

## Target Pengguna

| Pengguna | Kebutuhan |
|----------|-----------|
| Judge Hackathon | Melihat demo langsung: agent berinteraksi, sinyal berubah, circuit breaker bekerja |
| Protocol Operator | Monitor kesehatan sistem, lihat agent mana yang aktif/compliant |
| DeFi Trader/User | Cek apakah saat ini aman untuk bertransaksi (status GREEN/YELLOW/RED) |
| Developer | Debug dan verifikasi data on-chain (raw HCS messages, TX hashes) |

---

## Halaman & Fitur

### Page 1: Dashboard Utama (Home)

Halaman utama yang menampilkan status real-time seluruh protokol.

#### 1.1 Risk Signal Banner (Hero Section)

Elemen paling dominan di halaman. Menampilkan status sinyal terkini.

| Data | Sumber | Deskripsi |
|------|--------|-----------|
| Signal Level | Signal Topic | **GREEN**, **YELLOW**, atau **RED** — ditampilkan dengan warna besar |
| Risk Score | Signal Topic | Angka 0.00 — 1.00, bisa ditampilkan sebagai gauge/meter |
| LLM Reasoning | Signal Topic | Teks penjelasan dari AI tentang kondisi risiko saat ini |
| Signal Age | Computed | "12 seconds ago", "1 minute ago" — freshness indicator |
| Recommended Action | Signal Topic | "Proceed normally" / "Reduce exposure 50%" / "Abort transactions" |

**Behavior:** Warna background berubah sesuai level (hijau/kuning/merah). Update setiap 3 detik.

#### 1.2 Risk Metrics Panel (4 Cards)

Menampilkan 4 komponen risk score sebagai card/gauge individual.

| Metric | Weight | Deskripsi | Range |
|--------|--------|-----------|-------|
| Volume | 30% | Total USD volume dalam 60 detik terakhir | $0 — $1M+ |
| Asset Concentration | 25% | Seberapa terpusat di satu asset | 0% — 100% |
| Sell Pressure | 25% | Rasio sell vs total intents | 0% — 100% |
| Velocity | 20% | Jumlah intent per detik | 0 — 5+/sec |

Masing-masing card menampilkan:
- Nama metric
- Nilai saat ini
- Gauge atau progress bar (normalized 0-100%)
- Kontribusi ke total score (weight %)

#### 1.3 Intent Feed (Live Stream)

Feed real-time dari semua intent yang dipublish agent ke HCS.

| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| Timestamp | Kapan intent dipublish | `16:45:23` |
| Agent | Nama/role agent | `Sentinel Keeper` |
| Action | Tipe transaksi | `liquidate`, `swap`, `large_transfer` |
| Asset | Pasangan token | `HBAR/USDC` |
| Size | Ukuran dalam USD | `$31,688` |
| Direction | Beli atau jual | `SELL` / `BUY` |
| Urgency | Level urgensi | `LOW` / `MEDIUM` / `HIGH` |

**Behavior:** Feed auto-scroll, intent baru muncul di atas. Warna baris bisa berbeda per urgency. Max ~50 item visible.

#### 1.4 Signal History (Mini Timeline)

Timeline kecil menampilkan riwayat sinyal terakhir (10-20 sinyal).

| Data | Deskripsi |
|------|-----------|
| Timestamp | Kapan sinyal dibroadcast |
| Level | GREEN / YELLOW / RED (color-coded dot) |
| Score | Risk score saat sinyal dibroadcast |
| Intent Count | Berapa intent dalam window saat itu |

Ditampilkan sebagai horizontal timeline atau compact list.

---

### Page 2: Agents

Halaman detail tentang setiap agent yang terdaftar di protokol.

#### 2.1 Agent Registry Table

| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| Name | Display name dari HOL Registry | `AgentShield Coordinator` |
| Role | Fungsi agent | `coordinator` / `sentinel-keeper` / `observer` |
| Type | Autonomous atau Manual | `Autonomous` |
| Operator Account | Account ID utama | `0.0.7275085` |
| HOL Account | Account ID di HOL Registry | `0.0.8299709` |
| Status | Online/offline (berdasarkan aktivitas terakhir) | `Active` (intent 5s ago) |
| Intents Published | Jumlah intent yang dipublish | `47` |
| Compliance Rate | Persentase kepatuhan terhadap sinyal | `100%` |

#### 2.2 Agent Detail (Per Agent)

Klik agent untuk melihat detail:

| Section | Data |
|---------|------|
| Profile | Bio, capabilities, model, creator (dari HOL profile) |
| HOL Topics | Inbound topic, outbound topic, profile topic |
| Recent Intents | 10 intent terakhir dari agent ini |
| Compliance Log | Riwayat bagaimana agent merespons setiap sinyal |
| Balances | Saldo HBAR, $SHIELD token, Reputation NFTs |

#### 2.3 Agent Data Reference

Data lengkap setiap agent yang tersedia untuk ditampilkan:

**Coordinator (0.0.7275085)**

| Field | Value |
|-------|-------|
| HOL Account | `0.0.8299709` |
| HOL Inbound Topic | `0.0.8299711` |
| HOL Outbound Topic | `0.0.8299710` |
| HOL Profile Topic | `0.0.8299713` |
| Registration TX | `0.0.2659396@1773992772.031475119` |

**Sentinel Keeper (0.0.8268231)**

| Field | Value |
|-------|-------|
| HOL Account | `0.0.8299715` |
| HOL Inbound Topic | `0.0.8299717` |
| HOL Outbound Topic | `0.0.8299716` |
| HOL Profile Topic | `0.0.8299719` |
| Registration TX | `0.0.2659396@1773992873.484429300` |
| Behavior | Liquidation bot, SELL only, $10K-$100K, 5-15s intervals |

**Sentinel Arb (0.0.8291404)**

| Field | Value |
|-------|-------|
| HOL Account | `0.0.8299726` |
| HOL Inbound Topic | `0.0.8299730` |
| HOL Outbound Topic | `0.0.8299729` |
| HOL Profile Topic | `0.0.8299732` |
| Registration TX | `0.0.2659396@1773992942.594361605` |
| Behavior | Arbitrage bot, 70% SELL / 30% BUY, $5K-$55K, 3-11s intervals |

**Sentinel Whale (0.0.8291411)**

| Field | Value |
|-------|-------|
| HOL Account | `0.0.8299734` |
| HOL Inbound Topic | `0.0.8299736` |
| HOL Outbound Topic | `0.0.8299735` |
| HOL Profile Topic | `0.0.8299740` |
| Registration TX | `0.0.2659396@1773993057.429652056` |
| Behavior | Whale mover, SELL only, $100K-$600K, 15-45s intervals |

**Observer (0.0.8291431)**

| Field | Value |
|-------|-------|
| HOL Account | `0.0.8299742` |
| HOL Inbound Topic | `0.0.8299746` |
| HOL Outbound Topic | `0.0.8299745` |
| HOL Profile Topic | `0.0.8299748` |
| Registration TX | `0.0.2659396@1773993122.791638818` |
| Behavior | Human-facing chat, reports risk status |

---

### Page 3: Risk Analytics

Halaman analitik untuk melihat trend risiko dari waktu ke waktu.

#### 3.1 Risk Score Chart (Time Series)

Grafik garis yang menampilkan risk score dari waktu ke waktu.

| Data | Deskripsi |
|------|-----------|
| X-axis | Waktu (menit/jam) |
| Y-axis | Risk score 0.0 — 1.0 |
| Color zones | Background: hijau (0-0.39), kuning (0.4-0.69), merah (0.7-1.0) |
| Data points | Setiap sinyal yang dibroadcast |

#### 3.2 Volume Chart

Bar chart yang menampilkan volume transaksi per interval waktu.

| Data | Deskripsi |
|------|-----------|
| X-axis | Waktu (per menit atau per 5 menit) |
| Y-axis | Total USD volume |
| Color | Per action type (liquidate, swap, large_transfer) |

#### 3.3 Signal Distribution

Pie chart atau donut chart yang menampilkan distribusi sinyal.

| Data | Deskripsi |
|------|-----------|
| GREEN count | Berapa kali sinyal GREEN dibroadcast |
| YELLOW count | Berapa kali sinyal YELLOW |
| RED count | Berapa kali sinyal RED |
| Time range | Selectable: last 5min / 15min / 1hr / all |

#### 3.4 Agent Activity Heatmap

Heatmap yang menampilkan kapan agent aktif dan seberapa banyak.

| Data | Deskripsi |
|------|-----------|
| Rows | Agent names |
| Columns | Time buckets (per menit) |
| Color intensity | Jumlah intent dalam bucket tersebut |

---

### Page 4: On-Chain Explorer

Halaman untuk verifikasi data on-chain langsung dari Hedera.

#### 4.1 HCS Topics Browser

| Topic | ID | Deskripsi |
|-------|----|-----------|
| Intent Topic | `0.0.8291524` | Browse semua intent messages |
| Signal Topic | `0.0.8291525` | Browse semua signal messages |
| Reputation Topic | `0.0.8291526` | Browse semua reputation events |

Untuk setiap topic, tampilkan:
- List messages dengan timestamp, sender, raw JSON content
- Link ke HashScan untuk verifikasi

#### 4.2 Token Info

| Token | ID | Info |
|-------|----|------|
| $SHIELD | `0.0.8291529` | Supply, holders, transfers |
| Reputation NFT | `0.0.8291530` | Minted NFTs, ownership |

#### 4.3 Transaction Lookup

Input field untuk lookup transaction by ID. Tampilkan detail transaksi dari Mirror Node.

---

## Data Sources & API

Dashboard hanya membutuhkan **Hedera Mirror Node REST API** (no backend database).

### Base URL

```
https://testnet.mirrornode.hedera.com/api/v1
```

### Endpoints yang Digunakan

| Endpoint | Kegunaan | Polling |
|----------|----------|---------|
| `GET /topics/{topicId}/messages?timestamp=gt:{ts}&limit=25&order=asc` | Stream HCS messages | Setiap 3 detik |
| `GET /tokens/{tokenId}` | Info token ($SHIELD, Rep NFT) | On-demand |
| `GET /tokens/{tokenId}/balances` | Saldo token per account | On-demand |
| `GET /tokens/{tokenId}/nfts` | List NFT yang di-mint | On-demand |
| `GET /accounts/{accountId}` | Info account (saldo HBAR, memo) | On-demand |
| `GET /transactions/{txId}` | Detail transaksi | On-demand |

### Polling Strategy

```
Setiap 3 detik:
  1. Poll Intent Topic -> decode base64 -> parse JSON -> tampilkan di Intent Feed
  2. Poll Signal Topic -> decode base64 -> parse JSON -> update Risk Banner + Metrics

Setiap 30 detik:
  3. Fetch account balances (HBAR + SHIELD) untuk semua agent

On-demand (user click):
  4. Fetch token info, NFT list, transaction details
```

### Message Decoding

Setiap HCS message dari Mirror Node API:
1. Field `message` berisi **base64-encoded** string
2. Decode base64 -> JSON string
3. Parse JSON -> objek dengan field `p: 'agentshield'`, `op: 'intent'|'signal'|'reputation'`
4. Filter berdasarkan `op` untuk route ke komponen yang tepat

---

## HCS Message Schemas

### Intent (op: "intent")

```json
{
  "p": "agentshield",
  "op": "intent",
  "agent_id": "0.0.8268231",
  "action": "liquidate",
  "asset": "HBAR/USDT",
  "size_usd": 31688.37,
  "direction": "sell",
  "urgency": "high",
  "timestamp": 1773992700000
}
```

### Signal (op: "signal")

```json
{
  "p": "agentshield",
  "op": "signal",
  "level": "YELLOW",
  "risk_score": 0.55,
  "reasoning": "Risk is moderate due to high sell pressure of 100%...",
  "affected_assets": ["HBAR/USDC"],
  "recommended_delay_ms": 5000,
  "metrics": {
    "totalIntents": 3,
    "totalVolumeUsd": 449171.25,
    "sellPressure": 1.0,
    "assetConcentration": 0.67,
    "topAsset": "HBAR/USDC",
    "velocityPerSecond": 0.1,
    "riskScore": 0.55
  },
  "timestamp": 1773992703000
}
```

### Reputation (op: "reputation")

```json
{
  "p": "agentshield",
  "op": "reputation",
  "agent_id": "0.0.8268231",
  "event": "compliance",
  "signal_level": "YELLOW",
  "complied": true,
  "trust_score": 0.95,
  "timestamp": 1773992710000
}
```

---

## Desain Notes untuk Tim Desainer

### Prioritas Visual

1. **Risk Signal Banner harus paling dominan** — pengguna harus langsung tahu GREEN/YELLOW/RED dalam < 1 detik
2. **Intent Feed harus terasa "hidup"** — auto-update, animasi masuk untuk item baru
3. **Metrics panel harus scannable** — 4 angka yang bisa dibaca sekilas
4. **Warna adalah informasi** — hijau = aman, kuning = waspada, merah = bahaya (konsisten di seluruh UI)

### Color Palette Suggestion

| Level | Primary | Background | Text |
|-------|---------|------------|------|
| GREEN | `#22C55E` | `#F0FDF4` | `#166534` |
| YELLOW | `#EAB308` | `#FEFCE8` | `#854D0E` |
| RED | `#EF4444` | `#FEF2F2` | `#991B1B` |
| Neutral | `#6366F1` (Hedera purple) | `#0F172A` (dark bg) | `#F8FAFC` |

### Responsiveness

- Desktop-first (monitoring dashboard biasanya di layar besar)
- Minimal mobile support (Risk Banner + Intent Feed saja)

### Tech Stack (Sudah ditentukan)

- **Next.js** (React framework)
- **Tailwind CSS** (styling)
- Data fetching langsung dari Mirror Node REST API (no backend)

---

## Summary: Fitur per Halaman

| Halaman | Fitur Utama | Data Source |
|---------|------------|-------------|
| **Home** | Risk Banner, 4 Metric Cards, Intent Feed, Signal Timeline | Signal Topic + Intent Topic (3s polling) |
| **Agents** | Agent Registry Table, Agent Detail, Compliance Rate | HOL Registry + Intent/Signal Topics |
| **Analytics** | Risk Score Chart, Volume Chart, Signal Distribution, Heatmap | Signal Topic (historical) |
| **Explorer** | Topic Browser, Token Info, TX Lookup | Mirror Node REST API (on-demand) |
