# Scanner2HTTP

HTTP service that exposes barcode scanners connected via a serial (COM) port
over a simple REST API.

**Why?** Barcode scanners are usually connected to one machine as keyboard
emulators. Scanner2HTTP lets you share a scanner with other apps and machines:
poll scan results from a web kiosk, a cash register, a warehouse acceptance
terminal — anything that can make an HTTP request.

- USB/serial scanners are auto-detected every 5 seconds
- Devices are filtered by a whitelist — unknown devices are ignored
- Long-polling API: request a scan and wait for the result (up to 30 s)
- Session locking (`permanent` / `parallel` / `on_demand` / `daemon`) to control
  who owns the scanner
- Interactive OpenAPI docs (Swagger UI) in development mode

## Requirements

- Node.js >= 20
- A barcode scanner connected via a serial (USB-COM) port
- Build tools for the native `serialport` module if a prebuilt binary is not
  available for your platform ([docs](https://serialport.io/docs/guide-installation))

## Quick start

```bash
git clone https://github.com/Dxd4/Scanner2HTTP.git
cd Scanner2HTTP
npm install

# 1. Configure the environment
cp .env.example .env
# Edit .env and set SCANNER_NAMESPACE to any unique UUID v4:
#   node -e "console.log(require('crypto').randomUUID())"

# 2. Configure devices
cp whitelist.example.json whitelist.json
cp configs.example.json configs.json
# Optionally adjust configs.json for your scanner (baud rate, etc.)

# 3. Run
npm run dev
```

The service starts on `http://localhost:55100` by default.

## Discovering your scanner

Plug in the scanner, start the service and ask it what it sees:

```bash
curl http://localhost:55100/ports
```

```json
[
  {
    "path": "COM5",
    "manufacturer": "wch.cn",
    "serialNumber": "SN12345678",
    "vendorId": "1A86",
    "productId": "7523",
    "pnpId": "USB\\VID_1A86&PID_7523\\SN12345678",
    "valid": true,
    "whitelisted": true,
    "configured": false
  }
]
```

- `valid` — the port exposes all identifiers needed for a stable scanner id
- `whitelisted` — the device matches an entry in `whitelist.json`
- `configured` — the device matches an entry in `configs.json`

Copy `vendorId` / `productId` / `serialNumber` into `whitelist.json` to allow
the device, and into `configs.json` to tune serial parameters.


## Configuration

### `.env`

| Variable            | Default          | Description                                                                 |
| ------------------- | ---------------- | --------------------------------------------------------------------------- |
| `SCANNER_NAMESPACE` | — (required)     | Any unique UUID. Used to generate stable scanner ids (uuid v5)              |
| `HOST`              | `localhost`      | HTTP bind address. Use `0.0.0.0` to accept remote connections               |
| `PORT`              | `55100`          | HTTP port                                                                    |
| `LOG_LEVEL`         | `debug` / `info` | `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace` (dev / prod)             |
| `CORS_ORIGIN`       | open in dev      | Comma-separated allowed CORS origins. In production CORS is off unless set  |
| `NODE_ENV`          | `development`    | `production` disables Swagger UI and pretty logs                            |

### `whitelist.json`

Which devices the service is allowed to use. If a device is not listed, it is
invisible to the API. All fields are optional — an entry matches any value of
the fields it does not specify:

```json
[
  { "vendorId": "0C2E" },
  { "vendorId": "1A86", "productId": "7523" },
  { "serialNumber": "SN12345678" }
]
```

### `configs.json`

Serial parameters per device. Entries are merged onto built-in defaults
(`baudRate: 115200`, delimiter `\r\n|\r|\n`, `utf-8`) by specificity:
`vendorId` → `vendorId+productId` → `vendorId+productId+serialNumber`:

```json
[
  {
    "vendorId": "1A86",
    "productId": "7523",
    "openOptions": {
      "baudRate": 9600,
      "parity": "even",
      "dataBits": 7,
      "stopBits": 1.5
    },
    "parserOptions": {
      "regex": "\r\n",
      "encoding": "utf-8"
    }
  }
]
```

`openOptions` are passed to [serialport](https://serialport.io/docs/api-serialport)
(`baudRate` is required, the rest are optional). `parserOptions` configure the
built-in `RegexParser`: `regex` is the delimiter that ends a scan, `encoding`
is how the payload is decoded.

## API

Base URL: `http://localhost:55100`. Interactive docs: `http://localhost:55100/docs`
(development mode only).

### `GET /scanners`

Detected scanners (whitelisted and currently connected):

```json
[
  { "id": "3f8b1c2e-...", "path": "COM5", "vendorId": "1A86", "productId": "7523" }
]
```

### `GET /scanners/:id/poll`

Waits until a barcode is scanned and returns its value.

| Query param | Type                                                | Default   | Description               |
| ----------- | --------------------------------------------------- | --------- | ------------------------- |
| `lockState` | `permanent`\|`parallel`\|`on_demand`\|`daemon`      | `on_demand` | Session locking mode    |
| `timeout`   | int, 1500–30000 ms                                  | 5000      | How long to wait for a scan |

```bash
curl "http://localhost:55100/scanners/3f8b1c2e-.../poll?timeout=10000"
```

```json
{ "status": "success", "data": "4600719000123" }
```

**Lock states** — how concurrent pollers share one scanner:

- `on_demand` (default) — a new poll cancels all other `on_demand`/`parallel`
  pollers. Use for simple "one consumer" setups.
- `parallel` — several pollers may wait simultaneously; each scan is delivered
  to all of them. Cannot be created while an `on_demand` session exists.
- `permanent` — kicks out everyone except `daemon` sessions and holds the
  scanner until stopped. Cannot be created while a `permanent` session exists.
- `daemon` — a background listener that receives scans, but yields to
  `permanent`/`on_demand` sessions while they are active.

**Errors:**

| Code | Meaning                                                      |
| ---- | ------------------------------------------------------------ |
| 404  | Unknown scanner id                                            |
| 408  | Timeout — nothing was scanned in time                         |
| 409  | Session aborted (cancelled by another poller or `stop`)       |
| 503  | Serial port error or session conflict (e.g. permanent exists) |
| 500  | Internal error                                                |

### `POST /scanners/:id/stop`

Aborts all active sessions for the scanner.

```bash
curl -X POST http://localhost:55100/scanners/3f8b1c2e-.../stop
# { "status": "success" }
```

### `GET /scanners/:id/isAlive`

```json
{ "alive": true }
```

Returns `404` if the scanner is unknown or disconnected.

### `GET /ports`

All serial ports on the machine with detection status — see
[Discovering your scanner](#discovering-your-scanner).

### `GET /sessions`

Active scan sessions:

```json
[
  {
    "id": "9c1f2b7a-...",
    "scannerId": "3f8b1c2e-...",
    "lockState": "permanent",
    "blockedBy": "aaaa1111-..."
  }
]
```

### `DELETE /sessions/:id`

Aborts a single session.

## Development

```bash
npm run dev       # run with tsx + pretty logs + Swagger UI
npm run build     # compile to dist/
npm start         # run compiled output
npm test          # run tests (vitest)
npm run lint      # eslint
npm run format    # prettier
```

## License

[Apache-2.0](LICENSE)


