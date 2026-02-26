# AutoRepairShop Management System

Multi-tenant auto repair shop management platform.
12 Spring Boot microservices + React frontend + PostgreSQL + Kafka + Keycloak + MinIO.

---

## Gereksinimler

- **Java 17+** (JDK)
- **Maven 3.8+** (veya projedeki `mvnw` wrapper)
- **Node.js 18+** ve npm
- **Docker & Docker Compose**
- **PostgreSQL 15** (Docker Compose ile otomatik gelir)

---

## ADIM 1: Altyapi Servislerini Baslat

```bash
cd infra
docker-compose up -d
```

Bu komut asagidakileri otomatik baslatir:
- **PostgreSQL** (port 5432) — tum veritabanlari `init-db.sql` ile otomatik olusturulur
- **Kafka** (port 9092)
- **Keycloak** (port 9080) — realm otomatik import edilir
- **MinIO** (port 9000/9001)
- **Prometheus** (port 9090)
- **Grafana** (port 3000)

Kontrol:
```bash
docker-compose ps
```
Tum servislerin "healthy" veya "running" oldugunu dogrulayin.

---

## ADIM 2: Backend Build

```bash
cd ..
mvnw clean install -DskipTests
```

Windows icin:
```bash
mvnw.cmd clean install -DskipTests
```

---

## ADIM 3: Backend Servisleri Calistir

Her servisi ayri terminalde baslatin (sirasi onemli degil, ama gateway en son olabilir):

```bash
java -jar services/tenantadmin-service/target/tenantadmin-service-1.0.0-SNAPSHOT.jar
java -jar services/customer-service/target/customer-service-1.0.0-SNAPSHOT.jar
java -jar services/vehicle-service/target/vehicle-service-1.0.0-SNAPSHOT.jar
java -jar services/workorder-service/target/workorder-service-1.0.0-SNAPSHOT.jar
java -jar services/inventory-service/target/inventory-service-1.0.0-SNAPSHOT.jar
java -jar services/payment-service/target/payment-service-1.0.0-SNAPSHOT.jar
java -jar services/appointment-service/target/appointment-service-1.0.0-SNAPSHOT.jar
java -jar services/file-service/target/file-service-1.0.0-SNAPSHOT.jar
java -jar services/audit-service/target/audit-service-1.0.0-SNAPSHOT.jar
java -jar services/notification-service/target/notification-service-1.0.0-SNAPSHOT.jar
java -jar services/query-bff-service/target/query-bff-service-1.0.0-SNAPSHOT.jar
java -jar services/gateway-service/target/gateway-service-1.0.0-SNAPSHOT.jar
```

Servis portlari:

| Servis | Port |
|--------|------|
| Gateway | 8080 |
| TenantAdmin | 8081 |
| Customer | 8082 |
| Vehicle | 8083 |
| WorkOrder | 8084 |
| Inventory | 8085 |
| Payment | 8086 |
| Appointment | 8087 |
| File | 8088 |
| Audit | 8089 |
| Notification | 8090 |
| Query BFF | 8091 |

---

## ADIM 4: Frontend Calistir

```bash
cd frontend
npm install
npm run dev
```

Erisim: http://localhost:5173
Varsayilan kullanici: `owner@demo.com` / `password123`

---

## ADIM 5: Saglik Kontrolleri

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8084/actuator/health
```

Tum servisler icin `/actuator/health` endpoint'i `{"status":"UP"}` donmelidir.

---

## PRODUCTION DEPLOYMENT

### Environment Variable Listesi

Tum servisler `${ENV_VAR:varsayilan}` formatini kullanir.
Lokal gelistirmede hicbir sey ayarlamaniza gerek yok — varsayilanlar calisiir.
Production'da asagidaki env var'lari set edin:

| Degisken | Aciklama | Varsayilan |
|----------|----------|------------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Veritabani adi | (servis bazli) |
| `DB_USERNAME` | DB kullanici | postgres |
| `DB_PASSWORD` | DB sifre | postgres |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka adresi | localhost:9092 |
| `KEYCLOAK_ISSUER_URI` | Keycloak issuer URL | http://localhost:9080/realms/autorepairshop |
| `KEYCLOAK_JWK_SET_URI` | Keycloak JWK URL | http://localhost:9080/realms/autorepairshop/protocol/openid-connect/certs |
| `FRONTEND_URL` | Frontend URL (Gateway CORS) | http://localhost:5173 |
| `MINIO_URL` | MinIO URL (sadece file-service) | http://localhost:9000 |
| `MINIO_ACCESS_KEY` | MinIO erisim anahtari | minioadmin |
| `MINIO_SECRET_KEY` | MinIO gizli anahtar | minioadmin |
| `MINIO_BUCKET` | MinIO bucket | autorepairshop-files |

**Gateway icin ek degiskenler** (downstream servis adresleri):

| Degisken | Varsayilan |
|----------|------------|
| `TENANTADMIN_SERVICE_URL` | http://localhost:8081 |
| `CUSTOMER_SERVICE_URL` | http://localhost:8082 |
| `VEHICLE_SERVICE_URL` | http://localhost:8083 |
| `WORKORDER_SERVICE_URL` | http://localhost:8084 |
| `INVENTORY_SERVICE_URL` | http://localhost:8085 |
| `PAYMENT_SERVICE_URL` | http://localhost:8086 |
| `APPOINTMENT_SERVICE_URL` | http://localhost:8087 |
| `FILE_SERVICE_URL` | http://localhost:8088 |
| `QUERY_BFF_SERVICE_URL` | http://localhost:8091 |

**Query BFF icin ek degiskenler**:

| Degisken | Varsayilan |
|----------|------------|
| `CUSTOMER_SERVICE_URL` | http://localhost:8082 |
| `VEHICLE_SERVICE_URL` | http://localhost:8083 |
| `WORKORDER_SERVICE_URL` | http://localhost:8084 |
| `PAYMENT_SERVICE_URL` | http://localhost:8086 |

### Ornek: Farkli PC'de Calistirma

Eger PostgreSQL farkli bir makinede (orn: 192.168.1.50):
```bash
set DB_HOST=192.168.1.50
set DB_PASSWORD=guclu_sifre_123
java -jar services/workorder-service/target/workorder-service-1.0.0-SNAPSHOT.jar
```

Linux/Mac:
```bash
DB_HOST=192.168.1.50 DB_PASSWORD=guclu_sifre_123 java -jar services/workorder-service/target/workorder-service-1.0.0-SNAPSHOT.jar
```

### Docker ile Production Deploy

```bash
# 1. Imajlari olustur
cd services/gateway-service && docker build -t autorepairshop/gateway-service . && cd ../..
cd services/customer-service && docker build -t autorepairshop/customer-service . && cd ../..
# ... diger servisler icin ayni

# 2. docker-compose ile calistir (env var'lar .env dosyasindan okunur)
docker-compose -f infra/docker-compose.yml up -d
```

### Kubernetes ile Deploy

```bash
# 1. Namespace olustur
kubectl create namespace autorepairshop

# 2. Secret'lari olustur
kubectl create secret generic db-credentials \
  --from-literal=DB_HOST=postgres-host \
  --from-literal=DB_USERNAME=postgres \
  --from-literal=DB_PASSWORD=guclu_sifre \
  -n autorepairshop

# 3. Tum servisleri deploy et
kubectl apply -k infra/k8s/base
```

### Frontend Production Build

```bash
cd frontend

# .env.production dosyasi olustur
echo VITE_API_BASE_URL=https://api.sizin-domain.com > .env.production
echo VITE_KEYCLOAK_URL=https://auth.sizin-domain.com >> .env.production
echo VITE_KEYCLOAK_REALM=autorepairshop >> .env.production
echo VITE_KEYCLOAK_CLIENT_ID=frontend >> .env.production

npm install
npm run build
# dist/ klasorunu hosting'e yukleyin (Nginx, S3, Netlify, vs.)
```

---

## Production'da Degistirilmesi ZORUNLU Seyler

1. **Sifreler**: PostgreSQL, Keycloak admin, MinIO, Keycloak client secret
2. **Keycloak realm**: `infra/keycloak/realm-export.json` icindeki `sslRequired` degerini `"external"` yapin
3. **Keycloak redirect URI**: localhost yerine production domain adresi
4. **CORS**: `FRONTEND_URL` env var ile production frontend adresi

---

## Sorun Giderme

| Hata | Cozum |
|------|-------|
| `database "xxx_db" does not exist` | `docker-compose up -d` ile PostgreSQL'i baslatin, `init-db.sql` otomatik calisir |
| `Connection refused: localhost:9092` | Kafka container'inin calistigindan emin olun: `docker-compose ps` |
| `Connection refused: localhost:9080` | Keycloak container'inin calistigindan emin olun |
| Port zaten kullanimda | Ilgili servisi durdurun veya `server.port` override edin |
| Flyway checksum hatasi | `spring.flyway.repair` ile onarim yapin |

---

## Proje Yapisi

```
repair/
  pom.xml                          # Root Maven POM
  services/
    gateway-service/               # API Gateway (8080)
    tenantadmin-service/           # Tenant yonetimi (8081)
    customer-service/              # Musteri yonetimi (8082)
    vehicle-service/               # Arac yonetimi (8083)
    workorder-service/             # Is emri yonetimi (8084)
    inventory-service/             # Envanter yonetimi (8085)
    payment-service/               # Odeme yonetimi (8086)
    appointment-service/           # Randevu yonetimi (8087)
    file-service/                  # Dosya yonetimi (8088)
    audit-service/                 # Denetim kayitlari (8089)
    notification-service/          # Bildirim servisi (8090)
    query-bff-service/             # Query BFF (8091)
  libs/                            # Paylasilan kutuphaneler
  frontend/                        # React + TypeScript + Vite
  infra/
    docker-compose.yml             # Altyapi servisleri
    init-db.sql                    # Veritabani olusturma scripti
    keycloak/realm-export.json     # Keycloak realm
    k8s/                           # Kubernetes manifest'leri
    observability/                 # Prometheus + Grafana
  .github/workflows/              # CI/CD
```
