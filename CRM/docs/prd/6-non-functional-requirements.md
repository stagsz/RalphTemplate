# 6. Non-Functional Requirements

## 6.1 Performance
- **Page Load:** P95 < 2 seconds on 4G
- **API Latency:** P95 < 500ms
- **Database Queries:** No query > 100ms

## 6.2 Security
- **Authentication:** Email/password + 2FA (optional)
- **Authorization:** Role-based access control
- **Data Encryption:** At rest (database) and in transit (HTTPS)
- **Password Policy:** Min 8 characters, require letters + numbers

## 6.3 Scalability
- **Users:** Support up to 500 concurrent users
- **Data:** Handle 100,000 contacts, 50,000 deals
- **Growth:** Architecture supports 10x growth without major refactor

## 6.4 Reliability
- **Uptime:** 99.5% availability target
- **Data Backup:** Daily automated backups
- **Recovery:** RTO < 4 hours, RPO < 1 hour

---
